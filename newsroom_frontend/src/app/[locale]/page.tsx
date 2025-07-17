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
import EndOfNewsComponent from "@/components/endOfNews/EndOfNews";

// Vakiot uutisten määrille
const LIST_NEWS_COUNT = 3;
const GRID_HORIZONTAL_COUNT = 8;
const GRID_VERTICAL_COUNT = 4;
const NEWS_LIMIT = LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT + GRID_VERTICAL_COUNT;
const FEATURED_NEWS_LIMIT = 2;
const TOTAL_LIMIT_SIZE = 100;

export default async function Home() {
  // 1. Lue HTTP-headers Next 15 App Routerin avulla
  const headerObj = await headers();
  const nextHeaders = Object.fromEntries(headerObj.entries());

  // 2. Luo server-Apollo client, anna serverille headers-objekti
  const apolloClient = createApolloClient(nextHeaders);

  // 3. Kysy data SSR:ssä
  const { data } = await apolloClient.query<{
    news: NewsItem[];
    featuredNews: NewsItem[];
  }>({
    query: GET_NEWS,
    variables: {
      offset: 0,
      limit: NEWS_LIMIT,
      featuredNewsLimit: FEATURED_NEWS_LIMIT,
      featuredOffset: 0,
      totalLimit: TOTAL_LIMIT_SIZE
    },
  });

  // Tarkista että data on olemassa
  if (!data?.news) {
    return <p>No news available</p>;
  }

  const { news, featuredNews } = data;

  // Jaetaan rest-uutiset eri komponenteille
  const listNews = news.slice(0, LIST_NEWS_COUNT);
  const gridHorizontalNews = news.slice(
    LIST_NEWS_COUNT,
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT
  );
  const gridVerticalNews = news.slice(
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT,
    LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT + GRID_VERTICAL_COUNT
  );

  return (
    <main>
      {featuredNews?.length > 0 &&
        featuredNews.map((item) => <FeaturedNews key={item.id} news={item} />)}

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
          <InfiniteNewsList
            initialOffset={NEWS_LIMIT}
            initialFeaturedOffset={FEATURED_NEWS_LIMIT}
            totalLimit={TOTAL_LIMIT_SIZE} // Asetetaan kokonaisraja
          />
        </ApolloProvider>
      ) : (
        <EndOfNewsComponent />
      )}
    </main>
  );
}
