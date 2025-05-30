import Image from "next/image";
import styles from "./FeaturedNews.module.css";
import type { MainNewsItem } from "@/types/news";

export default function FeaturedNews({ news }: { news: MainNewsItem }) {
  console.log("FeaturedNews", news);
  if (!("summary" in news)) {
    return null;
  }

  return (
    <section className={styles.featuredNews}>
      <div className={styles.featuredContent}>
        <h1 className={styles.title}>{news.title}</h1>
        {news.summary && <p className={styles.summary}>{news.summary}</p>}
        <div className={styles.meta}>
          {news.author && <div>{news.author}</div>}
          <div>{new Date(news.created_at).toLocaleDateString("fi-FI")}</div>
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
  );
}
