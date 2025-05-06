from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

# own imports
from services.rss_utils import fetch_rss_feed
from services.article_fetcher import extract_article_text, render_article_as_markdown
from schemas import GeneratedNewsItem, NewsDraftPlan
from prompts import (
    NEWS_PLANNING_PROMPT,
    GENERATE_NEWS_PROMPT
)

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


def bot_get_ideas(state: State) -> dict:
    feed = fetch_rss_feed(FEED_URL, 1)
    structured_llm = llm.with_structured_output(NewsDraftPlan)
    drafts = []

    for item in feed:
        link = item["link"]

        # TODO:: Tarvitaanko tätä ekaa, vai pitäisikö suoraan muutta markdowniksi?
        # Strukturoitu hyvä jos tarvii vaikka tietokantaan tallentaa...
        # first extract the article -> h1, h2, p, li, figcaption etc...
        full_text, published_str = extract_article_text(link)
        # convert this to markdown, so llm can read it better
        full_text_markdown = render_article_as_markdown(full_text)
        print("Full text:", full_text_markdown)
        print("\n****************************************\n")
        planning_prompt = NEWS_PLANNING_PROMPT.format(
            article_text=full_text_markdown, published_date=published_str or "Unknown"
        )
        print("Planning prompt:", planning_prompt)
        print("\n****************************************\n")
        plan = structured_llm.invoke(planning_prompt)
        print("Draft plan:", plan)
        print("\n****************************************\n")

        drafts.append(plan)

    return {"drafts": drafts}


def bot_generate_news(state: State) -> dict:
    generated: list[GeneratedNewsItem] = []
    structured_llm = llm.with_structured_output(GeneratedNewsItem)

    for draft in state["drafts"]:
        print("Generating article for idea:", draft.idea)
        prompt = GENERATE_NEWS_PROMPT.format(plan=draft.model_dump_json())
        print("Generation prompt for news:", prompt)
        print("\n****************************************\n")
        article = structured_llm.invoke(prompt)
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
    for i, article in enumerate(result["generated_news"], 1):
        print(
            f"\n{i}. {article.title} [{', '.join(c.value for c in article.category)}]"
        )
        for block in article.body:
            if block.type == "intro":
                print(f"\nINTRO: {block.content}")
            elif block.type == "subheading":
                print(f"\n{block.content.upper()}")
            elif block.type == "text":
                print(block.content)
            elif block.type == "image":
                print(f"[Image: {block.content}]")
        print("-" * 80)
