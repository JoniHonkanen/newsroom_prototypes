from datetime import datetime
import time
from typing import List, Dict, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from duckduckgo_search.exceptions import (
    DuckDuckGoSearchException,
)
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from schemas import StructuredSourceArticle, ContentBlockWeb

# This module provides functions to perform web searches and extract structured articles from the results.
# With these articles we richen the generated news articles with additional information.
# It uses DuckDuckGo for searching and BeautifulSoup for parsing HTML content.
# We turn article as markdown, so we can give markdown to the LLM for better understanding.

# Constants
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}

# this is just fallback... if llm havent generated any search queries, we generate em here
def generate_search_queries(draft) -> List[str]:
    queries = []
    # Use the main idea as primary query
    queries.append(draft.idea)
    # Add a combined keywords query
    if draft.keywords:
        queries.append(" ".join(draft.keywords[:5]))
    # Add a snippet from the summary
    if draft.summary:
        queries.append(draft.summary[:150])
    return queries


# Eli jokainen query on oma haku ja siitä siirrytään sit sivustolle hakemaan data...
# retuns list of Structured articles, what we use to generate the new and FINAL article
# TODO:: site: can be used to limit the search to a specific domain... if we want use only certain trusted sites
# - exxample site:yle.fi OR site:hs.fi OR site:is.fi
def run_web_search(queries: List[str], num_results: int = 1) -> List[str]:
    articles: List[StructuredSourceArticle] = []

    # OBS! Duckduck have some rate limits, so we need to handle that! Thats why we sleep 2s between queries
    def safe_query(
        client, query: str, max_results: int = 1, retries: int = 3
    ) -> List[dict]:
        for attempt in range(retries):
            try:
                return client.text(query, max_results=max_results)
            except DuckDuckGoSearchException as e:
                if "Ratelimit" in str(e) and attempt < retries - 1:
                    wait = 2 ** (attempt + 1)
                    print(
                        f"Ratelimit hit. Retrying in {wait}s... (attempt {attempt + 1})"
                    )
                    time.sleep(wait)
                else:
                    print(f"Search failed for query: '{query}' — {e}")
                    return []

    with DDGS() as client:
        for q in queries:
            results = safe_query(client, q, max_results=num_results)
            time.sleep(2)  # ylimääräinen tauko joka kyselyn jälkeen
            for res in results:
                url = res.get("href", "")
                if not url:
                    continue
                article = to_structured_article(url)
                if article:
                    articles.append(article)

    return articles


def to_structured_article(url: str) -> StructuredSourceArticle:
    try:
        # Hae ja pakota UTF-8-merkistö
        resp = requests.get(url, headers=HEADERS, timeout=5)
        resp.encoding = "utf-8"
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return None

    # Restrict to <article> if present
    article_tag = soup.find("article") or soup
    # Remove footer if exists
    footer = article_tag.find("footer")
    if footer:
        footer.decompose()

    blocks: List[ContentBlockWeb] = []

    if h1 := article_tag.find("h1"):
        text = h1.get_text(strip=True)
        if text:
            blocks.append(ContentBlockWeb(type="title", content=text))

    for h2 in article_tag.find_all("h2"):
        text = h2.get_text(strip=True)
        if text:
            blocks.append(ContentBlockWeb(type="subheading", content=text))

    for p in article_tag.find_all("p"):
        text = p.get_text(strip=True)
        if text:
            blocks.append(ContentBlockWeb(type="text", content=text))

    for li in article_tag.find_all("li"):
        text = li.get_text(strip=True)
        if text:
            blocks.append(ContentBlockWeb(type="text", content=text))

    for fig in article_tag.find_all("figcaption"):
        text = fig.get_text(strip=True)
        if text:
            blocks.append(ContentBlockWeb(type="image", content=text))

    domain = urlparse(url).netloc.replace("www.", "")
    published = extract_published_time(soup)

    markdown = render_article_as_markdown(blocks)

    return StructuredSourceArticle(
        url=url,
        domain=domain,
        published=published,
        content_blocks=blocks,
        markdown=markdown,
    )


# article_fetcher.py vähäh samanlainen, ehkä joku common.py file ja sinne heittää nää
def extract_published_time(soup: BeautifulSoup) -> Optional[datetime]:
    time_tag = soup.find("time", attrs={"datetime": True})
    if time_tag:
        try:
            return datetime.fromisoformat(time_tag["datetime"])
        except ValueError:
            return None
    return None


# TODO:: tää on periaatteessa tehty article_fetcher.py, mutta vähän eri tavalla... voisko yhdistää?
def render_article_as_markdown(blocks: List[ContentBlockWeb]) -> str:
    parts: List[str] = []
    for b in blocks:
        if b.type == "title":
            parts.append(f"# {b.content}")
        elif b.type == "subheading":
            parts.append(f"## {b.content}")
        elif b.type == "text":
            parts.append(b.content)
        elif b.type == "image":
            parts.append(f"*{b.content}*")
    return "\n\n".join(parts)
