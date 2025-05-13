from typing import TypedDict, Tuple, Generator, List
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import gradio as gr

# omat importit
from services.article_fetcher import extract_article_text, render_article_as_markdown
from schemas import (
    AgentReasoning,
    EditorialReasoning,
    GeneratedNewsItem,
    LogReasoning,
    NewsDraftPlan,
    ReviewedNewsItem,
)
from services.generate_html import render_generated_news_html
from services.web_search import (
    generate_search_queries,
    run_web_search,
    StructuredSourceArticle,
)
from prompts import EDITOR_IN_CHIEF_PROMPT, NEWS_PLANNING_PROMPT, GENERATE_NEWS_PROMPT

load_dotenv()
# llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0.7)
llm = None  # Placeholder for the global LLM variable
plan_prompt = ""
gen_prompt = ""
validation_prompt = ""


class State(TypedDict):
    url: str  # URL of the original article
    drafts: NewsDraftPlan  # Draft plans
    generated_news: GeneratedNewsItem  # Generated news item
    search_results: List[StructuredSourceArticle]  # List of source articles
    queries: List[str]  # List of search queries
    reviewed_news: ReviewedNewsItem  # Reviewed news item
    html: str  # HTML representation of the final article
    log_reasoning: LogReasoning  # for logging agents reasoning


def bot_get_idea(state: State) -> dict:
    print("AGENT - Getting news idea")
    link = state["url"]
    full_text, published = extract_article_text(link)
    md = render_article_as_markdown(full_text)
    structured = llm.with_structured_output(NewsDraftPlan)
    plan: NewsDraftPlan = structured.invoke(
        plan_prompt.format(article_text=md, published_date=published or "Unknown")
    )

    plan.markdown = md
    plan.url = link

    # logging reason
    state["log_reasoning"].planning.append(
        AgentReasoning(
            agent="Planning agent",
            explanation=plan.logging_reasoning,
        )
    )
    return {"drafts": plan}


