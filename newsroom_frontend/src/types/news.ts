export type DisplayType = "featured" | "list" | "grid";

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
};
