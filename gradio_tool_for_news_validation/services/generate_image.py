import openai
from typing import List


def extract_prompt_from_news(news) -> str:
    """Muodostaa kuvauksellisen kehotteen uutisen perusteella."""
    headline = next((b.content for b in news.body if b.type == "headline"), "")
    intro = next((b.content for b in news.body if b.type == "intro"), "")
    location = (
        ", ".join(tag.city for tag in news.location_tags if tag.city)
        if news.location_tags
        else ""
    )
    return f"An illustrative image for a news article titled '{headline}' set in {location}. Context: {intro}"


def generate_image_for_news(news, size: str = "1024x1024") -> str:
    """Generoi kuvan uutisesta OpenAI:n DALL·E-rajapinnalla ja palauttaa kuvan URL:n."""
    prompt = extract_prompt_from_news(news)

    response = openai.Image.create(prompt=prompt, n=1, size=size, response_format="url")

    image_url = response["data"][0]["url"]
    return image_url
