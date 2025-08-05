import { gql } from "@apollo/client";

export const GET_NEWS = gql`
  query GetNews(
    $offset: Int
    $limit: Int
    $featuredNewsLimit: Int
    $featuredOffset: Int
    $totalLimit: Int
    $orderBy: NewsOrderBy
    $featuredOrderBy: NewsOrderBy
  ) {
    news(
      offset: $offset
      limit: $limit
      totalLimit: $totalLimit
      orderBy: $orderBy
    ) {
      id
      language
      lead
      summary
      published_at
      updated_at
    }
    featuredNews(
      offset: $featuredOffset
      limit: $featuredNewsLimit
      totalLimit: $totalLimit
      orderBy: $featuredOrderBy
    ) {
      id
      language
      lead
      summary
      author
      published_at
      updated_at
      featured
    }
    topCategories(limit: 8) {
      count
      id
      slug
    }
  }
`;

export const GET_NEWS_ITEM = gql`
  query NewsArticle($newsArticleId: ID!) {
    newsArticle(id: $newsArticleId) {
      id
      canonical_news_id
      language
      version
      lead
      summary
      status
      location_tags {
        locations {
          city
          region
          country
          continent
        }
      }
      sources {
        url
        title
        source
      }
      interviews
      review_status
      author
      body_blocks {
        html
        type
        order
        content
      }
      enrichment_status
      markdown_content
      published_at
      updated_at
      original_article_type
      featured
    }
  }
`;

export const GET_NEWS_BY_CATEGORY = gql`
  query GetNewsByCategory(
    $categorySlug: String!
    $limit: Int
    $offset: Int
    $featuredNewsLimit: Int
    $featuredOffset: Int
    $totalLimit: Int
    $orderBy: NewsOrderBy
    $featuredOrderBy: NewsOrderBy
  ) {
    newsByCategory(
      categorySlug: $categorySlug
      limit: $limit
      offset: $offset
      totalLimit: $totalLimit
      orderBy: $orderBy
    ) {
      id
      language
      lead
      summary
      published_at
      updated_at
    }
    featuredNewsByCategory(
      categorySlug: $categorySlug
      offset: $featuredOffset
      limit: $featuredNewsLimit
      totalLimit: $totalLimit
      orderBy: $featuredOrderBy
    ) {
      id
      language
      lead
      summary
      author
      published_at
      updated_at
      featured
    }
    topCategories(limit: 8) {
      count
      id
      slug
    }
  }
`;

// SIMILAR ARTICLES
export const GET_SIMILAR_ARTICLES = gql`
  query GetSimilarArticles(
    $articleId: Int!
    $limit: Int
    $minSimilarity: Float
    $maxAgeDays: Int
  ) {
    similarArticles(
      articleId: $articleId
      limit: $limit
      minSimilarity: $minSimilarity
      maxAgeDays: $maxAgeDays
    ) {
      id
      language
      lead
      summary
      published_at
      updated_at
    }
  }
`;
