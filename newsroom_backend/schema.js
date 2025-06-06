const { gql } = require("graphql-tag");
module.exports = gql`
  type NewsItem {
    id: ID!
    title: String!
    main_category: String!
    image_url: String!
    created_at: String!
    display_type: String!
    summary: String
    categories: [String!]
    read_time_minutes: Int
    author: String
    url_slug: String
  }

  type SingleNewsItem {
    id: ID!
    title: String!
    main_category: String!
    image_url: String!
    created_at: String!
    display_type: String!
    summary: String
    categories: [String!]
    read_time_minutes: Int
    author: String
    url_slug: String
    content: String
  }

  type Query {
    news: [NewsItem!]!
    singleNewsItem(id: ID!): SingleNewsItem
  }
`;
