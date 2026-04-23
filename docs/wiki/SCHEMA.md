# Wiki Schema

## Identity
- **Path:** /data/data/com.termux/files/home/data/development/StatVision/docs/wiki
- **Domain:** AI-powered basketball analytics platform (StatVision)
- **Source types:** Code files, architectural plans, documentation
- **Created:** 2026-04-22

## Page Frontmatter
Every wiki page must start with:
---
title: <page title>
tags: [tag1, tag2]
sources: [source-slug1]
updated: YYYY-MM-DD
---

## Cross-References
Use `[[slug]]` where slug = filename without `.md`.
Example: `[[transformer-architecture]]` → `wiki/pages/transformer-architecture.md`

## Log Entry Format
## [YYYY-MM-DD] <operation> | <title>
Operations: init, ingest, query, update, lint

## Index Categories
Modules
APIs
Decisions
Flows

## Conventions
- raw/ is immutable — skills never modify it
- log.md is append-only — never rewritten, only appended
- index.md is updated on every operation that adds or changes pages
- All pages live flat in wiki/pages/ — no subdirectories
- overview.md reflects the current synthesis across all sources
