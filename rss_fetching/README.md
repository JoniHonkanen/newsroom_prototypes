# README

## Inputs and Interfaces

- **RSS** (Really Simple Syndication)  
- **Atom**
- **JSON Feed**?  
- **GraphQL / REST API**?  
- **Web Scraping** (must check terms of use)

### Libraries

- `feedparser` → for handling RSS and Atom feeds

## Notes

- Some services may block default bots.
- Avoid polling too frequently — RSS feeds typically update every **10–60 minutes**.

## Considerations

> Content provided in RSS feeds is **copyrighted** and belongs to **Yle or Yle's partners**.  
> You may **not modify, copy, or sell** the content.

## How to detect duplicate or identical news?

`ssdeep` (fuzzy hashing) vs `sentence-transformers`

Note: ssdeep requires: https://visualstudio.microsoft.com/visual-cpp-build-tools/

| Feature                              | ssdeep (fuzzy hash)                          | sentence-transformers (embedding)                  |
|-------------------------------------|----------------------------------------------|----------------------------------------------------|
| Comparison type                     | String-based fuzzy hash                      | Vector-based semantic embedding                    |
| Paraphrase detection                | ❌ Weak                                       | ✅ Excellent                                       |
| Identical text detection            | ✅ Good                                       | ✅ Good                                            |
| Comparison speed (single match)     | ✅ Fast                                       | ❌ Slower (cosine similarity over vectors)         |
| Scalability (thousands of articles) | ❌ Poor, linear search                        | ✅ Scales well using FAISS / pgvector / Annoy      |
| Database compatibility              | ✅ Easily stored as text                     | ✅ Requires vector support (e.g., pgvector)         |
| Storage size per article            | ✅ Very small (1–2 lines of text)            | ❌ Larger (~1.5 kB, 384 × float32)                 |
| Ease of use                         | ✅ Extremely easy                            | ❌ Requires model download and dependencies        |
| Supports semantic search            | ❌ No                                        | ✅ Yes, designed for it                            |
| Best suited for                     | Technical duplicate detection                | Content-level news similarity                     |

## Example RSS Feed

https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET
