# Newsroom Backend (GraphQL)

This project is a simple Node.js backend providing a GraphQL API for a newsroom application.  
It serves news data from a mock JSON file via Apollo Server.

## How It Works

- **Tech Stack:** Node.js, Apollo Server, GraphQL
- **Data Source:** Reads news items from `mockup_data.json`
- **API:** GraphQL endpoint at http://localhost:4000/
- **Usage:** For frontend prototyping and development before connecting to a real database

## Schema
```
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

type Query {
news: [NewsItem!]!
}
```

## How to Start

1. Install dependencies:  
   `npm install`
2. Run the server:  
   `node server.js`
3. Open http://localhost:4000/ in your browser to access the GraphQL playground.

## Example Query
```
query {
news {
id
title
main_category
image_url
created_at
display_type
}
}
```