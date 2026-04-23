---
title: Overview
tags: [overview, synthesis]
sources: []
updated: 2026-04-22
---

# StatVision — Overview

> Evolving synthesis of everything in the wiki. Updated by wiki-ingest when sources shift the understanding.

## Current Understanding

StatVision is an AI-powered basketball analytics platform featuring a decoupled, event-driven architecture.

### Architectural Boundaries
1. **Frontend (Next.js):** Manages user interactions, video uploads, and visualization of analytics using a `[[timeline-first-ux]]`.
2. **Backend API (Express):** Serves as the system's brain, handling metadata management, `[[auth0-strategy]]`, and orchestrating background jobs via `[[pubsub-event-bus]]`.
3. **Video Processing Worker (Node.js):** A standalone service dedicated to resource-intensive tasks like `[[video-chunker-service]]` (FFmpeg) and `[[ai-analysis-strategy]]` (Google Gemini).

## Design Pillars

- **Decoupled Workflow:** Asynchronous `[[video-processing-pipeline]]` allows for horizontal scaling and API responsiveness.
- **Data Integrity:** Implements `[[authoritative-window-deduplication]]` to handle overlapping video segments without duplicate events.
- **Statistical Flexibility:** The `[[statistical-flexibility-constraint]]` ensures the system remains robust even with sparse or noisy AI data.
- **Materialized Results:** Aggregates granular events into persistent `GameTeamStats` and `GamePlayerStats` for fast reporting.

## Key Entities / Concepts

- **Game:** The central entity representing a match.
- **VideoAnalysisJob:** Tracks the processing status of a video.
- **GameEvent:** Granular events (shots, rebounds) extracted by AI.
- **Authoritative Window:** The mechanism for stateless deduplication.

## Future Vision

StatVision aims to provide professional-grade analytics for the amateur experience, including features like "Ghost Scoreboards", highlight generation, and "Park Legends" leaderboards. See the `[[strategic-roadmap]]` for more details.
