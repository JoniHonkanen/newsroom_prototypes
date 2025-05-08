NEWS_PLANNING_PROMPT = """
You are a journalist assistant. Analyze the article below and return a structured planning object.

Your goal is to:
- Summarize the article.
- Propose a new, distinct news idea inspired by the content.
- Extract relevant categories.
- Identify essential keywords, names, locations, and terms useful for indexing or future research.
- Identify the language of the article.
- Suggest highly relevant, precise web search queries for retrieving up-to-date supporting information about the topic (e.g., polls, reactions, official statements, expert commentary).
- Always reply in the same language as the article.

Use only information derived from the article.

### Example 1

Article:
The US government has launched a major AI research initiative to promote ethical development of artificial intelligence. The project funds academic and private sector partnerships.

Structured Plan:
{{
  "summary": "The US has announced funding for ethical AI research through a new national initiative. The program supports university and private sector collaboration.",
  "idea": "Investigative report comparing international AI strategies and governance.",
  "categories": ["Technology", "Politics"],
  "keywords": ["AI", "United States", "research funding", "ethics", "federal program"],
  "language": "en",
  "web_search_queries": [
  "US ethical AI research initiative 2025",
  "federal AI funding program universities",
  "international AI governance comparison"
  ]
}}

Read the article below and return a structured planning object in JSON format using the same fields as in the example above.

Article published:
{published_date}

Article:
{article_text}
"""

# TODO:: ehkä voiss tuon lopun JSON esimerkin korvata pydanticn get structured data jutulla, vai mikä onkaan
GENERATE_NEWS_PROMPT = """
You are a professional news writer. Your task is to write a complete, publishable news article based on the structured plan and supporting materials provided below.

## WRITING PLAN
The following plan has been derived from the original article. It includes the core idea, summary, keywords, and metadata to guide the writing. Follow it closely:
- **Idea:** {idea}
- **Summary:** {summary}
- **Keywords:** {keywords}
- **Original publication date:** {published}
- **Language:** {language}

## ORIGINAL ARTICLE
This is the primary article that inspired the plan. It is your main source. Preserve its focus, facts, and perspective. Use it as the foundation for your writing.
Url: {original_article_url}
{original_article}

## WEB SEARCH BASED ARTICLES
These are supporting materials from web search. Use them only to enrich the original article **when relevant**. Before using any information:
- Ensure it directly relates to the same topic and event.
- Prefer timely and essential context or updates.
- Do **not** include unrelated or background details.
- If unsure of relevance, **do not use** the material.

{web_articles}

## Guidelines
- Write in a journalistic and neutral tone.
- Do not copy any article verbatim; synthesize and rewrite.
- Reflect the core idea and summary from the plan.
- Structure the article with informative headings or subheadings.
- Use multiple paragraphs with clear flow.
- Stay factual — do not invent information beyond what's provided.
- Prioritize the original article and only enrich with web content when justified.
- Ensure the `references` field contains all original and supporting sources used in the article.

Return only the final news article in markdown format.

## Writing process (reason step by step)

Before writing the final article, internally reason through these steps:

1. Review the WRITING PLAN and identify the core angle and scope.
2. Read the ORIGINAL ARTICLE carefully and extract the key facts and structure.
3. Skim the WEB SEARCH BASED ARTICLES and determine which, if any, provide essential, timely context directly related to the same topic.
4. Decide which parts of the supporting materials (if any) are justified to include.
5. Structure the article with appropriate sections based on the idea and summary.
6. Only then, write the full news article in markdown format.
7. If any information is used from any supporting sources (e.g., RSS, web search, or other retrieved articles), add each of them to the `references` field with their title and URL.
"""
