# StatVision — AI Brain

## Project Intent
StatVision is an end-to-end basketball analytics platform. It uses Google Gemini 2.5 Flash to extract structured data from game videos and materializes them into box scores and advanced metrics.

## Architecture Map (Monorepo)
- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4.
- **Backend API (`/api`):** Node.js/Express, TypeORM (PostgreSQL).
- **Worker (`/worker`):** Node.js, FFmpeg, Google Gemini API, Pub/Sub.
- **Shared Library (`/common`):** Centralized Repositories, Services, and Entities.
- **Communication:** Event-driven via Google Cloud Pub/Sub.

## Key Services (Consolidated in @statvision/common)
- `[[video-orchestrator-service]]`: Chunks videos with 10s overlap.
- `[[chunk-processor-worker]]`: Orchestrates AI analysis per chunk.
- `[[gemini-provider]]`: Unified Gemini API integration for chat-mode analysis.
- `[[event-processor-service]]`: Implements `[[authoritative-window-deduplication]]`.
- `[[job-finalizer-service]]`: Aggregates chunk results.
- `[[video-analysis-result-service]]`: Backend consumer for live and final results.
- `[[game-stats-service]]`: Calculates box scores and team metrics.

## Data Entities
- `[[game-entity]]`: Metadata, processing state, and rulesets.
- `[[game-event-entity]]`: Action-level records (Shots, Rebounds).
- `[[player-entity]]`: Individual athlete profiles.
- `[[player-team-history-entity]]`: M:N junction table for temporal roster assignments.
- `[[team-entity]]`: Organization metadata.

## Critical Concepts
- **Authoritative Window:** Deduplication logic for overlapping chunks (10s buffer).
- **Context Continuity:** Multi-turn chat passing identified entities between AI calls.
- **DRAFT vs OFFICIAL:** Event status lifecycle.
- **Monorepo Source of Truth**: All business logic and DB repositories live in `@statvision/common`.

## Cloud Infrastructure
- **Project:** `statsvision-477017` (GCP).
- **Registry:** Google Artifact Registry (`statvision-repo`).
- **Services:** Cloud Run (API, Worker).
- **Staging:** Isolated `-test` suffix for Pub/Sub topics, subscriptions, and Cloud Run services.
- **Frontend:** Vercel (Production + Preview/Staging).

## Tech Stack
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 18.2 (Local & Supabase)
- **AI:** Google Gemini 2.5 Flash (google-genai)
- **Messaging:** Google Cloud Pub/Sub
- **Video:** FFmpeg 8+
- **Auth:** Auth0 (Production) / Mock Auth (Development)
