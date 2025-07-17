# Newsroom Backend

A GraphQL API server for managing news articles with PostgreSQL database integration.

## Tech Stack

- **Node.js** with ES6 modules
- **Express 5** - Web framework
- **Apollo Server** - GraphQL server
- **PostgreSQL** with pgvector - Database
- **GraphQL** - API query language

## Prerequisites

- Node.js 18+ 
- PostgreSQL database running on port 15432
- Database with `news_article` and `canonical_news` tables

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=15432
DB_NAME=newsroom_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=4000
```

3. **Start the server:**
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

- **GraphQL API**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health