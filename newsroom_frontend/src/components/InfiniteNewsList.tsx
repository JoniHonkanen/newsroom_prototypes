"use client";
import { useRef, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_NEWS } from "@/graphql/queries";
import FeaturedNews from "./featuredNews/FeaturedNews";
import NewsCard from "./newsCard/NewsCard";
import NewsGridHorizontal from "./newsGridHorizontal/NewsGridHorizontal";
import NewsGridVertical from "./newsGridVertical/NewsGridVertical";
import { NewsItem } from "@/types/news";

interface Props {
  initialOffset: number;
}

export default function InfiniteNewsList({ initialOffset }: Props) {
  // Tämä komponentti ei enää näytä mitään alussa, se vain lataa lisää taustalla
  const [pages, setPages] = useState<NewsItem[][]>([]);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 17;

  const [fetchNews, { loading, error }] = useLazyQuery(GET_NEWS, {
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      // Duplikaattien esto on edelleen tärkeä
      if (data?.news && data.news.length > 0) {
        setPages((prevPages) => {
          const existingIds = new Set(prevPages.flat().map((item) => item.id));
          const uniqueNewItems = data.news.filter(
            (item: NewsItem) => !existingIds.has(item.id)
          );
          if (uniqueNewItems.length > 0) {
            return [...prevPages, uniqueNewItems];
          }
          return prevPages;
        });
      }
      if (!data?.news || data.news.length < PAGE_SIZE) {
        setHasMore(false);
      }
    },
  });

  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!triggerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // MUUTOS: Offset lasketaan initialOffsetin PÄÄLLE.
          const nextOffset = initialOffset + pages.length * PAGE_SIZE;
          fetchNews({ variables: { offset: nextOffset, limit: PAGE_SIZE } });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [pages, loading, hasMore, fetchNews, initialOffset]); // initialOffset lisätty dependency-listaan

  // Komponentti renderöi vain lataamansa SIVUT, ei ensimmäistä sivua.
  return (
    <>
      {pages.map((page, pageIndex) => {
        const featured = page.slice(0, 2);
        const list = page.slice(2, 5);
        const horizontal = page.slice(5, 13);
        const vertical = page.slice(13, 17);

        return (
          // Avaimena on tärkeä käyttää jotain uniikkia, esim. sivun indeksi + offset
          <div key={initialOffset + pageIndex}>
            {featured.map((item) => (
              <FeaturedNews key={item.id} news={item} />
            ))}
            {list.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
            {horizontal.length > 0 && (
              <NewsGridHorizontal newsList={horizontal} />
            )}
            {vertical.length > 0 && <NewsGridVertical newsList={vertical} />}
          </div>
        );
      })}

      <div ref={triggerRef} style={{ height: 24 }} />
      {loading && <div>Ladataan lisää...</div>}
      {error && <div>Virhe: {error.message}</div>}
      {!loading && !hasMore && (
        <div className="text-center p-4">Ei enempää uutisia.</div>
      )}
    </>
  );
}