def bot_generate_news(state: State) -> dict:
    print("AGENT - Generating news")
    draft = state["drafts"]
    structured = llm.with_structured_output(GeneratedNewsItem)

    queries = draft.web_search_queries or generate_search_queries(draft)
    articles = run_web_search(queries)

    bg = "\n\n".join(
        f"## Web search article {i+1}\nURL: {a.url}\n\n{a.markdown}"
        for i, a in enumerate(articles)
        if a.markdown
    )

    prompt = gen_prompt.format(
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
    md = render_generated_news(article)
    article.markdown = md

    # logging reason
    reason_text = article.logging_reasoning
    state["log_reasoning"].generator.append(
        AgentReasoning(
            agent="News generator agent",
            explanation=reason_text,
        )
    )

    return {"generated_news": article, "search_results": articles, "queries": queries}


def bot_editor_in_chief(state: State) -> dict:
    print("AGENT - Validating and reviewing news")
    news: GeneratedNewsItem = state["generated_news"]

    structured = llm.with_structured_output(ReviewedNewsItem)
    prompt = validation_prompt.format(
        generated_article_markdown=news.markdown,
        references=news.references,
    )

    reviewed: ReviewedNewsItem = structured.invoke(prompt)

    # lets make HTML for the final article
    news_as_html = render_generated_news_html(news)

    state["log_reasoning"].reviewer.append(reviewed.reasoning)

    return {"reviewed_news": reviewed, "html": news_as_html}


# Pistetään lokit nättiin muotoon
def format_logs(log_reasoning: LogReasoning) -> str:
    sections = []

    # Planning-agentin lokit
    if log_reasoning.planning:
        sections.append("### Planning Agent Logs")
        for i, r in enumerate(log_reasoning.planning, 1):
            sections.append(f"**[{i}] {r.agent}**\n{r.explanation}")

    # Generator-agentin lokit
    if log_reasoning.generator:
        sections.append("### Generator Agent Logs")
        for i, r in enumerate(log_reasoning.generator, 1):
            sections.append(f"**[{i}] {r.agent}**\n{r.explanation}")

    # Reviewer-lokit (rakenne eri)
    if log_reasoning.reviewer:
        sections.append("### Reviewer Logs")
        for i, r in enumerate(log_reasoning.reviewer, 1):
            block = [
                f"**[{i}] Reviewer:** {r.reviewer}",
                f"- **Decision:** {r.decision}",
                f"- **Checked Criteria:** {', '.join(r.checked_criteria)}",
                f"- **Failed Criteria:** {', '.join(r.failed_criteria) or 'None'}",
                f"- **Explanation:**\n{r.detailed_explanation.strip()}",
            ]
            sections.append("\n".join(block))

    return "\n\n".join(sections)


def render_generated_news(item: GeneratedNewsItem) -> str:
    md = ""
    references = []

    for block in item.body:
        if block.type == "headline":
            md += f"## {block.content}\n\n"
        elif block.type == "subheading":
            md += f"### {block.content}\n\n"
        elif block.type == "reference":
            references.append(block.content)
        else:
            md += f"{block.content}\n\n"

    if references:
        md += "\n### References\n"
        for i, ref in enumerate(references, 1):
            md += f"[{i}]: {ref}\n"

    return md


# Optional: build graph for consistency
builder = StateGraph(State)
builder.add_node("ideabot", bot_get_idea)
builder.add_node("newsbot", bot_generate_news)
builder.add_node("validationbot", bot_editor_in_chief)
builder.add_edge(START, "ideabot")
builder.add_edge("ideabot", "newsbot")
builder.add_edge("newsbot", "validationbot")
builder.add_edge("validationbot", END)
graph = builder.compile()


def process_article_url_stream(
    url: str,
    model_name: str,
    temperature: float,
    plan_prompt_text: str,
    gen_prompt_text: str,
    validation_prompt_text: str,
) -> Generator[Tuple[str, str, str, str, str, str, str], None, None]:
    # So agents can use the values... they are global
    global llm, plan_prompt, gen_prompt, validation_prompt
    llm = init_chat_model(model_name, model_provider="openai", temperature=temperature)
    plan_prompt = plan_prompt_text
    gen_prompt = gen_prompt_text
    validation_prompt = validation_prompt_text

    # STEP 1: Fetch original article and show it immediately
    full_text, published = extract_article_text(url)
    # just to quickly show something on the screen
    original_md = render_article_as_markdown(full_text)
    yield "", original_md, "", "", "", "", ""

    # STEP 2 & 4: Delegate planning and generation to the graph
    # Syöttötilaksi riittää URL; graph-solmut käyttävät globaaleja prompt-muuttujia
    initial_state = {"url": url, "log_reasoning": LogReasoning()}
    final_state = graph.invoke(initial_state)

    # Hae luonnos ja generaattiot
    draft: NewsDraftPlan = final_state["drafts"]
    queries = draft.web_search_queries or generate_search_queries(draft)
    yield f"**Search queries:** {', '.join(queries)}", original_md, "Generating enriched article…", "", "", "", ""

    generated: GeneratedNewsItem = final_state["generated_news"]
    enriched_md = render_generated_news(generated)
    articles = final_state["search_results"]

    # Kokoa lähdeartikkelit markdowniksi
    source_urls = [str(a.url) for a in articles]
    source_md = "\n\n".join(
        f"### Article {i+1}\n\n**URL:** {u}\n\n{a.markdown}"
        for i, (u, a) in enumerate(zip(source_urls, articles), start=1)
        if a.markdown
    )

    reviewed: ReviewedNewsItem = final_state["reviewed_news"]
    if reviewed.status == "OK":
        review_section = (
            "**Review status:** OK\n"
            f"**Approval comment:** {reviewed.approval_comment or '–'}"
        )
    else:
        issues_list = "\n".join(f"- {issue.description}" for issue in reviewed.issues)
        review_section = (
            "**Review status:** ISSUES_FOUND\n" "**Issues found:**\n" f"{issues_list}"
        )

    # Get logs from state
    formatted_logs = format_logs(final_state["log_reasoning"])

    # this need to be same as gradio outputs (at button click part)
    yield (
        f"**Search queries:** {', '.join(queries)}\n\n"
        f"**Source URLs:**\n- " + "\n- ".join(source_urls),
        original_md,
        enriched_md,
        source_md,
        final_state["html"] if "html" in final_state else "",
        review_section,
        formatted_logs,
    )


# Rakenna Gradio‐UI
with gr.Blocks(title="News Generator") as demo:
    with gr.Row():
        url_in = gr.Textbox(label="News Article URL", placeholder="https://…", scale=3)
        model_in = gr.Dropdown(
            ["gpt-4o-mini", "gpt-4o"], value="gpt-4o-mini", label="Model", scale=1
        )
        temp_in = gr.Slider(0.0, 2.0, 0.7, step=0.01, label="Temperature", scale=1)
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
            validation_prompt = gr.Textbox(
                value=EDITOR_IN_CHIEF_PROMPT,
                label="Validation Prompt",
                interactive=True,
                lines=15,
                elem_classes=["md-box"],
            )
        with gr.Tab("Final Article (HTML)"):
            html_tab = gr.HTML("", label="Final Article", elem_classes=["md-box"])
        with gr.Tab("Editor in Chief"):
            editor_in_chief = gr.HTML("", label="Decision", elem_classes=["md-box"])
        with gr.Tab("Logs"):
            logs = gr.Markdown("", label="Logging...", elem_classes=["md-box"])

    # Liitä callback; huom. inputs‐listaan nyt myös prompt‐kentät
    gen_btn.click(
        fn=process_article_url_stream,
        inputs=[
            url_in,
            model_in,
            temp_in,
            plan_prompt_in,
            gen_prompt_in,
            validation_prompt,
        ],
        outputs=[
            info_md,
            orig_md_tab,
            enrich_md_tab,
            source_tab,
            html_tab,
            editor_in_chief,
            logs,
        ],
        show_progress=True,
        queue=True,
    )

if __name__ == "__main__":
    demo.queue()  # for gradio streaming
    demo.launch()
