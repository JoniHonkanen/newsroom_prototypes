# Newsroom Backend

GraphQL-powered backend for newsroom management with PostgreSQL database integration.

## Features

- GraphQL API for news article management
- PostgreSQL database with pgvector extension support
- CRUD operations for news articles
- Filtering by language and status
- JSON support for location_tags, sources, interviews, and body_blocks fields

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
DB_HOST=localhost
DB_PORT=15432
DB_NAME=newsroom_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=4000
```

3. Ensure PostgreSQL database is running (database tables should already exist)

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Server will start at `http://localhost:4000/graphql`
