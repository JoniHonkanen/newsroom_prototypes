import sqlite3
import json
from pathlib import Path
from typing import List

from schemas import NewsArticleData

DB_PATH = "languages.db"

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_tables():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS canonical_news (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            vector TEXT,
            published_at TEXT,
            created_at TEXT,
            language TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS news_article (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            canonical_news_id INTEGER NOT NULL,
            language TEXT NOT NULL,
            is_original INTEGER NOT NULL DEFAULT 0,
            version INTEGER,
            lead TEXT,
            summary TEXT,
            status TEXT,
            location_tags TEXT,
            sources TEXT,
            interviews TEXT,
            revies_status TEXT,
            author TEXT,
            embedding TEXT,
            body_blocks TEXT,
            published_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (canonical_news_id) REFERENCES canonical_news(id),
            UNIQUE(canonical_news_id, language)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS supported_languages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name_fi TEXT NOT NULL,
            name_en TEXT NOT NULL,
            active INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    conn.close()

def insert_canonical_news_from_json(json_path):
    items = json.loads(Path(json_path).read_text(encoding="utf-8"))
    conn = get_connection(); cur = conn.cursor()
    for item in items:
        cur.execute("""
            INSERT OR IGNORE INTO canonical_news
            (id, title, content, vector, published_at, created_at, language)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"], item["title"], item["content"],
            item.get("vector"), item.get("published_at"),
            item.get("created_at"), item["language"]
        ))
    conn.commit(); conn.close()

def insert_news_articles_from_json(json_path):
    items = json.loads(Path(json_path).read_text(encoding="utf-8"))
    conn = get_connection(); cur = conn.cursor()
    for item in items:
        cur.execute("""
            INSERT OR IGNORE INTO news_article
            (id, canonical_news_id, language, is_original, version, lead, summary,
             status, location_tags, sources, interviews, revies_status,
             author, embedding, body_blocks, published_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"], item["canonical_news_id"], item["language"],
            item.get("is_original", 0), item.get("version"), item.get("lead"),
            item.get("summary"), item.get("status"), item.get("location_tags"),
            item.get("sources"), item.get("interviews"),
            item.get("revies_status"), item.get("author"),
            item.get("embedding"),
            json.dumps(item["body_blocks"], ensure_ascii=False) if item.get("body_blocks") else None,
            item.get("published_at"), item.get("updated_at")
        ))
    conn.commit(); conn.close()

def insert_supported_languages():
    langs = [
        ("fi", "suomi", "Finnish", 1),
        ("en", "englanti", "English", 1),
        ("sv", "ruotsi", "Swedish", 1),
        ("ru", "venäjä", "Russian", 0),
        ("ar", "arabia", "Arabic", 1),
    ]
    conn = get_connection(); cur = conn.cursor()
    cur.executemany("""
        INSERT OR IGNORE INTO supported_languages
        (code, name_fi, name_en, active) VALUES (?, ?, ?, ?)
    """, langs)
    conn.commit(); conn.close()

def get_active_languages(exclude_code=None):
    conn = get_connection(); cur = conn.cursor()
    if exclude_code:
        cur.execute(
            "SELECT code FROM supported_languages WHERE active = 1 AND code != ?",
            (exclude_code,)
        )
    else:
        cur.execute("SELECT code FROM supported_languages WHERE active = 1")
    langs = [r[0] for r in cur.fetchall()]
    conn.close()
    return langs

def get_articles_to_translate() -> List[NewsArticleData]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM news_article WHERE status = 'published' AND is_original = 1")
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    conn.close()

    articles = []
    for r in rows:
        d = dict(zip(cols, r))
        # body_blocks on JSON-string, muunnetaan listaksi
        if isinstance(d["body_blocks"], str):
            d["body_blocks"] = json.loads(d["body_blocks"])
        articles.append(NewsArticleData(**d))
    return articles

def save_translated_article(orig_article, tgt_lang, translated_blocks):
    conn = get_connection(); cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO news_article (
            canonical_news_id, language, is_original, version, lead, summary,
            status, location_tags, sources, interviews, revies_status,
            author, embedding, body_blocks, published_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        orig_article["canonical_news_id"],
        tgt_lang,
        0,
        orig_article.get("version", 1),
        translated_blocks.get("lead"),
        translated_blocks.get("summary"),
        "translated",
        orig_article.get("location_tags"),
        orig_article.get("sources"),
        orig_article.get("interviews"),
        orig_article.get("revies_status"),
        orig_article.get("author"),
        None,
        json.dumps(translated_blocks["body_blocks"], ensure_ascii=False),
        orig_article.get("published_at"),
        orig_article.get("updated_at"),
    ))
    conn.commit(); conn.close()


if __name__ == "__main__":
    init_tables()
    insert_supported_languages()
    insert_canonical_news_from_json("mockdata/canonical_news.json")
    insert_news_articles_from_json("mockdata/news_articles.json")
    print("Taulut luotu ja mockdata lisätty.")
