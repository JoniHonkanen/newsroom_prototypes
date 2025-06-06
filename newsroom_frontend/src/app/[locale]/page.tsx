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

export default async function Home() {
  // 1. Lue HTTP-headers Next 15 App Routerin avulla
  const headerObj = await headers();
  const nextHeaders = Object.fromEntries(headerObj.entries());

  // 2. Luo server-Apollo client, anna serverille headers-objekti
  const apolloClient = createApolloClient(nextHeaders);

  // 3. Kysy data SSR:ssä
  const { data } = await apolloClient.query<{ news: NewsItem[] }>({
    query: GET_NEWS,
  });
  const news = data.news;

  // 4. Jaotellaan tyypeittäin
  const featureds = news.filter((n) => n.display_type === "featured");
  const rest = news.filter((n) => n.display_type !== "featured");

  // Ota 3 ensimmäistä listNews
  const listNews = rest.slice(0, 3);
  // Seuraavat 8 NewsGridHorizontalille
  const gridHorizontalNews = rest.slice(3, 11);
  // Seuraavat 4 NewsGridVerticalille
  const gridVerticalNews = rest.slice(11, 15);

  return (
    <main>
      {featureds.map((item) => (
        <FeaturedNews key={item.id} news={item} />
      ))}

      <section className={styles.newsListSection}>
        {listNews.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </section>

      <section className={styles.newsGridSection}>
        <NewsGridHorizontal newsList={gridHorizontalNews} />
      </section>

      <section className={styles.newsGridSection}>
        <NewsGridVertical newsList={gridVerticalNews} />
      </section>

      <ApolloProvider>
        <InfiniteNewsList />
      </ApolloProvider>
    </main>
  );
}
