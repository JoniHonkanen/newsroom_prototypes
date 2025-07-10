import { gql } from "@apollo/client";

export const GET_NEWS = gql`
  query GetNews($offset: Int, $limit: Int) {
    news(offset: $offset, limit: $limit) {
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
`;
