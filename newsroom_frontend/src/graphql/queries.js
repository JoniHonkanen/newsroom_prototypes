import { gql } from "@apollo/client";

//remember that these need to be same names as the ones in the backend
// news,  singleNewsItem... etc

export const GET_NEWS = gql`
  query GetNews {
    news {
      id
      title
      main_category
      image_url
      created_at
      display_type
      summary
      categories
      read_time_minutes
      author
      url_slug
    }
  }
`;

export const GET_NEWS_ITEM = gql`
  query GetNewsItem($id: ID!) {
    singleNewsItem(id: $id) {
      id
      title
      main_category
      image_url
      created_at
      display_type
      summary
      categories
      read_time_minutes
      author
      url_slug
      content
    }
  }
`;
