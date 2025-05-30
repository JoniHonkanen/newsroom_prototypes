// /src/app/page.tsx
import FeaturedNews from "@/components/featuredNews/FeaturedNews";
import styles from "./page.module.css";
import type { MainNewsItem, NewsItem } from "@/types/news";
import NewsCard from "@/components/newsCard/NewsCard";

export default async function Home() {
  // Lataa uutisdata esim. mockup_data.json-tiedostosta
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin);

  const res = await fetch(`${baseUrl}/mockup_data.json`, { cache: "no-store" });
  const news: NewsItem[] = await res.json();

  // Hae kaikki featuredit (vain MainNewsItem, joilla is_featured)
  const featureds: MainNewsItem[] = news.filter(
    (n): n is MainNewsItem =>
      "is_featured" in n && n.is_featured && "summary" in n
  );

  // Muut uutiset (ei featured)
  const otherNews = news.filter((n) => !("is_featured" in n && n.is_featured));

  return (
    <main>
      {/* Listaa kaikki featured-uutiset */}
      {featureds.map((item) => (
        <FeaturedNews key={item.id} news={item} />
      ))}
      <div className={styles.newsGrid}>
        {otherNews.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </main>
  );
}
