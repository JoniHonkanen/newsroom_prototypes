import { gql } from "graphql-tag";

export default gql`
  type Location {
    city: String
    region: String
    country: String
    continent: String
  }

  type LocationTags {
    locations: [Location!]!
  }

  type BodyBlock {
    html: String
    type: String!
    order: Int
    content: String
  }

  type Source {
    url: String
    title: String
    source: String
  }

  type NewsArticle {
    id: ID!
    canonical_news_id: Int!
    language: String!
    version: Int
    lead: String
    summary: String
    status: String
    location_tags: LocationTags
    sources: [Source!]
    interviews: [String]
    review_status: String
    author: String
    body_blocks: [BodyBlock!]
    enrichment_status: String
    markdown_content: String
    published_at: String
    updated_at: String
    original_article_type: String
    featured: Boolean
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum NewsOrderField {
    ID
    PUBLISHED_AT
    UPDATED_AT
    CANONICAL_NEWS_ID
  }

  # OrderBy input-tyyppi
  input NewsOrderBy {
    field: NewsOrderField!
    order: SortOrder!
  }

  type Query {
    news(offset: Int, limit: Int, totalLimit: Int, orderBy: NewsOrderBy): [NewsArticle!]!
    newsArticle(id: ID!): NewsArticle
    newsByLanguage(language: String!): [NewsArticle!]!
    newsByStatus(status: String!): [NewsArticle!]!
    featuredNews(limit: Int, offset: Int, totalLimit: Int, orderBy: NewsOrderBy): [NewsArticle!]!
  }

  type Mutation {
    createNewsArticle(input: NewsArticleInput!): NewsArticle!
    updateNewsArticle(id: ID!, input: NewsArticleInput!): NewsArticle!
    deleteNewsArticle(id: ID!): Boolean!
  }

  input NewsArticleInput {
    canonical_news_id: Int!
    language: String!
    version: Int
    lead: String
    summary: String
    status: String
    location_tags: String
    sources: String
    interviews: String
    review_status: String
    author: String
    body_blocks: String
    enrichment_status: String
    markdown_content: String
    original_article_type: String
  }
`;
