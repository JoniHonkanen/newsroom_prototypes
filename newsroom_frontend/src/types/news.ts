export type DisplayType = "featured" | "list" | "grid";

export type LocationTag = {
  locations: Array<{
    city?: string;
    region?: string;
    country?: string;
    continent?: string;
  }>;
};

export type NewsItem = {
  // Core fields from GraphQL schema
  id: number | string;
  canonical_news_id?: string;
  language: string;
  version?: number;
  
  // Content fields
  title: string;
  lead?: string;
  summary?: string;
  body_blocks?: unknown[]; // Define more specifically if structure is known
  markdown_content?: string;
  content?: string; // Kept for backward compatibility
  
  // Metadata
  status: string;
  location_tags?: string[];
  sources?: string[];
  interviews?: string[];
  review_status?: string;
  author?: string;
  
  // Enrichment and analytics
  enrichment_status?: string;
  read_time_minutes?: number;
  
  // Dates
  published_at?: string;
  updated_at?: string;
  created_at: string;
  
  // Categories and tags
  main_category: string;
  categories?: string[];
  
  // Images and URLs
  image_url: string;
  url_slug?: string;
  slug?: string; // Kept for backward compatibility
  
  // Display type (not in GraphQL schema, but used in frontend)
  display_type: DisplayType;
  
  // Original article type
  original_article_type?: string;
};

/* THIS WAS THE ORIGINAL PLAN!
export type NewsItem = {
  id: number | string;
  title: string;
  main_category: string;
  image_url: string;
  created_at: string;
  display_type: DisplayType;
  summary?: string;
  categories?: string[];
  read_time_minutes?: number;
  author?: string;
  url_slug?: string;
  slug?: string;
  content?: string;
}; */