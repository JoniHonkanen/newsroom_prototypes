import Image from "next/image";
import styles from "./NewsCard.module.css";
import type { SimpleNewsItem } from "@/types/news";

export default function NewsCard({ news }: { news: SimpleNewsItem }) {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.category}>{news.main_category}</div>
        <h3 className={styles.title}>{news.title}</h3>
        <div className={styles.meta}>
          {new Date(news.created_at).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {news.image_url && (
        <div className={styles.imageWrapper}>
          <Image
            src={news.image_url}
            alt={news.title}
            width={180}
            height={110}
            className={styles.image}
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
    </div>
  );
}
