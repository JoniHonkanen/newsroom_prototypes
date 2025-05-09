# News Generator with Gradio UI

This project implements a multi-agent news enrichment system using **Gradio** as the user interface. The system extracts a news article from a given URL, generates a new article idea, enriches it via web search, and outputs a fully written news piece.

This project is a continuation of the earlier prototype:
https://github.com/JoniHonkanen/newsroom_prototypes/tree/main/rss_fetching

Unlike the previous version, this tool does **not use RSS feeds**.  
Instead, the user provides a single news article URL as input.

The purpose of this tool is to **demonstrate the full news generation process**  
and to **test how different parameters (model, temperature, prompts) affect the final output**.

So this is for testing purpose only and thats why may include some bugs

---

## 🔧 Installation

1. Clone this repository and navigate into the directory:

2. Create a virtual environment (recommended):

   python -m venv .venv  
   source .venv/bin/activate  
   (On Windows: .venv\Scripts\activate)

3. Install dependencies:

   pip install -r requirements.txt

4. Set environment variables (use a `.env` file):

   OPENAI_API_KEY=your_openai_key_here

---

## 🚀 Running the Application

Run the main app:

   python main.py

The Gradio interface will open in your browser at http://127.0.0.1:7860

---

## 🧠 How It Works

1. You paste a news article URL (preferably from a Finnish site like Yle).
2. The system extracts the article content and metadata.
3. It generates:
   - A summary
   - A new article idea
   - Keywords and search queries
4. It performs a web search to find related supporting articles.
5. It then writes a new enriched article based on the original + supporting sources.

---

## 🖥️ Interface Overview

### Inputs (top row)

- News Article URL
- Model (gpt-4o-mini or gpt-4o)
- Temperature slider
- Generate News button

### Tabs

**Comparison**  
- Left: Original Article (Markdown)  
- Right: Enriched Article (Markdown)

**Source Articles**  
- All supporting web articles used for enrichment  
- Includes full URLs and markdown content

**Agent Prompts**  
- Editable prompt for planning (summary, idea, keywords)  
- Editable prompt for final article generation

---

**Note:** DuckDuckGo search has rate limits. To avoid failures, the system retries queries with exponential backoff (e.g., waits 2s, 4s, etc.). Some queries may still fail if limits are hit repeatedly.

---

## 🧪 Tips

- Prompt placeholders like {article_text}, {idea}, {published_date} must be included in the templates.
- Supports real-time streaming via Gradio.
- Prompts are editable live in the UI.

---

## 📃 License

MIT License — free for personal or commercial use.