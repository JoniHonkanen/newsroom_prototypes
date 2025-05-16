# Editor-in-Chief Agent Prototype

## Purpose

Test how different editorial personas influence an AI agent's decisions to approve or reject news articles. Each persona affects the agent's editorial stance through prompt engineering.

## Core Idea

An LLM reviews a news article using a system prompt that includes a selected **editorial personality**. This shapes how the agent evaluates:

- Accuracy and sourcing  
- Ethics and legal risk  
- Style, tone, and narrative strength  
- Public interest relevance

## Personality Profiles

- **Default (Neutral)** – No specific stance.  
- **Strict Guardian** – Highly risk-averse and compliance-focused.  
- **Visionary Innovator** – Creative, bold, tolerates minor flaws.  
- **Lenient Realist** – Pragmatic, allows imperfections for timely publishing.  
- **Cautious Analyst** – Methodical, strictly factual and neutral.  
- **Strategic Analyst (INTJ)** – Logic-driven, allows disruption if reasoned.  
- **Reflective Humanist** – Empathetic, thoughtful, values nuance and fairness.

## Features

- Fetches and parses article content from a URL  
- Applies chosen persona to the LLM prompt  
- Returns structured output:  
  - Status (approved/rejected)  
  - Issues and suggestions  
  - Reasoning steps and optional reconsideration

## Usage

Install dependencies:

pip install -r requirements.txt
