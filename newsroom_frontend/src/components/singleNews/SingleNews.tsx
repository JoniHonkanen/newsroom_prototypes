import { NewsItem } from "@/types/news";
import styles from "./SingleNews.module.css";

export function SingleNews({
  news,
  locale,
}: {
  news: NewsItem;
  locale: string;
}) {
  console.log(news);
  return (
    <div className={styles.content_wrapper}>
      <article className={styles.article}>
        <h1 className={styles.articleTitle}>{news.title}</h1>
        {news.summary && (
          <div className={styles.articleSummary}>{news.summary}</div>
        )}
        <div className={styles.articleMeta}>
          {news.author && <span>{news.author}</span>}
          <span className={styles.articleDate}>
            {new Date(news.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {news.read_time_minutes && <> • {news.read_time_minutes} min</>}
        </div>
        {news.image_url && (
          <img
            className={styles.articleImage}
            src={news.image_url}
            alt={news.title}
          />
        )}
        <div className={styles.articleBody}>{news.content}</div>
      </article>
    </div>
  );
}
