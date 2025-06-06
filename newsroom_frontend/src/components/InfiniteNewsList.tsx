"use client";
import { useRef, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_NEWS } from "@/graphql/queries";
import FeaturedNews from "./featuredNews/FeaturedNews";
import NewsCard from "./newsCard/NewsCard";
import NewsGridHorizontal from "./newsGridHorizontal/NewsGridHorizontal";
import NewsGridVertical from "./newsGridVertical/NewsGridVertical";
import { NewsItem } from "@/types/news";

export default function InfiniteNewsList() {
  const [pages, setPages] = useState<NewsItem[][]>([]);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 17;

  const [fetchNews, { data, loading, error }] = useLazyQuery(GET_NEWS, {
    notifyOnNetworkStatusChange: true,
  });
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Lisää uusi sivu pages-taulukkoon
  useEffect(() => {
    if (data?.news) {
      setPages((prev) => [...prev, data.news]);
    }
  }, [data]);

  // Ensimmäinen fetch
  useEffect(() => {
    fetchNews({ variables: { offset: 0, limit: PAGE_SIZE } });
    setOffset(PAGE_SIZE);
  }, []);

  // Scroll-trigger
  useEffect(() => {
    if (!triggerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          fetchNews({ variables: { offset: offset, limit: PAGE_SIZE } });
          setOffset((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0 }
    );
    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [offset, fetchNews, loading]);

  // Renderöi jokainen "sivu" rytmissä
  return (
    <section>
      {pages.map((page, idx) => {
        const featured = page.slice(0, 2);
        const list = page.slice(2, 5);
        const horizontal = page.slice(5, 13);
        const vertical = page.slice(13, 17);

        return (
          <div key={idx}>
            {featured.map((item) => (
              <FeaturedNews key={item.id} news={item} />
            ))}
            {list.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
            <NewsGridHorizontal newsList={horizontal} />
            <NewsGridVertical newsList={vertical} />
          </div>
        );
      })}

      <div ref={triggerRef} style={{ height: 24 }} />
      {loading && <div>Ladataan...</div>}
      {error && <div>Virhe: {error.message}</div>}
    </section>
  );
}
