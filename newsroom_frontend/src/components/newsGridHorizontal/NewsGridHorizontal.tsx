import Image from "next/image";
import styles from "./NewsGridHorizontal.module.css";
import type { NewsItem } from "@/types/news";
import { getRelativeTime } from "@/utils/date";

// This have Text and Image side by side, small and horizontal
export default function NewsGridHorizontal({ newsList }: { newsList: NewsItem[] }) {
  return (
    <div className={styles.grid}>
      {newsList.map((news) => (
        <article key={news.id} className={styles.card}>
          <div className={styles.content}>
            <h3 className={styles.title}>{news.title}</h3>
            <div className={styles.time}>
              {getRelativeTime(news.created_at)}
            </div>
          </div>
          {news.image_url && (
            <div className={styles.imgBox}>
              <Image
                src={news.image_url}
                alt={news.title}
                width={72}
                height={72}
                className={styles.image}
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
