# AI Prototypes and Experiments

This repository contains prototypes and experimental implementations related to various ideas and subproblems.  
Each subdirectory contains a self-contained project with its own code, dependencies, and `README.md`.

These projects are intended for testing, learning, and rapid development purposes — not for production use.

## Structure

- Each folder is an isolated prototype or concept.
- Dependencies are defined per project (e.g. `requirements.txt`).
- Some projects may use Docker and `.env` files for testing environments.

## Notes

- Prototypes may be incomplete or exploratory by nature.
- Keep sensitive data out of version control (see `.gitignore`).
- See individual `README.md` files inside each project folder for details.

## Projects

- **news_similarity/**  
  Prototype for storing news articles as vector embeddings and finding semantically similar ones using SentenceTransformers and pgvector.

- **rss_fetching/**
  Experiments with fetching news content from RSS feeds, generating original article drafts, and enriching them with related news using semantic similarity.

- **gradio_tool_for_news_validation/**  
  This is an extension of the "rss_fetching" module.  
  It shows the process for generating and validating news:
  - Fetching and parsing a single news item  
  - Making web searches and enriching the original news with them  
  - Validating whether the generated news is suitable for publication  
  - Logging the reasoning of agents  
  
  For testing different kinds of validations, a new project has been created called **"Editor in Chief"**.

- **Editor in Chief/**  
  The purpose is to test whether the editor-in-chief ("Päätoimittaja") accepts or rejects real news that has been published.  
  This is more about prompt engineering — teaching the main boss:
  - Provide a link to the news so the editor-in-chief can review it  
  - Check whether the editor accepts or rejects it  
    - Adjust the prompt accordingly
  - Log the reasoning that editor in chief does
