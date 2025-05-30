import Image from "next/image";
import styles from "./NewsGrid.module.css";
import type { SimpleNewsItem } from "@/types/news";
import { getRelativeTime } from "@/utils/date";

export default function NewsGrid({ newsList }: { newsList: SimpleNewsItem[] }) {
  return (
    <div className={styles.grid}>
      {newsList.map((news) => (
        <article key={news.id} className={styles.card}>
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
          <h3 className={styles.title}>{news.title}</h3>
          <div className={styles.time}>{getRelativeTime(news.created_at)}</div>
        </article>
      ))}
    </div>
  );
}

