import sqlite3
import json
from schemas import GeneratedNewsItem

DB_FILE = "articles.db"


def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                categories TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        conn.commit()


def save_article(article: GeneratedNewsItem):
    with sqlite3.connect(DB_FILE) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO articles (title, categories, body)
            VALUES (?, ?, ?);
            """,
            (
                article.title,
                json.dumps([c.value for c in article.categories]),
                json.dumps([block.model_dump() for block in article.body]),
            ),
        )
        conn.commit()
