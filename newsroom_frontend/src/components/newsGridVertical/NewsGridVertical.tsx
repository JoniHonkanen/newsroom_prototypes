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
  console.log("NewsGridVertical newsList:", newsList);
  return (
    <div className={styles.grid}>
      {newsList.map((news) => (
        <article key={news.id} className={styles.card}>
          <div className={styles.imgBox}>
            <Image
              src={
                news.image_url ||
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
              }
              alt={news.title}
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
        </article>
      ))}
    </div>
  );
}
