import { gql } from "@apollo/client";

export const GET_NEWS = gql`
  query GetNews(
    $offset: Int
    $limit: Int
    $featuredNewsLimit: Int
    $featuredOffset: Int
    $totalLimit: Int
  ) {
    news(offset: $offset, limit: $limit, totalLimit: $totalLimit) {
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
  }
`;

/* export const GET_NEWS = gql`
  query GetNews {
    news {
      id
      canonical_news_id
      language
      version
      lead
      summary
      status
      location_tags
      sources
      interviews
      review_status
      author
      body_blocks
      enrichment_status
      markdown_content
      published_at
      updated_at
      original_article_type
    }
  }
`; */

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
