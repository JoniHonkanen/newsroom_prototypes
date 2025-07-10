import pool from './database.js';

export default {
  Query: {
    // Hae kaikki uutiset
    news: async (_, { offset, limit }) => {
      try {
        const effectiveLimit = limit || 17; 
        const effectiveOffset = offset || 0;
        const result = await pool.query(`
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          ORDER BY published_at DESC
          LIMIT $1 OFFSET $2
        `, [effectiveLimit, effectiveOffset]);
        return result.rows.map(row => ({
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        }));
      } catch (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news articles');
      }
    },

    // Hae yksittäinen uutinen ID:n perusteella
    newsArticle: async (_, { id }) => {
      try {
        const result = await pool.query(`
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        };
      } catch (error) {
        console.error('Error fetching news article:', error);
        throw new Error('Failed to fetch news article');
      }
    },

    // Hae uutiset kielen perusteella
    newsByLanguage: async (_, { language }) => {
      try {
        const result = await pool.query(`
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          WHERE language = $1
          ORDER BY published_at DESC
        `, [language]);

        return result.rows.map(row => ({
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        }));
      } catch (error) {
        console.error('Error fetching news by language:', error);
        throw new Error('Failed to fetch news articles by language');
      }
    },

    // Hae uutiset statuksen perusteella
    newsByStatus: async (_, { status }) => {
      try {
        const result = await pool.query(`
          SELECT 
            id, canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content,
            published_at, updated_at, original_article_type
          FROM news_article 
          WHERE status = $1
          ORDER BY published_at DESC
        `, [status]);

        return result.rows.map(row => ({
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        }));
      } catch (error) {
        console.error('Error fetching news by status:', error);
        throw new Error('Failed to fetch news articles by status');
      }
    }
  },

  Mutation: {
    // Luo uusi uutinen
    createNewsArticle: async (_, { input }) => {
      try {
        const {
          canonical_news_id, language, version, lead, summary, status,
          location_tags, sources, interviews, review_status, author,
          body_blocks, enrichment_status, markdown_content, original_article_type
        } = input;

        const result = await pool.query(`
          INSERT INTO news_article (
            canonical_news_id, language, version, lead, summary, status,
            location_tags, sources, interviews, review_status, author,
            body_blocks, enrichment_status, markdown_content, original_article_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `, [
          canonical_news_id, language, version, lead, summary, status,
          location_tags ? JSON.parse(location_tags) : null,
          sources ? JSON.parse(sources) : null,
          interviews ? JSON.parse(interviews) : null,
          review_status, author,
          body_blocks ? JSON.parse(body_blocks) : null,
          enrichment_status, markdown_content, original_article_type
        ]);

        const row = result.rows[0];
        return {
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        };
      } catch (error) {
        console.error('Error creating news article:', error);
        throw new Error('Failed to create news article');
      }
    },

    // Päivitä uutinen
    updateNewsArticle: async (_, { id, input }) => {
      try {
        const {
          canonical_news_id, language, version, lead, summary, status,
          location_tags, sources, interviews, review_status, author,
          body_blocks, enrichment_status, markdown_content, original_article_type
        } = input;

        const result = await pool.query(`
          UPDATE news_article SET
            canonical_news_id = $2, language = $3, version = $4, lead = $5,
            summary = $6, status = $7, location_tags = $8, sources = $9,
            interviews = $10, review_status = $11, author = $12,
            body_blocks = $13, enrichment_status = $14, markdown_content = $15,
            original_article_type = $16, updated_at = now()
          WHERE id = $1
          RETURNING *
        `, [
          id, canonical_news_id, language, version, lead, summary, status,
          location_tags ? JSON.parse(location_tags) : null,
          sources ? JSON.parse(sources) : null,
          interviews ? JSON.parse(interviews) : null,
          review_status, author,
          body_blocks ? JSON.parse(body_blocks) : null,
          enrichment_status, markdown_content, original_article_type
        ]);

        if (result.rows.length === 0) {
          throw new Error('News article not found');
        }

        const row = result.rows[0];
        return {
          ...row,
          location_tags: row.location_tags ? JSON.stringify(row.location_tags) : null,
          sources: row.sources ? JSON.stringify(row.sources) : null,
          interviews: row.interviews ? JSON.stringify(row.interviews) : null,
          body_blocks: row.body_blocks ? JSON.stringify(row.body_blocks) : null,
          published_at: row.published_at?.toISOString(),
          updated_at: row.updated_at?.toISOString()
        };
      } catch (error) {
        console.error('Error updating news article:', error);
        throw new Error('Failed to update news article');
      }
    },

    // Poista uutinen
    deleteNewsArticle: async (_, { id }) => {
      try {
        const result = await pool.query('DELETE FROM news_article WHERE id = $1', [id]);
        return result.rowCount > 0;
      } catch (error) {
        console.error('Error deleting news article:', error);
        throw new Error('Failed to delete news article');
      }
    }
  }
};
