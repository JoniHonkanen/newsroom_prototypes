import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
from typing import List, Dict, Optional, Tuple


def extract_article_text(url: str) -> Tuple[List[Dict[str, str]], Optional[str]]:

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }

    try:
        html = requests.get(url, headers=headers, timeout=10).text
        soup = BeautifulSoup(html, "html.parser")
    except Exception as e:
        print(f"[requests ERROR] {e}")
        print("[INFO] Falling back to Selenium...")
        soup = _extract_with_selenium_bs(url)

    # Ainakin ylellä uutinen on <article> tagin sisällä, eli käytetään sitä... jos tagia ei ole niin käytetään koko dokumenttia
    # <article> tag is used for the main content, if not found, use the entire document
    article_tag = soup.find("article")
    if not article_tag:
        print("[WARNING] <article> tag not found, using entire document")
        article_tag = soup
    else:
        # Poista mahdollinen <footer> artikkelin sisältä
        # ainakin ylellä footer on <article> tagin sisällä, ja siinä turhaa sisältöä
        footer = article_tag.find("footer")
        if footer:
            footer.decompose()

    blocks: List[Dict[str, str]] = []

    # Main heading
    if h1 := article_tag.find("h1"):
        text = h1.get_text(strip=True)
        if text:
            blocks.append({"type": "title", "content": text})

    # Section headings
    for h2 in article_tag.find_all("h2"):
        text = h2.get_text(strip=True)
        if text:
            blocks.append({"type": "subheading", "content": text})

    # Paragraphs
    for p in article_tag.find_all("p"):
        text = p.get_text(strip=True)
        if text:
            blocks.append({"type": "text", "content": text})

    # List items (e.g. fact boxes)
    for li in article_tag.find_all("li"):
        text = li.get_text(strip=True)
        if text:
            blocks.append({"type": "text", "content": text})

    # Figure captions
    for fig in article_tag.find_all("figcaption"):
        text = fig.get_text(strip=True)
        if text:
            blocks.append({"type": "image", "content": text})
            
    # Publication datetime
    # Ýlen artikkelissa oli time elementti, jossa class="published"... tämä sen perusteella
    pub_time_tag = soup.find("time")
    publication_time = pub_time_tag.get("datetime") if pub_time_tag else None

    return blocks, publication_time


# If requests fails, we use Selenium to extract the content
#TODO:: THIS FALLBACK IS NOT TESTED YET...
def _extract_with_selenium_bs(url: str) -> BeautifulSoup:
    """
    Uses Selenium to load the page and returns a BeautifulSoup object of its HTML.
    """
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        time.sleep(2)  # allow dynamic content to load
        html = driver.page_source
        return BeautifulSoup(html, "html.parser")
    finally:
        driver.quit()


# Maybe its better to return news as markdown for the LLM...
def render_article_as_markdown(blocks: List[Dict[str, str]]) -> str:
    lines: List[str] = []
    for b in blocks:
        t, c = b["type"], b["content"]
        if t == "title":
            lines.append(f"# {c}")
        elif t == "subheading":
            lines.append(f"## {c}")
        elif t == "text":
            lines.append(c)
        elif t == "image":
            # if content looks like a URL, embed as image; otherwise italicize caption
            if c.startswith("http"):
                lines.append(f"![Image]({c})")
            else:
                lines.append(f"*{c}*")
    return "\n\n".join(lines).strip()
