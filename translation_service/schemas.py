from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal
from enum import Enum

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

class BodyBlock(BaseModel):
    order: int
    type: Literal["headline", "intro", "text", "subheading", "image", "reference"]
    content: str | dict

class NewsArticleData(BaseModel):
    id: int
    canonical_news_id: int
    language: str
    is_original: bool = Field(default=False)
    version: Optional[int]
    lead: Optional[str]
    summary: Optional[str]
    status: Optional[str]
    location_tags: Optional[str]
    sources: Optional[str]
    interviews: Optional[str]
    revies_status: Optional[str]
    author: Optional[str]
    embedding: Optional[str]
    body_blocks: List[BodyBlock]
    published_at: Optional[str]
    updated_at: Optional[str]

class CanonicalNews(BaseModel):
    id: int
    title: str
    content: str
    vector: Optional[str]
    published_at: Optional[str]
    created_at: Optional[str]
    language: str
