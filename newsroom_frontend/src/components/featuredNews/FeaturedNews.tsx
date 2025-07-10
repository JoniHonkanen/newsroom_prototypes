import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import styles from "./FeaturedNews.module.css";
import type { NewsItem } from "@/types/news";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

export default function FeaturedNews({ news }: { news: NewsItem }) {
  const locale = useLocale();

  // Tarkista että uutisessa on summary (featured news vaatii sen)
  if (!news.summary) {
    return null;
  }

  const slug = SLUGS[locale as keyof typeof SLUGS] || "uutinen";
  const url = `/${locale}/${slug}/${news.id}-${news.url_slug}`;

  // Käytä published_at jos saatavilla, muuten updated_at tai created_at
  const publishDate = news.published_at || news.updated_at || news.created_at;
  const formattedDate = publishDate
    ? new Date(publishDate).toLocaleDateString(locale)
    : "";

  return (
    <Link href={url} className={styles.link}>
      <section className={styles.featuredNews}>
        <div className={styles.featuredContent}>
          <h1 className={styles.title}>{news.title}</h1>

          {/* Käytä lead jos saatavilla, muuten summary */}
          {news.lead && <p className={styles.lead}>{news.lead}</p>}
          {!news.lead && news.summary && (
            <p className={styles.summary}>{news.summary}</p>
          )}

          <div className={styles.meta}>
            {news.author && <div>{news.author}</div>}
            {formattedDate && <div>{formattedDate}</div>}
            {news.read_time_minutes && <div>{news.read_time_minutes} min</div>}

            {/* Näytä kieli jos ei ole nykyinen locale */}
            {news.language && news.language !== locale && (
              <div className={styles.language}>
                {news.language.toUpperCase()}
              </div>
            )}

            {/* Näytä status jos ei ole published */}
            {news.status && news.status !== "published" && (
              <div className={styles.status}>{news.status}</div>
            )}
          </div>

          {/* Näytä location_tags jos saatavilla */}
          {news.location_tags &&
            Array.isArray(news.location_tags) &&
            news.location_tags.length > 0 && (
              <div className={styles.locationTags}>
                {news.location_tags.map((tag, index) => {
                  try {
                    const parsed = JSON.parse(tag);
                    if (parsed.locations && Array.isArray(parsed.locations)) {
                      type Location = {
                        city?: string;
                        region?: string;
                        country?: string;
                      };
                      return parsed.locations.map(
                        (location: Location, locIndex: number) => (
                          <span
                            key={`${index}-${locIndex}`}
                            className={styles.locationTag}
                          >
                            {location.city ||
                              location.region ||
                              location.country}
                          </span>
                        )
                      );
                    }
                  } catch (e: unknown) {
                    console.log("Error parsing location tag:", e);
                    return (
                      <span key={index} className={styles.locationTag}>
                        {tag}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            )}

          {/* Näytä sources jos saatavilla - FIXED: Added proper type checking */}
          {news.sources && Array.isArray(news.sources) && news.sources.length > 0 && (
            <div className={styles.sources}>
              <span className={styles.sourcesLabel}>Lähteet: </span>
              {news.sources.map((source, index) => (
                <span key={index} className={styles.source}>
                  {source}
                  {index < (news.sources?.length ?? 0) - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.featuredImage}>
          <Image
            src={news.image_url}
            alt={news.title}
            width={680}
            height={420}
            className={styles.image}
            priority
          />
        </div>
      </section>
    </Link>
  );
}