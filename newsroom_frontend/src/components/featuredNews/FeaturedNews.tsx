import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import styles from "./FeaturedNews.module.css";
import { NewsItem } from "@/types/news";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

export default function FeaturedNews({ news }: { news: NewsItem }) {
  const locale = useLocale();

  // Tarkista että uutisessa on summary (featured news vaatii sen)
  if (!news.summary) {
    return null;
  }

  const slug = SLUGS[locale as keyof typeof SLUGS] || "uutinen";
  const url = `/${locale}/${slug}/${news.id}-${news.url_slug || "uutinen"}`;

  // Käytä published_at jos saatavilla, muuten updated_at
  const publishDate = news.published_at || news.updated_at;
  
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
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      // Näytä päivämäärä jos eri päivä
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }
  };

  const formattedDate = publishDate ? formatPublishDate(publishDate) : "";

  return (
    <section className={styles.featuredNews}>
      <Link href={url} className={styles.cardLink}>
        <div className={styles.featuredContent}>
          <h2 className={styles.title}>{news.lead || news.summary}</h2>

          {/* Käytä lead jos saatavilla, muuten summary */}
          {news.lead && news.summary && (
            <p className={styles.summary}>{news.summary}</p>
          )}

          <div className={styles.meta}>
            {news.author && <div>{news.author}</div>}
            {formattedDate && <div>{formattedDate}</div>}

            {/* Näytä kieli jos ei ole nykyinen locale */}
            {news.language && news.language !== locale && (
              <div className={styles.language}>
                {news.language.toUpperCase()}
              </div>
            )}

            {/* Näytä featured badge */}
            {news.categories && (
              <div className={styles.featuredBadge}>
                {news.categories
                  .map((cat) => cat[0].toUpperCase() + cat.slice(1))
                  .join(", ")}
              </div>
            )}
          </div>

          {/* Näytä location_tags - käyttää olemassa olevaa LocationTag-tyyppiä */}
          {news.location_tags?.locations &&
            news.location_tags.locations.length > 0 && (
              <div className={styles.locationTags}>
                {news.location_tags.locations.map((location, index: number) => (
                  <span key={index} className={styles.locationTag}>
                    {location.city || location.region || location.country}
                  </span>
                ))}
              </div>
            )}

          {/* Näytä sources - TypeScript-turvallinen */}
          {news.sources && news.sources.length > 0 && (
            <div className={styles.sources}>
              <span className={styles.sourcesLabel}>Lähteet: </span>
              {news.sources.map((source: string, index: number) => (
                <span key={index} className={styles.source}>
                  {source}
                  {index < (news.sources?.length || 0) - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.featuredImage}>
          <Image
            src={
              news.image_url ||
              "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
            }
            alt={news.lead || news.summary || "News image"}
            width={680}
            height={420}
            className={styles.image}
            priority
          />
        </div>
      </Link>
    </section>
  );
}