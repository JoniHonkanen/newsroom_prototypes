"use client";
import { useRef, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_NEWS, GET_NEWS_BY_CATEGORY } from "@/graphql/queries";
import FeaturedNews from "./featuredNews/FeaturedNews";
import NewsCard from "./newsCard/NewsCard";
import NewsGridHorizontal from "./newsGridHorizontal/NewsGridHorizontal";
import NewsGridVertical from "./newsGridVertical/NewsGridVertical";
import { NewsItem } from "@/types/news";
import EndOfNewsComponent from "./endOfNews/EndOfNews";

interface Props {
  initialOffset: number;
  initialFeaturedOffset: number;
  totalLimit: number;
  categorySlug?: string;
}

interface PageData {
  news: NewsItem[];
  featuredNews: NewsItem[];
}

export default function InfiniteNewsList({
  initialOffset,
  initialFeaturedOffset,
  totalLimit,
  categorySlug,
}: Props) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0); // Seurataan kokonaislatausmäärää
  const PAGE_SIZE = 17;

  // Valitse oikea query riippuen siitä onko kategoria annettu
  const queryToUse = categorySlug ? GET_NEWS_BY_CATEGORY : GET_NEWS;

  const [fetchNews, { loading, error }] = useLazyQuery(queryToUse, {
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      let newsData: NewsItem[] = [];
      let featuredNewsData: NewsItem[] = [];

      if (categorySlug) {
        // Kategoriakyselyssä data tulee eri kentistä
        newsData = data?.newsByCategory || [];
        featuredNewsData = data?.featuredNewsByCategory || [];
      } else {
        // Normaalissa kyselyssä
        newsData = data?.news || [];
        featuredNewsData = data?.featuredNews || [];
      }

      if (newsData.length > 0 || featuredNewsData.length > 0) {
        const newPageData = {
          news: newsData,
          featuredNews: featuredNewsData,
        };
        setPages((prevPages) => [...prevPages, newPageData]);

        // Päivitä kokonaislatausmäärä
        const newItemsCount = newsData.length + featuredNewsData.length;
        setTotalFetched((prev) => prev + newItemsCount);
      }

      // Lopeta jos sekä tavalliset että featured uutiset ovat loppuneet
      const totalContent = newsData.length + featuredNewsData.length;

      if (
        totalContent === 0 ||
        (newsData.length < PAGE_SIZE && featuredNewsData.length === 0) ||
        totalFetched >= totalLimit
      ) {
        setHasMore(false);
      }

      setIsFetching(false);
    },
    onError: () => {
      setIsFetching(false);
    },
  });

  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!triggerRef.current || !hasMore || loading || isFetching) return;

    // Tarkista totalLimit ennen seuraavan sivun lataamista
    if (totalFetched >= totalLimit) {
      setHasMore(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching && hasMore) {
          setIsFetching(true);

          const nextOffset = initialOffset + pages.length * PAGE_SIZE;
          const nextFeaturedOffset = initialFeaturedOffset + pages.length;

          // Luo variables riippuen siitä onko kategoria annettu
          const baseVariables = {
            offset: nextOffset,
            limit: PAGE_SIZE,
            featuredNewsLimit: 1,
            featuredOffset: nextFeaturedOffset,
            totalLimit: totalLimit,
            orderBy: { field: "ID", order: "DESC" },
            featuredOrderBy: { field: "ID", order: "DESC" },
          };

          const variables = categorySlug
            ? { ...baseVariables, categorySlug }
            : baseVariables;

          fetchNews({ variables });
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [
    pages,
    loading,
    hasMore,
    isFetching,
    fetchNews,
    initialOffset,
    initialFeaturedOffset,
    totalLimit,
    categorySlug, // Lisää dependency
    totalFetched, // Lisää totalFetched dependency
  ]);

  return (
    <>
      {pages.map((pageData, pageIndex) => {
        const { news, featuredNews } = pageData;

        const listNews = news.slice(0, 3);
        const horizontalNews = news.slice(3, 11);
        const verticalNews = news.slice(11, 15);

        return (
          <div key={initialOffset + pageIndex}>
            {/* Featured uutiset */}
            {featuredNews?.length > 0 &&
              featuredNews.map((item) => (
                <FeaturedNews key={item.id} news={item} />
              ))}

            {/* List uutiset */}
            {listNews.length > 0 &&
              listNews.map((item) => <NewsCard key={item.id} news={item} />)}

            {/* Horizontal grid */}
            {horizontalNews.length > 0 && (
              <NewsGridHorizontal newsList={horizontalNews} />
            )}

            {/* Vertical grid */}
            {verticalNews.length > 0 && (
              <NewsGridVertical newsList={verticalNews} />
            )}
          </div>
        );
      })}

      <div ref={triggerRef} style={{ height: 24 }} />
      {(loading || isFetching) && <div>Ladataan lisää...</div>}
      {error && <div>Virhe: {error.message}</div>}
      {!loading && !isFetching && !hasMore && <EndOfNewsComponent />}
    </>
  );
}
