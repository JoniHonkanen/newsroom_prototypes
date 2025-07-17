import { NewsItem, BodyBlock } from "@/types/news";
import styles from "./SingleNews.module.css";
import { JSX } from "react";
import Image from "next/image";

export function SingleNews({
  news,
  locale,
}: {
  news: NewsItem;
  locale: string;
}) {
  // Funktio lukuajan arvioimiseen sanojen määrän perusteella
  const estimateReadTime = (content: string): number => {
    if (!content) return 1;
    const wordsPerMinute = 200; // Keskimääräinen lukemisnopeus
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  // Pura body_blocks - nyt ne tulevat suoraan objekteina GraphQL:stä
  const bodyContent = news.body_blocks || [];
  const readTime = estimateReadTime(news.markdown_content || "");

  // Renderöi body blocks - nyt suoraan ilman JSON.parse
  const renderBodyBlocks = (blocks: BodyBlock[]): JSX.Element[] => {
    if (!Array.isArray(blocks) || blocks.length === 0) return [];

    // Järjestä blokit order-kentän mukaan
    const sortedBlocks = [...blocks].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    return sortedBlocks.map((block, index) => {
      // Käytä order-kenttää key:nä jos saatavilla
      const key = block.order || index;

      switch (block.type) {
        case "text":
          return (
            <div
              key={key}
              className={styles.paragraph}
              dangerouslySetInnerHTML={{
                __html: block.html || block.content || "",
              }}
            />
          );
        case "h1":
          return (
            <h1
              key={key}
              className={`${styles.heading} ${styles.h1}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "h2":
          return (
            <h2
              key={key}
              className={`${styles.heading} ${styles.h2}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "h3":
          return (
            <h3
              key={key}
              className={`${styles.heading} ${styles.h3}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "h4":
          return (
            <h4
              key={key}
              className={`${styles.heading} ${styles.h4}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "h5":
          return (
            <h5
              key={key}
              className={`${styles.heading} ${styles.h5}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "h6":
          return (
            <h6
              key={key}
              className={`${styles.heading} ${styles.h6}`}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        case "list":
          return (
            <div
              key={key}
              className={styles.list}
              dangerouslySetInnerHTML={{ __html: block.html || "" }}
            />
          );
        case "quote":
          return (
            <blockquote
              key={key}
              className={styles.blockquote}
              dangerouslySetInnerHTML={{ __html: block.content || "" }}
            />
          );
        default:
          // Jos tyyppi ei tunnistettu, renderöi HTML-sisältö
          if (block.html) {
            return (
              <div
                key={key}
                className={styles.unknownBlock}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );
          }
          return <div key={key}></div>;
      }
    });
  };

  // Type guard -funktio Source-objektin tarkistamiseen
  const isSourceObject = (
    source: unknown
  ): source is { url?: string; title?: string; source?: string } => {
    return typeof source === "object" && source !== null;
  };

  // Renderöi sijainti-tagit
  const renderLocationTags = () => {
    if (!news.location_tags?.locations?.length) return null;

    return news.location_tags.locations
      .map((location, index) => {
        const locationParts = [
          location.city,
          location.region,
          location.country,
          location.continent,
        ].filter(Boolean);

        const locationString = locationParts.join(", ");

        return locationString ? (
          <span key={index} className={styles.locationTag}>
            {locationString}
          </span>
        ) : null;
      })
      .filter(Boolean);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.heroSection}>
        <div className={styles.heroImage}>
          <Image
            src={news.image_url || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"}
            alt={news.title || "Uutiskuva"}
            fill
            className={styles.heroImg}
            style={{ objectFit: "cover" }}
            priority
          />
          <div className={styles.heroOverlay} />
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            {news.main_category && (
              <span className={styles.category}>{news.main_category}</span>
            )}
            {news.featured && (
              <span className={styles.featuredBadge}>FEATURED</span>
            )}
          </div>
          
          <h1 className={styles.heroTitle}>{news.title}</h1>
          
          {news.lead && (
            <div className={styles.heroLead}>{news.lead}</div>
          )}
          
          <div className={styles.heroMetaInfo}>
            <div className={styles.metaRow}>
              {news.author && (
                <span className={styles.author}>{news.author}</span>
              )}
              {news.published_at && (
                <time
                  className={styles.publishDate}
                  dateTime={news.published_at}
                >
                  {new Date(news.published_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              <span className={styles.readTime}>{readTime} min read</span>
            </div>
            
            {news.location_tags?.locations?.length && (
              <div className={styles.locationTags}>{renderLocationTags()}</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <article className={styles.article}>
          {/* Summary erillisenä jos eri kuin lead */}
          {news.summary && news.summary !== news.lead && (
            <div className={styles.articleSummary}>{news.summary}</div>
          )}

          {/* Article Body */}
          <div className={styles.articleBody}>
            {bodyContent.length > 0 ? (
              renderBodyBlocks(bodyContent)
            ) : news.markdown_content ? (
              <div
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{ __html: news.markdown_content }}
              />
            ) : (
              <p className={styles.noContent}>No content available</p>
            )}
          </div>

          {/* Article Footer */}
          <footer className={styles.articleFooter}>
            {/* Sources */}
            {news.sources && news.sources.length > 0 && (
              <div className={styles.sources}>
                <h3 className={styles.sourcesTitle}>Sources</h3>
                <ul className={styles.sourcesList}>
                  {news.sources.map((source, index) => {
                    if (isSourceObject(source)) {
                      return (
                        <li key={index} className={styles.sourceItem}>
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.sourceLink}
                            >
                              {source.title || source.url}
                            </a>
                          ) : (
                            source.title || source.source || "Unknown source"
                          )}
                        </li>
                      );
                    } else {
                      return (
                        <li key={index} className={styles.sourceItem}>
                          {String(source)}
                        </li>
                      );
                    }
                  })}
                </ul>
              </div>
            )}

            {/* Article Status and Version Info */}
            <div className={styles.articleInfo}>
              {news.updated_at && news.updated_at !== news.published_at && (
                <p className={styles.lastUpdated}>
                  Last updated:{" "}
                  {new Date(news.updated_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {news.version && (
                <p className={styles.version}>Version {news.version}</p>
              )}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}