// /src/app/page.tsx
import { createApolloClient } from "@/lib/apolloClient";
import FeaturedNews from "@/components/featuredNews/FeaturedNews";
import NewsCard from "@/components/newsCard/NewsCard";
import NewsGridHorizontal from "@/components/newsGridHorizontal/NewsGridHorizontal";
import NewsGridVertical from "@/components/newsGridVertical/NewsGridVertical";
import styles from "../page.module.css";
import { GET_NEWS } from "@/graphql/queries";
import { headers } from "next/headers";
import type { NewsItem } from "@/types/news";
import InfiniteNewsList from "@/components/InfiniteNewsList";
import ApolloProvider from "@/providers/ApolloProvider";

// Vakiot uutisten määrille
const LIST_NEWS_COUNT = 3;
const GRID_HORIZONTAL_COUNT = 8;
const GRID_VERTICAL_COUNT = 4;
const PAGE_SIZE = 17;

export default async function Home() {
  // 1. Lue HTTP-headers Next 15 App Routerin avulla
  const headerObj = await headers();
  const nextHeaders = Object.fromEntries(headerObj.entries());

  // 2. Luo server-Apollo client, anna serverille headers-objekti
  const apolloClient = createApolloClient(nextHeaders);

  // 3. Kysy data SSR:ssä
  const { data } = await apolloClient.query<{ news: NewsItem[] }>({
    query: GET_NEWS,
    variables: {
      offset: 0,
      limit: PAGE_SIZE,
    },
  });

  // Tarkista että data on olemassa
  if (!data?.news) {
    return <p>No news available</p>;
  }

  const news: NewsItem[] = data.news;
  console.log("News:", news);

  // 4. Jaotellaan tyypeittäin
  const featureds = news.filter((n) => n.display_type === "featured");
  const rest = news.filter((n) => n.display_type !== "featured");

  // Jaetaan rest-uutiset eri komponenteille
  const listNews = rest.slice(0, LIST_NEWS_COUNT);
  const gridHorizontalNews = rest.slice(
    LIST_NEWS_COUNT,
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT
  );
  const gridVerticalNews = rest.slice(
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT,
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT + GRID_VERTICAL_COUNT
  );

  return (
    <main>
      {featureds.length > 0 &&
        featureds.map((item) => <FeaturedNews key={item.id} news={item} />)}

      {listNews.length > 0 && (
        <section className={styles.newsListSection}>
          {listNews.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </section>
      )}

      {gridHorizontalNews.length > 0 && (
        <section className={styles.newsGridSection}>
          <NewsGridHorizontal newsList={gridHorizontalNews} />
        </section>
      )}

      {gridVerticalNews.length > 0 && (
        <section className={styles.newsGridSection}>
          <NewsGridVertical newsList={gridVerticalNews} />
        </section>
      )}

      {news.length > 0 ? (
        <ApolloProvider>
          <InfiniteNewsList initialOffset={PAGE_SIZE} />
        </ApolloProvider>
      ) : (
        <p>No news available</p>
      )}
    </main>
  );
}
