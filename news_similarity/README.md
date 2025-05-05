# News Similarity Prototype

This prototype encodes a news article into a semantic vector, stores it in a PostgreSQL database with [pgvector](https://github.com/pgvector/pgvector), and retrieves the top-k most semantically similar articles — aiming to find related news content.

Similarity is computed by comparing the new article's embedding to existing ones using cosine distance.

## Features

- SentenceTransformer (`paraphrase-MiniLM-L6-v2`) encodes articles into 384-dimensional semantic embeddings.
- Embeddings are stored in PostgreSQL using the pgvector extension.
- Cosine distance is used to find top-k similar articles.
- Docker Compose setup included.

## Requirements

- Docker + Docker Compose (or local PostgreSQL with pgvector)
- Python 3.8+
- Python packages:
  - psycopg2-binary
  - sentence-transformers
  - numpy
  - umap-learn
  - matplotlib (optional)

Install dependencies:

pip install psycopg2-binary sentence-transformers numpy umap-learn matplotlib

## Docker Setup

Start PostgreSQL with pgvector using Docker Compose. Save the following as `compose.yaml`:

version: "3.8"

services:
  db:
    image: pgvector/pgvector:pg16 # Note: requires PostgreSQL 16
    container_name: pgvector-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: vectordb
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:

Start the container:

docker compose -f compose.yaml up -d

## Database Setup

Connect to the database and create the required table:

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT,
    embedding vector(384)
);

## Running the Prototype

Edit and run the Python script (e.g. `main.py`):

python main.py

The script will:
1. Encode the input article using the transformer model.
2. Insert the embedding into the database.
3. Query and print the top-k most similar articles by cosine distance.

## Notes

- Embeddings are normalized for consistent cosine similarity.
- More about the model: https://huggingface.co/sentence-transformers/paraphrase-MiniLM-L6-v2
