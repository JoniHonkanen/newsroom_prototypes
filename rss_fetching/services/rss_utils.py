import feedparser
from datetime import datetime, timezone
#some functions to keep main.py clean

# fetch the RSS feed
def fetch_rss_feed(url: str, max_news: int) -> list:
    feed = feedparser.parse(url)
    news_list = []

    # lets extract the title, link, summmary and unique id from the feed
    # OBS!! these have done yle.fi specific, so they might not work with other feeds!
    # Obs! Feedparser does some own partins for example <guid> tags, pubDate -> published etc..
    for i, entry in enumerate(feed.entries[:max_news], 1):
        title = clean_text(entry.get("title", "No title"))
        summary = clean_text(entry.get("summary", "No summary"))
        published = parse_rss_datetime(entry)
        link = entry.get("link", "No link")
        guid_url = entry.get("id", "") or entry.get("id", "")
        unique_id = extract_id_from_guid(guid_url)

        # here we should add to database, but for now we just return is as a list of dicts
        news_list.append(
            {
                "title": title,
                "summary": summary,
                "published": published,
                "link": link,
                "unique_id": unique_id,
            }
        )

    return news_list

# Feed may include odd characters, so we need to clean it up... (maybe)
# for example Pohjois\xadpohjalaisella -> Pohjoispohjalaisella (\xad is soft hyphen)
def clean_text(text: str) -> str:
    # Removes soft hyphens, zero-width spaces, and non-breaking spaces
    return (
        text.replace("\u00ad", "")  # soft hyphen
        .replace("\u200b", "")  # zero-width space
        .replace("\xa0", " ")  # non-breaking space → normal space
        .strip()
    )

# Extract ID part from <guid> URL, e.g. https://yle.fi/a/74-20158937 → 74-20158937
# works also if only id is given, e.g. 74-20158937
def extract_id_from_guid(guid_url: str) -> str:
    if not guid_url:
        return "No id"
    if "://" in guid_url:  # likely a full URL
        return guid_url.rstrip("/").split("/")[-1]
    return guid_url.strip()  # assume it's already the ID

# convert published date to ISO format (timezone aware)
def parse_rss_datetime(entry) -> str:
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")
    return "1970-01-01T00:00:00Z"

