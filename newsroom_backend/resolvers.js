import pool from "./database.js";

//With this we remove "markdown" from lead (title)
const removeMarkdownSyntax = (text) => {
  if (!text || typeof text !== "string") return text;

  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default {
  Query: {
    // Hae kaikki uutiset
    news: async (_, { offset, limit, totalLimit }) => {
      try {
        const effectiveLimit = limit || 17;
        const effectiveOffset = offset || 0;
        const maxLimit = totalLimit || 100; // Defaulttaa 100:aan

        const remainingCount = Math.max(0, maxLimit - effectiveOffset);
        const finalLimit = Math.min(effectiveLimit, remainingCount);

        if (finalLimit <= 0) {
          return [];
        }

        const result = await pool.query(
          `
      SELECT 
        id, language, lead, summary,
        published_at, updated_at
      FROM news_article 
      WHERE COALESCE(featured, false) = false
      ORDER BY published_at DESC
      LIMIT $1 OFFSET $2
    `,
          [finalLimit, effectiveOffset]
        );

        return result.rows.map((row) => ({
          ...row,
          lead: removeMarkdownSyntax(row.lead),
          location_tags: row.location_tags || null,
          sources: row.sources || null,
          interviews: row.interviews || null,
          body_blocks: row.body_blocks || null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching news:", error);
        throw new Error("Failed to fetch news articles");
      }
    },

    featuredNews: async (_, { limit, offset, totalLimit }) => {
      try {
        const effectiveLimit = limit || 2;
        const effectiveOffset = offset || 0;
        const maxLimit = totalLimit || 100; // Defaulttaa 100:aan

        const remainingCount = Math.max(0, maxLimit - effectiveOffset);
        const finalLimit = Math.min(effectiveLimit, remainingCount);

        if (finalLimit <= 0) {
          return [];
        }

        const result = await pool.query(
          `
      SELECT 
        id, language, lead, summary,
        location_tags, author,
        published_at, updated_at, featured
      FROM news_article 
      WHERE featured = true
      ORDER BY published_at DESC
      LIMIT $1 OFFSET $2
    `,
          [finalLimit, effectiveOffset]
        );

        return result.rows.map((row) => ({
          ...row,
          lead: removeMarkdownSyntax(row.lead),
          location_tags: row.location_tags || null,
          sources: row.sources || null,
          interviews: row.interviews || null,
          body_blocks: row.body_blocks || null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching featured news:", error);
        throw new Error("Failed to fetch featured news articles");
      }
    },

    // Hae yksittäinen uutinen ID:n perusteella
    newsArticle: async (_, { id }) => {
      try {
        const result = await pool.query(
          `
      SELECT 
        id, canonical_news_id, language, version, lead, summary, status,
        location_tags, sources, interviews, review_status, author,
        body_blocks, enrichment_status, markdown_content,
        published_at, updated_at, original_article_type, featured
      FROM news_article 
      WHERE id = $1
    `,
          [id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];

        // Parse JSON fields properly and return as objects/arrays
        let locationTags = null;
        if (row.location_tags) {
          try {
            locationTags =
              typeof row.location_tags === "string"
                ? JSON.parse(row.location_tags)
                : row.location_tags;
          } catch (e) {
            console.error("Error parsing location_tags:", e);
          }
        }

        let sources = [];
        if (row.sources) {
          try {
            const parsedSources =
              typeof row.sources === "string"
                ? JSON.parse(row.sources)
                : row.sources;
            sources = Array.isArray(parsedSources) ? parsedSources : [];
          } catch (e) {
            console.error("Error parsing sources:", e);
            sources = [];
          }
        }

        let interviews = [];
        if (row.interviews) {
          try {
            const parsedInterviews =
              typeof row.interviews === "string"
                ? JSON.parse(row.interviews)
                : row.interviews;
            interviews = Array.isArray(parsedInterviews)
              ? parsedInterviews
              : [];
          } catch (e) {
            console.error("Error parsing interviews:", e);
            interviews = [];
          }
        }

        // Parse body_blocks and return as array of objects
        let bodyBlocks = [];
        if (row.body_blocks) {
          try {
            const parsedBlocks =
              typeof row.body_blocks === "string"
                ? JSON.parse(row.body_blocks)
                : row.body_blocks;

            if (Array.isArray(parsedBlocks)) {
              // Ensure each block has required fields
              bodyBlocks = parsedBlocks.map((block) => ({
                html: block.html || null,
                type: block.type || "text",
                order: block.order || 0,
                content: block.content || null,
              }));
            }
          } catch (e) {
            console.error("Error parsing body_blocks:", e);
            bodyBlocks = [];
          }
        }

        console.log("Body blocks before return:", bodyBlocks);

        return {
          ...row,
          location_tags: locationTags,
          sources: sources,
          interviews: interviews,
          body_blocks: bodyBlocks, // Now returns proper array of objects!
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        };
      } catch (error) {
        console.error("Error fetching news article:", error);
        throw new Error("Failed to fetch news article");
      }
    },

    // Hae uutiset kielen perusteella
    newsByLanguage: async (_, { language }) => {
      try {
        const result = await pool.query(
          `
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          WHERE language = $1
          ORDER BY published_at DESC
        `,
          [language]
        );

        return result.rows.map((row) => ({
          ...row,
          location_tags: row.location_tags
            ? JSON.stringify(row.location_tags)
            : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching news by language:", error);
        throw new Error("Failed to fetch news articles by language");
      }
    },

    // Hae uutiset statuksen perusteella
    newsByStatus: async (_, { status }) => {
      try {
        const result = await pool.query(
          `
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          WHERE status = $1
          ORDER BY published_at DESC
        `,
          [status]
        );

        return result.rows.map((row) => ({
          ...row,
          location_tags: row.location_tags
            ? JSON.stringify(row.location_tags)
            : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching news by status:", error);
        throw new Error("Failed to fetch news articles by status");
      }
    },
  },

  Mutation: {
    // Luo uusi uutinen
    createNewsArticle: async (_, { input }) => {
      try {
        const {
          canonical_news_id,
          language,
          version,
          lead,
          summary,
          status,
          location_tags,
          sources,
          interviews,
          review_status,
          author,
          body_blocks,
          enrichment_status,
          markdown_content,
          original_article_type,
        } = input;

        const result = await pool.query(
          `
          INSERT INTO news_article (
            canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content, original_article_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `,
          [
            canonical_news_id,
            language,
            version,
            lead,
            summary,
            status,
            location_tags ? JSON.parse(location_tags) : null,
            sources ? JSON.parse(sources) : null,
            interviews ? JSON.parse(interviews) : null,
            review_status,
            author,
            body_blocks ? JSON.parse(body_blocks) : null,
            enrichment_status,
            markdown_content,
            original_article_type,
          ]
        );

        const row = result.rows[0];
        return {
          ...row,
          location_tags: row.location_tags
            ? JSON.stringify(row.location_tags)
            : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        };
      } catch (error) {
        console.error("Error creating news article:", error);
        throw new Error("Failed to create news article");
      }
    },

    // Päivitä uutinen
    updateNewsArticle: async (_, { id, input }) => {
      try {
        const {
          canonical_news_id,
          language,
          version,
          lead,
          summary,
          status,
          location_tags,
          sources,
          interviews,
          review_status,
          author,
          body_blocks,
          enrichment_status,
          markdown_content,
          original_article_type,
        } = input;

        const result = await pool.query(
          `
          UPDATE news_article SET
            canonical_news_id = $2, language = $3, version = $4, lead = $5,
            summary = $6, status = $7, location_tags = $8, sources = $9,
            interviews = $10, review_status = $11, author = $12,
            body_blocks = $13, enrichment_status = $14, markdown_content = $15,
            original_article_type = $16, updated_at = now()
          WHERE id = $1
          RETURNING *
        `,
          [
            id,
            canonical_news_id,
            language,
            version,
            lead,
            summary,
            status,
            location_tags ? JSON.parse(location_tags) : null,
            sources ? JSON.parse(sources) : null,
            interviews ? JSON.parse(interviews) : null,
            review_status,
            author,
            body_blocks ? JSON.parse(body_blocks) : null,
            enrichment_status,
            markdown_content,
            original_article_type,
          ]
        );

        if (result.rows.length === 0) {
          throw new Error("News article not found");
        }

        const row = result.rows[0];
        return {
          ...row,
          location_tags: row.location_tags
            ? JSON.stringify(row.location_tags)
            : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        };
      } catch (error) {
        console.error("Error updating news article:", error);
        throw new Error("Failed to update news article");
      }
    },

    // Poista uutinen
    deleteNewsArticle: async (_, { id }) => {
      try {
        const result = await pool.query(
          "DELETE FROM news_article WHERE id = $1",
          [id]
        );
        return result.rowCount > 0;
      } catch (error) {
        console.error("Error deleting news article:", error);
        throw new Error("Failed to delete news article");
      }
    },
  },
};
