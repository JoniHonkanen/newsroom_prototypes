import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import styles from "./FeaturedNews.module.css";
import type { NewsItem } from "@/types/news";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

export default function FeaturedNews({ news }: { news: NewsItem }) {
  const locale = useLocale();
  if (!("summary" in news)) {
    return null;
  }

  const slug = SLUGS[locale as keyof typeof SLUGS] || "uutinen";
  const url = `/${locale}/${slug}/${news.id}-${news.url_slug}`;

  return (
    <Link href={url} className={styles.link}>
      <section className={styles.featuredNews}>
        <div className={styles.featuredContent}>
          <h1 className={styles.title}>{news.title}</h1>
          {news.summary && <p className={styles.summary}>{news.summary}</p>}
          <div className={styles.meta}>
            {news.author && <div>{news.author}</div>}
            <div>{new Date(news.created_at).toLocaleDateString(locale)}</div>
            {news.read_time_minutes && <div>{news.read_time_minutes} min</div>}
          </div>
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
