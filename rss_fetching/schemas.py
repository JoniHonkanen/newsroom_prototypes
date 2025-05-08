from dataclasses import dataclass
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal
from enum import Enum
from typing import Optional
from datetime import datetime


# Categories
class Category(str, Enum):
    WORLD = "World"
    POLITICS = "Politics"
    ECONOMY = "Economy"
    TECHNOLOGY = "Technology"
    SCIENCE = "Science"
    HEALTH = "Health"
    EDUCATION = "Education"
    CULTURE = "Culture"
    SPORTS = "Sports"
    ENTERTAINMENT = "Entertainment"
    WEATHER = "Weather"
    CRIME = "Crime"
    ENVIRONMENT = "Environment"
    LIFESTYLE = "Lifestyle"
    OPINION = "Opinion"
    LOCAL = "Local"
    BREAKING = "Breaking"


# Location tags
class LocationTag(BaseModel):
    continent: Optional[str] = Field(description="Continent, e.g., 'Asia', 'Europe'")
    country: Optional[str] = Field(description="Country, e.g., 'Finland'")
    region: Optional[str] = Field(description="Region or state, e.g., 'Pirkanmaa'")
    city: Optional[str] = Field(description="City or locality, e.g., 'Akaa'")


# This model is used to read news articles from the RSS feed and get ideas from them.
class NewsDraftPlan(BaseModel):
    summary: str = Field(description="A concise summary of the original news article.")
    idea: str = Field(description="A new news idea inspired by the summarized article.")
    categories: List[Category] = Field(
        description="A list of categories the article belongs to. At least one required."
    )
    keywords: List[str] = Field(
        description="Essential search terms or entities related to the article, e.g., names, places, topics."
    )
    language: str = Field(
        description="The language code of the article content, e.g., 'fi', 'en' or 'sv' using ISO 639-1 language codes."
    )
    published: Optional[str] = Field(
        description="ISO 8601 timestamp indicating when the article was originally published."
    )
    web_search_queries: List[str] = Field(
        description=(
            "Auto-generated search queries derived from the idea, summary, and keywords. "
            "Queries should focus on retrieving recent, relevant, and factual information to enrich the article. "
            "Prefer terms that help find up-to-date news, expert commentary, or official statements related to the topic."
        )
    )
    markdown: Optional[str] = Field(
        default=None, description="Original news as markdown format."
    )
    url: Optional[str] = Field( default=None, description="The full URL of the article.")

    # pydantic will automatically convert enum values to their string representation!!!
    class Config:
        use_enum_values = True


# This model is used to represent the content blocks of the generated news article.
# Each block can be of different types, such as 'intro', 'text', 'subheading', or 'image'.
class ContentBlock(BaseModel):
    type: Literal["headline", "intro", "text", "subheading", "image"] = Field(
        description="Type of content: 'headline' for the main article title, 'intro' for lead paragraph, 'text' for body, 'subheading' for section title, 'image' for media reference."
    )
    content: str = Field(
        description="The actual content of the block: plain text, subheading text, or image description/URL."
    )


class ArticleReference(BaseModel):
    title: str = Field(description="The title of the referenced article.")
    url: str = Field(description="The original URL of the referenced article.")


# This model represents the generated news item, including its title, categories, and body content.
class GeneratedNewsItem(BaseModel):
    title: str = Field(description="The main headline of the generated news article.")
    body: List[ContentBlock] = Field(
        description="A structured list of content blocks that make up the body of the article."
    )
    category: List[Category] = Field(
        description="A list of thematic categories assigned to the article. Must include at least one relevant category from the predefined list. Multiple categories are allowed if applicable.",
    )
    keywords: List[str] = Field(
        description="Relevant terms derived from the article’s content and context. Include both directly mentioned and closely related concepts to support indexing, filtering, and retrieval."
    )
    location_tags: Optional[List[LocationTag]] = Field(
        default=None,
        description="A list of geographic or regional tags relevant to the article content, such as countries, cities, or regions.",
    )
    language: str = Field(
        description="The language code of the generated article content, e.g., 'fi', 'en' or 'sv' using ISO 639-1 language codes."
    )
    references: Optional[List[ArticleReference]] = Field(
        default=None,
        description="List of original and supporting articles used as sources. Includes titles and URLs.",
    )
    # pydantic will automatically convert enum values to their string representation!!!
    class Config:
        use_enum_values = True


# TODO:: mietippä tätä uusiksi
# Ehkä tän pysyisi jotenkin tekemään samalla tavalla kuin ContentBlock... eli poistaisi tän...
class ContentBlockWeb(BaseModel):
    type: Literal["title", "subheading", "text", "image"]
    content: str


# this for web search,
class StructuredSourceArticle(BaseModel):
    url: HttpUrl = Field(description="The full URL to the source article.")
    domain: str = Field(
        description="The domain name of the article's source, e.g. 'yle.fi'"
    )
    published: Optional[datetime] = Field(
        default=None,
        description="The publication timestamp of the article in ISO 8601 format, if available.",
    )
    content_blocks: List[ContentBlockWeb] = Field(
        description="A list of structured content blocks from the article."
    )
    markdown: str = Field(
        description="The same content rendered as Markdown, for LLM‐syötteeksi."
    )
