"use client";
import { useRef, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_SIMILAR_ARTICLES } from "@/graphql/queries";
import SimilarNewsCard from "./similarNewsCard/SimilarNewsCard";

interface SimilarArticle {
  id: string;
  language?: string;
  lead?: string;
  summary?: string;
  published_at?: string;
  updated_at?: string;
}

interface SimilarArticlesProps {
  articleId: number;
  limit?: number;
  minSimilarity?: number;
  locale: string;
}

const styles = {
  similarArticles: {
    margin: "1rem 0",
    padding: "1rem 0",
    paddingLeft: "1rem",
    borderTop: "1px solid #374151",
    backgroundColor: "#111827", // Tumma tausta
  } as React.CSSProperties,

  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    color: "white", // Valkoinen teksti
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as React.CSSProperties,

  count: {
    fontSize: "0.875rem",
    fontWeight: "400",
    color: "#9ca3af", // Harmaa teksti
  } as React.CSSProperties,

  articlesGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
  } as React.CSSProperties,

  loading: {
    textAlign: "center" as const,
    padding: "2rem",
    color: "#6b7280",
    fontStyle: "italic" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  } as React.CSSProperties,

  error: {
    textAlign: "center" as const,
    padding: "2rem",
    color: "#dc2626",
    fontStyle: "italic" as const,
  } as React.CSSProperties,

  noResults: {
    textAlign: "center" as const,
    padding: "2rem",
    color: "#6b7280",
    fontStyle: "italic" as const,
  } as React.CSSProperties,

  placeholder: {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "2rem",
    color: "#6b7280",
    fontStyle: "italic" as const,
  } as React.CSSProperties,
};

export default function SimilarArticles({
  articleId,
  limit = 5,
  minSimilarity = 0.4,
  locale,
}: SimilarArticlesProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
  const triggerRef = useRef<HTMLDivElement>(null);

  const [fetchSimilarArticles, { loading, error }] = useLazyQuery(
    GET_SIMILAR_ARTICLES,
    {
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setSimilarArticles(data?.similarArticles || []);
      },
      onError: (error) => {
        console.error("Error loading similar articles:", error);
      },
    }
  );

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!triggerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldLoad) {
          setShouldLoad(true);
          observer.disconnect(); // Lopeta observointi kun on kerran ladattu

          // Käynnistä query
          fetchSimilarArticles({
            variables: {
              articleId: parseInt(String(articleId)),
              limit,
              minSimilarity,
              maxAgeDays: 90,
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
  }, [articleId, limit, minSimilarity, fetchSimilarArticles, shouldLoad]);

  // Placeholder ennen lataamista
  if (!shouldLoad) {
    return (
      <div ref={triggerRef} style={styles.similarArticles}>
        <div style={styles.placeholder}>
          Skrollaa nähdäksesi samankaltaiset artikkelit...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.similarArticles}>
        <h2 style={styles.title}>Samankaltaiset artikkelit</h2>
        <div style={styles.loading}>Ladataan ehdotuksia...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.similarArticles}>
        <h2 style={styles.title}>Samankaltaiset artikkelit</h2>
        <div style={styles.error}>Ehdotusten lataaminen epäonnistui</div>
      </div>
    );
  }

  if (similarArticles.length === 0) {
    return (
      <div style={styles.similarArticles}>
        <h2 style={styles.title}>Samankaltaiset artikkelit</h2>
        <div style={styles.noResults}>
          Ei samankaltaisia artikkeleita löytynyt
        </div>
      </div>
    );
  }

  return (
    <div style={styles.similarArticles}>
      <h2 style={styles.title}>
        Samankaltaiset uutiset
        <span style={styles.count}>({similarArticles.length})</span>
      </h2>

      <div style={styles.articlesGrid}>
        {similarArticles.map((article: SimilarArticle, index: number) => (
          <SimilarNewsCard
            key={article.id}
            news={article}
            locale={locale}
            isLast={index === similarArticles.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
