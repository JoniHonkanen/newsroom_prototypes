from typing import TypedDict, Tuple, Generator
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import gradio as gr

# omat importit
from services.article_fetcher import extract_article_text, render_article_as_markdown
from schemas import GeneratedNewsItem, NewsDraftPlan
from services.web_search import generate_search_queries, run_web_search
from prompts import NEWS_PLANNING_PROMPT, GENERATE_NEWS_PROMPT

load_dotenv()
llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0.7)


class State(TypedDict):
    url: str
    drafts: NewsDraftPlan
    generated_news: GeneratedNewsItem


def bot_get_idea(state: State) -> dict:
    link = state["url"]
    full_text, published = extract_article_text(link)
    md = render_article_as_markdown(full_text)
    structured = llm.with_structured_output(NewsDraftPlan)
    plan: NewsDraftPlan = structured.invoke(
        NEWS_PLANNING_PROMPT.format(
            article_text=md, published_date=published or "Unknown"
        )
    )
    plan.markdown = md
    plan.url = link
    return {"drafts": plan}


def bot_generate_news(state: State) -> dict:
    draft = state["drafts"]
    structured = llm.with_structured_output(GeneratedNewsItem)

    queries = draft.web_search_queries or generate_search_queries(draft)
    articles = run_web_search(queries)

    bg = "\n\n".join(
        f"## Web search article {i+1}\nURL: {a.url}\n\n{a.markdown}"
        for i, a in enumerate(articles)
        if a.markdown
    )

    prompt = GENERATE_NEWS_PROMPT.format(
        idea=draft.idea,
        summary=draft.summary,
        keywords=", ".join(draft.keywords),
        published=draft.published,
        language=draft.language,
        original_article=draft.markdown,
        original_article_url=draft.url,
        web_articles=bg,
    )
    article: GeneratedNewsItem = structured.invoke(prompt)

    return {"generated_news": article, "search_results": articles, "queries": queries}


def render_generated_news(item: GeneratedNewsItem) -> str:
    md = f"# {item.title}\n\n"
    for block in item.body:
        if block.type == "headline":
            md += f"## {block.content}\n\n"
        elif block.type == "subheading":
            md += f"### {block.content}\n\n"
        else:
            md += f"{block.content}\n\n"
    return md


# Optional: build graph for consistency
builder = StateGraph(State)
builder.add_node("ideabot", bot_get_idea)
builder.add_node("newsbot", bot_generate_news)
builder.add_edge(START, "ideabot")
builder.add_edge("ideabot", "newsbot")
builder.add_edge("newsbot", END)
graph = builder.compile()


def process_article_url_stream(
    url: str,
    model_name: str,
    temperature: float,
    plan_prompt_text: str,
    gen_prompt_text: str,
) -> Generator[Tuple[str, str, str, str], None, None]:
    # Initialize the LLM with the selected model and temperature (from gradio UI)
    global llm
    llm = init_chat_model(model_name, model_provider="openai", temperature=temperature)

    # --- STEP 1: GENERATE DRAFT PLAN ---
    full_text, published = extract_article_text(url)
    original_md = render_article_as_markdown(full_text)
    # Muotoile ja kutsu dokumentaatio‐promtia
    formatted_plan_prompt = plan_prompt_text.format(
        article_text=original_md, published_date=published or "Unknown"
    )
    print("formatted_plan_prompt ON TÄSSÄ: ", formatted_plan_prompt)
    structured_plan = llm.with_structured_output(NewsDraftPlan)
    draft: NewsDraftPlan = structured_plan.invoke(formatted_plan_prompt)
    draft.markdown = original_md
    draft.url = url

    print("draft ON TÄSSÄ", draft)
    # Näytä heti alkuperäinen + placeholderit
    queries = draft.web_search_queries or generate_search_queries(draft)
    yield (
        f"**Search queries:** {', '.join(queries)}",
        original_md,
        "Generating enriched article…",
        "",
    )

    # --- STEP 2: WEB SEARCH + FINAL ARTICLE ---
    articles = run_web_search(queries)
    # valmistele web‐materiaalit promtiin
    web_md = "\n\n".join(
        f"## Web search article {i+1}\nURL: {a.url}\n\n{a.markdown}"
        for i, a in enumerate(articles, start=1)
        if a.markdown
    )
    formatted_gen_prompt = gen_prompt_text.format(
        idea=draft.idea,
        summary=draft.summary,
        keywords=", ".join(draft.keywords),
        published=draft.published,
        language=draft.language,
        original_article=original_md,
        original_article_url=draft.url,
        web_articles=web_md,
    )
    structured_gen = llm.with_structured_output(GeneratedNewsItem)
    generated: GeneratedNewsItem = structured_gen.invoke(formatted_gen_prompt)
    enriched_md = render_generated_news(generated)

    # Kerää täsmälliset lähde‐URL:t ja lähdetekstit
    source_urls = [str(a.url) for a in articles]
    source_md = "\n\n".join(
        f"### Article {i+1}\n\n**URL:** {source_urls[i]}\n\n{a.markdown}"
        for i, a in enumerate(articles, start=0)
        if a.markdown
    )

    yield (
        f"**Search queries:** {', '.join(queries)}\n\n"
        f"**Source URLs:**\n- " + "\n- ".join(source_urls),
        original_md,
        enriched_md,
        source_md,
    )


# Rakenna Gradio‐UI
with gr.Blocks(title="News Generator") as demo:
    with gr.Row():
        url_in = gr.Textbox(label="News Article URL", placeholder="https://…", scale=3)
        model_in = gr.Dropdown(
            ["gpt-4o-mini", "gpt-4o"], value="gpt-4o-mini", label="Model", scale=1
        )
        temp_in = gr.Slider(0.0, 1.0, 0.7, step=0.01, label="Temperature", scale=1)
        gen_btn = gr.Button("Generate News", scale=1)

    info_md = gr.Markdown(
        "", label="Search Terms and Websites", elem_classes=["info-box"]
    )

    # Tabit ja vertailu
    with gr.Tabs():
        with gr.Tab("Comparison"):
            with gr.Row(equal_height=True):
                orig_md_tab = gr.Markdown(
                    "", label="Original Article", elem_classes=["md-box"]
                )
                enrich_md_tab = gr.Markdown(
                    "", label="Enriched Article", elem_classes=["md-box"]
                )
        with gr.Tab("Source Articles"):
            source_tab = gr.Markdown(
                "", label="Source Articles", elem_classes=["md-box"]
            )
        with gr.Tab("Agent Prompts"):
            plan_prompt_in = gr.Textbox(
                value=NEWS_PLANNING_PROMPT,
                label="Planning Prompt",
                interactive=True,
                lines=15,
                elem_classes=["md-box"],
            )
            gen_prompt_in = gr.Textbox(
                value=GENERATE_NEWS_PROMPT,
                label="Generate Prompt",
                interactive=True,
                lines=15,
                elem_classes=["md-box"],
            )

    # Liitä callback; huom. inputs‐listaan nyt myös prompt‐kentät
    gen_btn.click(
        fn=process_article_url_stream,
        inputs=[url_in, model_in, temp_in, plan_prompt_in, gen_prompt_in],
        outputs=[info_md, orig_md_tab, enrich_md_tab, source_tab],
        show_progress=True,
        queue=True,
    )

if __name__ == "__main__":
    demo.queue()  # for gradio streaming
    demo.launch()
