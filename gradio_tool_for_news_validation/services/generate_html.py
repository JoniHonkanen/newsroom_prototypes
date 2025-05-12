def stringify_location_tag(tag) -> str:
    parts = []
    if hasattr(tag, "city") and tag.city:
        parts.append(tag.city)
    if hasattr(tag, "region") and tag.region:
        parts.append(tag.region)
    if hasattr(tag, "country") and tag.country:
        parts.append(tag.country)
    if hasattr(tag, "continent") and tag.continent:
        parts.append(tag.continent)
    return ", ".join(parts)


def render_generated_news_html(news) -> str:
    title = next((b.content for b in news.body if b.type == "headline"), news.title)
    locations_as_str = [stringify_location_tag(tag) for tag in news.location_tags or []]

    html = f"<!DOCTYPE html>\n<html lang=\"{news.language}\">\n<head>\n"
    html += f"<meta charset=\"UTF-8\">\n<title>{title}</title>\n"

    # --- META ---
    if news.keywords:
        html += f'<meta name="keywords" content="{", ".join(news.keywords)}">\n'
    if news.category:
        html += f'<meta name="category" content="{", ".join(str(c) for c in news.category)}">\n'
    if news.location_tags:
        html += f'<meta name="location" content="{"; ".join(locations_as_str)}">\n'

    html += f'<meta property="og:title" content="{title}">\n'
    html += '<meta property="og:type" content="article">\n'
    html += f'<meta property="og:locale" content="{news.language.replace("_", "-")}">\n'
    html += f'<meta name="twitter:card" content="summary">\n'
    html += f'<meta name="twitter:title" content="{title}">\n'

    # --- CSS ---
    html += """
<style>
body {
    font-family: sans-serif;
    max-width: 700px;
    margin: 0 auto;
    padding: 2em;
}
header, main, footer {
    margin-bottom: 2em;
}
.category-label {
    font-size: 0.85em;
    font-weight: bold;
    color: red;
    text-transform: uppercase;
    margin-bottom: 0.5em;
}
.tldr {
    border-left: 4px solid #888;
    padding: 1em;
    margin-bottom: 1.5em;
    font-style: italic;
}
.meta {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 0.5em;
}
footer ul {
    padding-left: 1.2em;
}
@media (prefers-color-scheme: light) {
    .tldr { background: #f9f9f9; color: #222; }
}
@media (prefers-color-scheme: dark) {
    body { background: #121212; color: #ddd; }
    .tldr { background: #222; color: #ddd; }
}
</style>
</head>
<body>
<article>
"""

    # --- HEADER ---
    html += "<header>\n"
    if news.category:
        html += f'<div class="category-label">{", ".join(str(c) for c in news.category)}</div>\n'

    for block in news.body:
        if block.type == "headline":
            html += f"<h1>{block.content}</h1>\n"
        elif block.type == "intro":
            html += f'<div class="tldr">{block.content}</div>\n'
    html += "</header>\n"

    # --- MAIN ---
    html += "<main>\n"
    for block in news.body:
        if block.type in {"headline", "intro"}:
            continue
        elif block.type == "subheading":
            html += f"<h2>{block.content}</h2>\n"
        elif block.type == "text":
            html += f"<p>{block.content}</p>\n"
        elif block.type == "image":
            html += f'<img src="{block.content}" alt="Image" />\n'
    html += "</main>\n"

    # --- FOOTER ---
    html += "<footer>\n"
    if news.location_tags:
        html += f'<div class="meta" data-type="location">{"; ".join(locations_as_str)}</div>\n'
    if news.keywords:
        html += f'<div class="meta" data-type="keywords">{", ".join(news.keywords)}</div>\n'
    if news.references:
        html += "<section class=\"references\">\n"
        heading = getattr(news, "reference_heading", None)
        if heading:
            html += f"<h4>{heading}</h4>\n"
        html += "<ul>\n"
        for ref in news.references:
            html += f'<li><a href="{ref.url}">{ref.title}</a></li>\n'
        html += "</ul>\n</section>\n"
    html += "</footer>\n"

    html += "</article>\n</body>\n</html>"
    return html
