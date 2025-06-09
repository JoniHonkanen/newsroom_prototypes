import os, json
import openai
from dotenv import load_dotenv
from typing import List
from database import (
    init_tables,
    insert_canonical_news_from_json,
    insert_news_articles_from_json,
    insert_supported_languages,
    get_articles_to_translate,
    get_active_languages,
    save_translated_article,
)
from schemas import NewsArticleData

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


from schemas import BodyBlock


def translate_article(article: NewsArticleData, tgt_lang: str) -> NewsArticleData:
    payload = article.model_dump(include={"lead", "summary", "body_blocks"})
    prompt = f"""
Olet kääntäjä. Saat JSON-objektin:
{json.dumps(payload, ensure_ascii=False)}

Käännä kaikki 'content'-kentät ja lead/summary kieleltä "{article.language}" kielelle "{tgt_lang}".
Palauta JSON-rakenne ennallaan, mutta käännetyt tekstit.
"""
    resp = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Olet pätevä kääntäjä."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=2000,
    )
    translated = json.loads(resp.choices[0].message.content.strip())

    # **TÄRKEÄ KOHTA:** Tee kaikki blokit BodyBlock-olioiksi (ei dictiksi)
    body_blocks = [
        BodyBlock(**b) if isinstance(b, dict) else b for b in translated["body_blocks"]
    ]

    # Luo uusi olio
    out = article.model_copy()
    out.language = tgt_lang
    out.is_original = False
    out.lead = translated.get("lead")
    out.summary = translated.get("summary")
    out.body_blocks = body_blocks
    return out


if __name__ == "__main__":
    init_tables()
    insert_supported_languages()
    insert_canonical_news_from_json("mockdata/canonical_news.json")
    insert_news_articles_from_json("mockdata/news_articles.json")
    print("Alustus valmis, mockdata ladattu.\n")

    articles = get_articles_to_translate()
    for art in articles:
        for tgt in get_active_languages(exclude_code=art.language):
            translated = translate_article(art, tgt)
            # Pydantic → dict → tallenna DB:hen
            save_translated_article(
                orig_article=translated.model_dump(),
                tgt_lang=tgt,
                translated_blocks={
                    "lead": translated.lead,
                    "summary": translated.summary,
                    "body_blocks": [
                        b.model_dump() if hasattr(b, "model_dump") else b
                        for b in translated.body_blocks
                    ],
                },
            )
            print(f"{art.id} ({art.language}→{tgt}): käännös tallennettu.")
            # Tulosta käännetty uutinen "kauniisti"
            print(json.dumps(translated.model_dump(), ensure_ascii=False, indent=2))
