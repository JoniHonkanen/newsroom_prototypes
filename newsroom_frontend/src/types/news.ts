export type MainNewsItem = {
  id: number | string;
  title: string;
  summary: string;
  main_category: string;
  categories: string[];
  image_url: string;
  created_at: string;
  read_time_minutes: number;
  author: string;
  url_slug: string;
  is_featured: boolean;
};

export type SimpleNewsItem = {
  id: number | string;
  title: string;
  main_category: string;
  image_url: string;
  created_at: string;
};

export type NewsItem = MainNewsItem | SimpleNewsItem;
