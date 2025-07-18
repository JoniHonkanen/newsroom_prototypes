"use client";
import { useRef, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_NEWS } from "@/graphql/queries";
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
}

interface PageData {
  news: NewsItem[];
  featuredNews: NewsItem[];
}

export default function InfiniteNewsList({
  initialOffset,
  initialFeaturedOffset,
  totalLimit,
}: Props) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const PAGE_SIZE = 17;

  const [fetchNews, { loading, error }] = useLazyQuery(GET_NEWS, {
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.news || data?.featuredNews) {
        const newPageData = {
          news: data.news || [],
          featuredNews: data.featuredNews || [],
        };
        setPages((prevPages) => [...prevPages, newPageData]);
      }

      // Lopeta jos sai vähemmän kuin PAGE_SIZE
      if (!data?.news || data.news.length < PAGE_SIZE) {
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching && hasMore) {
          setIsFetching(true);

          const nextOffset = initialOffset + pages.length * PAGE_SIZE;
          const nextFeaturedOffset = initialFeaturedOffset + pages.length;

          fetchNews({
            variables: {
              offset: nextOffset,
              limit: PAGE_SIZE,
              featuredNewsLimit: 1,
              featuredOffset: nextFeaturedOffset,
              totalLimit: totalLimit,
              orderBy: { field: "ID", order: "DESC" },
              featuredOrderBy: { field: "ID", order: "DESC" },
            },
          });
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
