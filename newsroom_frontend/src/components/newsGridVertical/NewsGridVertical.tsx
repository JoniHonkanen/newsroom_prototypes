import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import styles from "./NewsGridVertical.module.css";
import type { NewsItem } from "@/types/news";
import { getRelativeTime } from "@/utils/date";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

// This have Text and Image Column

export default function NewsGridVertical({
  newsList,
}: {
  newsList: NewsItem[];
}) {
  const locale = useLocale();
  
  return (
    <div className={styles.grid}>
      {newsList.map((news) => {
        const slug = SLUGS[locale as keyof typeof SLUGS] || "uutinen";
        const url = `/${locale}/${slug}/${news.id}-${news.url_slug || 'uutinen'}`;
        
        return (
          <article key={news.id} className={styles.card}>
            <Link href={url} className={styles.cardLink}>
              <div className={styles.imgBox}>
                <Image
                  src={
                    news.image_url ||
                    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={news.lead || news.summary || "News image"}
                  width={250}
                  height={200}
                  className={styles.image}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className={styles.content}>
                <h3 className={styles.title}>{news.lead}</h3>
                <div className={styles.time}>
                  {getRelativeTime(news.updated_at || news.created_at)}
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}