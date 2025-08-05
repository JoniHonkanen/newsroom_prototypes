import Link from "next/link";
import styles from "./SimilarNewsCard.module.css";
import Image from "next/image";

interface SimilarNewsCardProps {
  news: {
    id: string;
    language?: string;
    lead?: string;
    summary?: string;
    published_at?: string;
    updated_at?: string;
    image_url?: string;
  };
  locale?: string;
  isLast?: boolean;
}

export default function SimilarNewsCard({
  news,
  locale = "fi",
  isLast,
}: SimilarNewsCardProps) {
  const title = news.lead || news.summary || "Untitled";

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <Link href={`/news/${news.id}`} className={styles.cardLink}>
      <article className={`${styles.card} ${isLast ? styles.noBorder : ""}`}>
        <div className={styles.content}>
          <div className={styles.category}>kategoria...</div>

          <h3 className={styles.title}>{truncateText(title)}</h3>

          <div className={styles.meta}>{formatDate(news.published_at)}</div>
        </div>

        <div className={styles.imageContainer}>
          <Image
            src={
              news.image_url ||
              "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
            }
            alt={news.lead || news.summary || "News image"}
            width={100}
            height={100}
            className={styles.image}
            style={{ objectFit: "cover" }}
          />
        </div>
      </article>
    </Link>
  );
}
