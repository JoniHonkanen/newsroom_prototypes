from typing import List
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from langchain.output_parsers import PydanticOutputParser
from dotenv import load_dotenv

# own imports
from services.rss_utils import fetch_rss_feed
from services.article_fetcher import extract_article_text, render_article_as_markdown
from schemas import GeneratedNewsItem, NewsDraftPlan
from services.web_search import generate_search_queries, run_web_search
from prompts import NEWS_PLANNING_PROMPT, GENERATE_NEWS_PROMPT

load_dotenv()

llm = init_chat_model("gpt-4o-mini", model_provider="openai")

FEED_URL = "https://feeds.yle.fi/uutiset/v1/mostRead/YLE_UUTISET.rss"

# This prototype get ideas from RSS feed, and tries to generate new articles from it.
# This uses multi agent system, to generate and validate the generated articles.

# Steps goes somehow like this:
# fetch most interesting news from the RSS feed
# then store it to database
# generate new articles from the fetched topcs using RAG-operations (web search...etc.)
# then store the generated articles to the database as news articles
# profit :)


class State(TypedDict):
    drafts: list[NewsDraftPlan]
    generated_news: list[GeneratedNewsItem]


# Get articles from RSS and generate ideas for new articles
# pass ideas etc to the next agent, which generates the news articles
# For testing use numer of articles = 1 (get first article from the feed)
def bot_get_ideas(state: State) -> dict:
    print("\n AGENT 1: FETCHING ARTICLES AND GENERATING IDEAS")
    feed = fetch_rss_feed(FEED_URL, 1)

    structured_llm = llm.with_structured_output(NewsDraftPlan)
    drafts: List[NewsDraftPlan] = []

    for item in feed:
        link = item["link"]

        # TODO:: Tarvitaanko tätä ekaa, vai pitäisikö suoraan muutta markdowniksi?
        # Strukturoitu hyvä jos tarvii vaikka tietokantaan tallentaa...
        # first extract the article -> h1, h2, p, li, figcaption etc...
        full_text, published_str = extract_article_text(link)

        # convert this to markdown, so llm can read it better
        full_text_markdown = render_article_as_markdown(full_text)

        planning_prompt = NEWS_PLANNING_PROMPT.format(
            article_text=full_text_markdown, published_date=published_str or "Unknown"
        )

        plan: NewsDraftPlan = structured_llm.invoke(planning_prompt)

        print("Draft BEFORE plan:", plan)

        # Liitetään markdown skeeman kenttään
        plan.markdown = full_text_markdown
        plan.url = link

        print("Draft AFTER plan:", plan)

        drafts.append(plan)

    return {"drafts": drafts}


# Generate news articles based on the ideas from the previous step
# this uses web search to get more information about the topic
def bot_generate_news(state: State) -> dict:
    print("\n AGENT 2: GENERATING NEWS ARTICLES")
    generated: list[GeneratedNewsItem] = []
    structured_llm = llm.with_structured_output(GeneratedNewsItem)

    # Draft is news article thats been fetched from the RSS feed, and we want to loop em through
    for draft in state["drafts"]:
        print("Generating article for idea:", draft.idea)
        # fall back jos draft.web_search_queries is None, niin set ite generoidaan ne query
        # make web search queries based on LLM given search queries
        queries = draft.web_search_queries or generate_search_queries(draft)
        print("Search queries:", queries)

        # make web search based on the queries
        articles = run_web_search(queries)
        print("Search results:", articles)

        # The original article from the RSS feed
        original_article = draft.markdown
        original_article_url = draft.url

        # Generate markdown from all the articles, so we can use it as a background for the article
        # also url is added so we can add it to the references field in the generated article
        background_md = "\n\n".join(
            f"## Web search based article {i + 1}\n\nURL: {article.url}\n\n{article.markdown}"
            for i, article in enumerate(articles)
            if article.markdown
        )

        # We want use ideas from the original article... include summary, keywords, etc.
        idea = draft.idea
        summary = draft.summary
        keywords = draft.keywords
        published = draft.published
        language = draft.language

        prompt = GENERATE_NEWS_PROMPT.format(
            idea=idea,
            summary=summary,
            keywords=", ".join(keywords),
            published=published,
            language=language,
            original_article=original_article,
            original_article_url=original_article_url,
            web_articles=background_md,
        )
        article = structured_llm.invoke(prompt)
        print("\n****************************************\n")
        print("Generated article:", article)
        generated.append(article)

    return {"generated_news": generated}


# pipeline for agents:
graph_builder = StateGraph(State)
# NODES
graph_builder.add_node("ideabot", bot_get_ideas)
graph_builder.add_node("newsbot", bot_generate_news)

# EDGES
graph_builder.add_edge(START, "ideabot")
graph_builder.add_edge("ideabot", "newsbot")
graph_builder.add_edge("newsbot", END)

# COMPILE
graph = graph_builder.compile()


if __name__ == "__main__":
    result = graph.invoke({})
