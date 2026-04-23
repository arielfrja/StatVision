---
title: Gemini Analysis Service
tags: [worker, ai, gemini]
sources: [backend/src/worker/GeminiAnalysisService.ts]
updated: 2026-04-22
---

# Gemini Analysis Service

Wrapper for the Google Gemini API, specifically optimized for multimodal basketball video analysis.

## Responsibilities
- Uploads video chunks to the **Gemini File API**.
- Polls for the `ACTIVE` state of the uploaded file.
- Constructing specialized prompts using `PromptLoader` (System instructions, First chunk vs. Subsequent chunks).
- Requests **Structured Output** using a predefined JSON schema (`EVENT_SCHEMA`).
- Deletes files from the Gemini API after processing to manage storage limits.

## Key Features
- **Multimodal Processing:** Sends both the video file and text instructions.
- **Identity Retention:** Injects known teams and players into the prompt for subsequent chunks to help the model maintain consistency.
- **Retry Logic:** Implements retries for file uploads and content generation.
