---
title: Video Processing Pipeline
tags: [concept, architecture, workflow]
sources: []
updated: 2026-04-22
---

# Video Processing Pipeline

The end-to-end automated workflow for transforming raw basketball video into actionable analytics.

## Stages

### 1. Ingestion
- User creates a `[[game-entity]]` and uploads an `.mp4` file via `[[game-routes]]`.
- The file is saved locally, and a `video-upload-events` message is published.

### 2. Orchestration
- `[[video-orchestrator-service]]` receives the message.
- Video is split into overlapping chunks (e.g., 60s segments) via `[[video-chunker-service]]`.
- Analysis messages for each chunk are published.

### 3. AI Analysis
- `[[chunk-processor-worker]]` instances pick up chunk messages.
- `[[gemini-analysis-service]]` sends segments to Google Gemini for event extraction.
- `[[event-processor-service]]` deduplicates events using `[[authoritative-window-deduplication]]`.

### 4. Aggregation
- `[[job-finalizer-service]]` monitors chunk completion.
- Once all chunks are done, it merges results and saves them to the database.
- A final success signal is published.

### 5. Materialization
- `[[video-analysis-result-service]]` updates the `[[game-entity]]` status.
- `[[game-stats-service]]` calculates the final Box Score.
