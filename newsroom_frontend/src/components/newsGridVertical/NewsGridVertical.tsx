import Image from "next/image";
import styles from "./NewsGridVertical.module.css";
import type { NewsItem } from "@/types/news";
import { getRelativeTime } from "@/utils/date";

// This have Text and Image Column

export default function NewsGridVertical({
  newsList,
}: {
  newsList: NewsItem[];
}) {
  return (
    <div className={styles.grid}>
      {newsList.map((news) => (
        <article key={news.id} className={styles.card}>
          {news.image_url && (
            <div className={styles.imgBox}>
              <Image
                src={news.image_url}
                alt={news.title}
                width={250}
                height={200}
                className={styles.image}
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div className={styles.content}>
            <h3 className={styles.title}>{news.title}</h3>
            <div className={styles.time}>
              {getRelativeTime(news.created_at)}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
