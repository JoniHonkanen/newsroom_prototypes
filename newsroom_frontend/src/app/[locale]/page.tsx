// /src/app/[locale]/page.tsx - Lopullinen versio

import { createApolloClient } from "@/lib/apolloClient";
import FeaturedNews from "@/components/featuredNews/FeaturedNews";
import NewsCard from "@/components/newsCard/NewsCard";
import NewsGridHorizontal from "@/components/newsGridHorizontal/NewsGridHorizontal";
import NewsGridVertical from "@/components/newsGridVertical/NewsGridVertical";
import styles from "../page.module.css";
import { GET_NEWS, GET_NEWS_BY_CATEGORY } from "@/graphql/queries";
import { headers } from "next/headers";
import type { NewsItem } from "@/types/news";
import InfiniteNewsList from "@/components/InfiniteNewsList";
import ApolloProvider from "@/providers/ApolloProvider";
import EndOfNewsComponent from "@/components/endOfNews/EndOfNews";
import SubHeader from "@/components/headers/SubHeader";
import { notFound } from "next/navigation";

// Vakiot
const LIST_NEWS_COUNT = 3;
const GRID_HORIZONTAL_COUNT = 8;
const GRID_VERTICAL_COUNT = 4;
const NEWS_LIMIT =
  LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT + GRID_VERTICAL_COUNT;
const FEATURED_NEWS_LIMIT = 2;
const TOTAL_LIMIT_SIZE = 100;

interface HomeProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { category: categorySlug } = await searchParams;

  const headerObj = await headers();
  const nextHeaders = Object.fromEntries(headerObj.entries());
  const apolloClient = createApolloClient(nextHeaders);

  // KATEGORIASIVU
  if (categorySlug) {
    try {
      const { data } = await apolloClient.query<{
        newsByCategory: NewsItem[];
        featuredNewsByCategory: NewsItem[];
        topCategories: { count: number; id: string; slug: string }[];
      }>({
        query: GET_NEWS_BY_CATEGORY,
        variables: {
          categorySlug: categorySlug,
          limit: NEWS_LIMIT,
          offset: 0,
          featuredNewsLimit: FEATURED_NEWS_LIMIT,
          featuredOffset: 0,
          totalLimit: TOTAL_LIMIT_SIZE,
          orderBy: { field: "ID", order: "DESC" },
          featuredOrderBy: { field: "ID", order: "DESC" },
        },
      });

      if (!data?.newsByCategory || data.newsByCategory.length === 0) {
        notFound();
      }

      const { newsByCategory, featuredNewsByCategory, topCategories } = data;

      // Jaetaan uutiset kuten etusivulla
      const featuredNews = featuredNewsByCategory || [];
      const regularNews = newsByCategory;

      const listNews = regularNews.slice(0, LIST_NEWS_COUNT);
      const gridHorizontalNews = regularNews.slice(
        LIST_NEWS_COUNT,
        LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT
      );
      const gridVerticalNews = regularNews.slice(
        LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT,
        LIST_NEWS_COUNT + GRID_HORIZONTAL_COUNT + GRID_VERTICAL_COUNT
      );

      return (
        <main>
          <SubHeader topCategories={topCategories} />

          {/* FEATURED WITH CATEGORY */}
          {featuredNews?.length > 0 &&
            featuredNews.map((item) => (
              <FeaturedNews key={item.id} news={item} />
            ))}

          {/* NORMAL NEWS WITH CATEGORY */}
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

          {(listNews.length > 0 ||
            gridHorizontalNews.length > 0 ||
            gridVerticalNews.length > 0) && (
            <ApolloProvider>
              <InfiniteNewsList
                initialOffset={NEWS_LIMIT}
                initialFeaturedOffset={FEATURED_NEWS_LIMIT}
                totalLimit={TOTAL_LIMIT_SIZE}
                categorySlug={categorySlug} // Lisää kategoria-parametri
              />
            </ApolloProvider>
          )}
        </main>
      );
    } catch (error) {
      console.error("Error fetching category news:", error);
      notFound();
    }
  }

  // ETUSIVU (normaali toiminta)
  const { data } = await apolloClient.query<{
    news: NewsItem[];
    featuredNews: NewsItem[];
    topCategories: { count: number; id: string; slug: string }[];
  }>({
    query: GET_NEWS,
    variables: {
      offset: 0,
      limit: NEWS_LIMIT,
      featuredNewsLimit: FEATURED_NEWS_LIMIT,
      featuredOffset: 0,
      totalLimit: TOTAL_LIMIT_SIZE,
      orderBy: { field: "ID", order: "DESC" },
      featuredOrderBy: { field: "ID", order: "DESC" },
    },
  });

  if (!data?.news) {
    return <p>No news available</p>;
  }

  const { news, featuredNews, topCategories } = data;

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
      <SubHeader topCategories={topCategories} />

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
            totalLimit={TOTAL_LIMIT_SIZE}
          />
        </ApolloProvider>
      ) : (
        <EndOfNewsComponent />
      )}
    </main>
  );
}
