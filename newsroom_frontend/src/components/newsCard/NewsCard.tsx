import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import styles from "./NewsCard.module.css";
import type { NewsItem } from "@/types/news";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

export default function NewsCard({ news }: { news: NewsItem }) {
  const locale = useLocale();

  // Use published_at if available, fallback to updated_at or created_at
  const displayDate = news.published_at || news.updated_at || news.created_at;

  // Formatoi päivämäärä/aika logiikka
  const formatPublishDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    // Tarkista onko sama päivä
    const isSameDay =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isSameDay) {
      // Pakota kaksoispiste-muoto kellonaikaan
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      // Näytä päivämäärä jos eri päivä - käytä pistettä päivämäärässä
      return date.toLocaleDateString(locale, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    }
  };

  const formattedTime = displayDate ? formatPublishDate(displayDate) : "";

  const slug = SLUGS[locale as keyof typeof SLUGS] || "uutinen";
  const url = `/${locale}/${slug}/${news.id}-${news.url_slug || "uutinen"}`;

  return (
    <article className={styles.card}>
      <Link href={url} className={styles.cardLink}>
        <div className={styles.content}>
          <h3 className={styles.title}>{news.lead}</h3>

          {news.lead && news.summary && (
            <p className={styles.summary}>{news.summary}</p>
          )}

          <div className={styles.meta}>
            {formattedTime && (
              <span className={styles.time}>{formattedTime}</span>
            )}
            {news.author && (
              <span className={styles.author}>{news.author}</span>
            )}
            {news.read_time_minutes && (
              <span className={styles.readTime}>
                {news.read_time_minutes} min
              </span>
            )}

            {/* Show language if different from current locale */}
            {news.language && (
              <span className={styles.language}>
                {news.language.toUpperCase()}
              </span>
            )}

            {/* Show status if not published */}
            {news.status && news.status !== "published" && (
              <span className={styles.status}>{news.status}</span>
            )}

            {/* Näytä kategoriat meta-rivillä */}
            {news.categories && news.categories.length > 0 && (
              <span className={styles.categories}>
                {news.categories
                  .map((cat) => cat[0].toUpperCase() + cat.slice(1))
                  .join(", ")}
              </span>
            )}
          </div>

          {/* Show location tags if available */}
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

          {/* Show sources if available */}
          {news.sources &&
            Array.isArray(news.sources) &&
            news.sources.length > 0 && (
              <div className={styles.sources}>
                <span className={styles.sourcesLabel}>Sources: </span>
                {news.sources.slice(0, 2).map((source, index) => (
                  <span key={index} className={styles.source}>
                    {source}
                    {index < Math.min(news.sources?.length || 0, 2) - 1
                      ? ", "
                      : ""}
                  </span>
                ))}
                {(news.sources?.length || 0) > 2 && (
                  <span className={styles.moreSources}>
                    +{(news.sources?.length || 0) - 2} more
                  </span>
                )}
              </div>
            )}
        </div>
        <div className={styles.imageWrapper}>
          <Image
            // Käytä news.image_url, jos se on olemassa. Muuten käytä placeholder-kuvaa.
            src={
              news.image_url ||
              "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
            }
            alt={news.title || "Uutisen kuva"} // Varmuuden vuoksi myös alt-tekstille oletusarvo
            width={180}
            height={110}
            className={styles.image}
            style={{ objectFit: "cover" }}
          />
        </div>
      </Link>
    </article>
  );
}
