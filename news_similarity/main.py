import psycopg2
from sentence_transformers import SentenceTransformer
import numpy as np
import umap
import matplotlib.pyplot as plt
from dotenv import load_dotenv
import os

load_dotenv()

# This prototype encodes a news article into a semantic vector, stores it in a PostgreSQL database with pgvector, and retrieves the top-k most semantically similar articles — aiming to find related news content.

#Similarity is computed by comparing the new article's embedding to existing ones using cosine distance.

# For testing purposes, we will use a PostgreSQL database with pgvector extension.
# Make sure to do .env file and set the following variables!
DB_PARAMS = {
    "dbname": os.getenv("POSTGRES_DB"),         # e.g., "vectordb"
    "user": os.getenv("POSTGRES_USER"),         # e.g., "postgres"
    "password": os.getenv("POSTGRES_PASSWORD"), # e.g., "postgres"
    "host": os.getenv("POSTGRES_HOST"),         # e.g., "localhost"
    "port": int(os.getenv("POSTGRES_PORT")),    # e.g., 5433
}

# Lataa malli kerran
model = SentenceTransformer("paraphrase-MiniLM-L6-v2")
# kato lisätietoja täältä:
# https://huggingface.co/sentence-transformers


def encode(text: str) -> list[float]:
    return model.encode(text, normalize_embeddings=True).astype("float32").tolist()


def find_similar(text: str, top_k: int = 5):
    """
    Lisää uutisen ja hakee top_k semanttisesti lähintä artikkelia.
    """
    emb = encode(text)
    with psycopg2.connect(**DB_PARAMS) as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO news (title, embedding)
            VALUES (%s, %s::vector)
            RETURNING id;
            """,
            (text, emb),
        )
        cur.execute(
            """
            SELECT id, title,
                   embedding <=> %s::vector AS distance
            FROM news
            ORDER BY distance
            LIMIT %s;
            """,
            (emb, top_k),
        )
        return cur.fetchall()


# ----------------------------
# Pääohjelma
# ----------------------------
if __name__ == "__main__":
    #article that we want to compare to
    query = "Kissat liikkuvat pimeällä ja ovat petoeläimiä."
    #five most similar articles
    results = find_similar(query, top_k=5)
    for id_, title, dist in results:
        #show similarity of the found articles
        print(f"[{id_}] {title} (distance={dist:.4f})")
