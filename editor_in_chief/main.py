from typing import Generator, Tuple
import requests
from bs4 import BeautifulSoup, Tag
from dotenv import load_dotenv
import gradio as gr
from langchain.chat_models import init_chat_model
import json

# omat importit
from services.news_parser import extract_article_text, render_article_as_markdown
from schemas import ReviewedNewsItem
from prompts import EDITOR_IN_CHIEF_PROMPT
from prompts_personality import PERSONALITY_PROFILES

load_dotenv()
llm = None


def review_news_article(
    url: str, model_name: str, temperature: float, persona_name
) -> Generator[str, None, None]:
    global llm

    if not url.startswith("http"):
        raise ValueError("Invalid URL")

    llm = init_chat_model(
        model_name,
        model_provider="openai",
        temperature=temperature,
        streaming=True,
        # model_kwargs={"reasoning": {"effort": "medium"}},
    )
    structured = llm.with_structured_output(ReviewedNewsItem)

    print("URL:", url)
    print("Model:", model_name)

    blocks, pub_time = extract_article_text(url)
    print("Blocks:", blocks)
    news_md = render_article_as_markdown(blocks)
    print("Markdown:", news_md)

    # use personality profile
    persona_prompt = PERSONALITY_PROFILES[persona_name]

    editor_in_chief_reasoning: ReviewedNewsItem = structured.invoke(
        EDITOR_IN_CHIEF_PROMPT.format(
            persona=persona_prompt, generated_article_markdown=news_md
        )
    )

    # Tulosta halutessasi JSON
    readable = render_reviewed_item_as_text(editor_in_chief_reasoning)

    print("\nREVIEWED ITEM AS TEXT:\n", readable)

    # Tuota selkeä tekstitulos
    return readable


def render_reviewed_item_as_text(item: ReviewedNewsItem) -> str:
    lines = []
    lines.append(f"STATUS: {item.status}")

    if item.approval_comment:
        lines.append(f"APPROVAL COMMENT: {item.approval_comment}")

    if item.issues:
        lines.append("ISSUES:")
        for i, issue in enumerate(item.issues, 1):
            lines.append(f"  {i}. {issue.type} @ {issue.location}")
            lines.append(f"     Description: {issue.description}")
            lines.append(f"     Suggestion:  {issue.suggestion}")
    else:
        lines.append("ISSUES: None")

    r = item.editorial_reasoning
    lines.append(f"\nREVIEWER: {r.reviewer}")
    lines.append(f"\nINITIAL DECISION: {r.initial_decision}")
    lines.append(f"\nCHECKED CRITERIA: {', '.join(r.checked_criteria)}")
    lines.append(f"\nFAILED CRITERIA: {', '.join(r.failed_criteria) or 'None'}")

    lines.append("\nREASONING STEPS:")
    for step in r.reasoning_steps:
        lines.append(f"\n\n  Step {step.step_id}: {step.action}")
        lines.append(f"\n    Observation: {step.observation}")
        lines.append(f"\n    Result: {step.result}")

    lines.append("\nEXPLANATION:")
    lines.append(f"\n{r.explanation}")

    if r.reconsideration:
        rec = r.reconsideration
        lines.append("\nRECONSIDERATION:")
        lines.append(f"  Final decision: {rec.final_decision}")
        lines.append(
            f"  Failed criteria reconsidered: {', '.join(rec.failed_criteria)}"
        )
        for step in rec.reasoning_steps:
            lines.append(f"    Step {step.step_id}: {step.action} → {step.result}")
            lines.append(f"      Observation: {step.observation}")
        lines.append(f"  Explanation: {rec.explanation}")

    if item.editorial_warning:
        ew = item.editorial_warning
        lines.append("\nEDITORIAL WARNING:")
        lines.append(f"  Category: {ew.category}")
        lines.append(f"  Details: {ew.details}")
        if ew.topics:
            lines.append(f"  Topics: {', '.join(ew.topics)}")

    return "\n".join(lines)


# Gradio‐UI
with gr.Blocks(title="Editor in Chief") as demo:
    with gr.Row():
        url_in = gr.Textbox(label="News Article URL", placeholder="https://…", scale=3)
        model_in = gr.Dropdown(
            ["gpt-4o-mini", "gpt-4o"], value="gpt-4o-mini", label="Model", scale=1
        )
        temp_in = gr.Slider(0.0, 2.0, 0.7, step=0.01, label="Temperature", scale=1)
        # editor_prompt_type_in = gr.Dropdown(
        #    ["Pragmatic", "Strict Legalist", "Ethical Idealist", "Bold Publisher"],
        #    value="Pragmatic",
        #    label="Editorial Prompt",
        # )
        personality_profile_in = gr.Dropdown(
            choices=list(PERSONALITY_PROFILES.keys()),
            value="Visionary Innovator",
            label="Personality Profile",
        )
        gen_btn = gr.Button("Evaluate Article", scale=1)

    result_md = gr.Markdown("", label="ReviewedNewsItem JSON")

    gen_btn.click(
        fn=review_news_article,
        inputs=[
            url_in,
            model_in,
            temp_in,
            # editor_prompt_type_in,
            personality_profile_in,
        ],
        outputs=[result_md],
        show_progress=True,
        queue=True,
    )

if __name__ == "__main__":
    demo.queue()
    demo.launch()
