# StatVision — AI Brain

## Project Intent
StatVision is an end-to-end basketball analytics platform. It uses Google Gemini 1.5 Pro/Flash to extract structured data from game videos and materializes them into box scores and advanced metrics.

## Architecture Map
- **Frontend:** Next.js (App Router).
- **Backend API:** Node.js/Express, TypeORM (PostgreSQL).
- **Worker:** Node.js, FFmpeg, Google Gemini API, Pub/Sub.
- **Communication:** Event-driven via Google Cloud Pub/Sub.

## Key Services
- `[[video-orchestrator-service]]`: Chunks videos with 5s overlap.
- `[[chunk-processor-worker]]`: Orchestrates AI analysis per chunk.
- `[[gemini-analysis-service]]`: Direct Gemini API integration.
- `[[event-processor-service]]`: Implements `[[authoritative-window-deduplication]]`.
- `[[job-finalizer-service]]`: Aggregates chunk results.
- `[[video-analysis-result-service]]`: Backend consumer for live and final results.
- `[[game-stats-service]]`: Calculates box scores.

## Data Entities
- `[[game-entity]]`: Metadata and processing state.
- `[[game-event-entity]]`: Action-level records (Shots, Rebounds).
- `[[video-analysis-job-entity]]`: Pipeline state management.

## Critical Concepts
- **Authoritative Window:** Deduplication logic for overlapping chunks.
- **Context Continuity:** Passing identified players/teams between AI calls.
- **DRAFT vs OFFICIAL:** Event status lifecycle.

## Tech Stack
- **Language:** TypeScript
- **Database:** PostgreSQL (TypeORM)
- **AI:** Google Gemini (google-genai)
- **Messaging:** Google Cloud Pub/Sub
- **Video:** FFmpeg
- **Auth:** Auth0
