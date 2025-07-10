import Image from "next/image";
import styles from "./NewsGridHorizontal.module.css";
import type { NewsItem } from "@/types/news";
import { getRelativeTime } from "@/utils/date";

// This have Text and Image side by side, small and horizontal
export default function NewsGridHorizontal({
  newsList,
}: {
  newsList: NewsItem[];
}) {
  console.log("NewsGridHorizontal newsList:", newsList);
  return (
    <div className={styles.grid}>
      {newsList.map((news) => (
        <article key={news.id} className={styles.card}>
          <div className={styles.content}>
            <h3 className={styles.title}>{news.lead}</h3>
            <div className={styles.time}>
              {news.published_at
                ? getRelativeTime(news.published_at)
                : "Aika tuntematon"}
            </div>
          </div>
          <div className={styles.imgBox}>
            <Image
              // Käytetään placeholderia, jos news.image_url on tyhjä
              src={
                news.image_url ||
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
              }
              alt={news.title || "Uutiskuva"}
              width={72}
              height={72}
              className={styles.image}
              style={{ objectFit: "cover" }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
