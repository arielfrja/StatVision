---
title: Video Analysis Result Service
tags: [backend, consumer, data-persistence]
sources: [backend/src/service/VideoAnalysisResultService.ts]
updated: 2026-04-22
---

# Video Analysis Result Service

A backend service that consumes analysis results from the worker and updates the main application state.

## Responsibilities
- Subscribes to both `video-analysis-results` (Final) and `chunk-analysis-results` (Live Stream) topics.
- **Live Streaming:** Updates the database with "DRAFT" events as they arrive from the worker, enabling real-time UI updates.
- **Entity Persistence:** Converts temporary AI identities into `Team` and `Player` entities in the database (marked as `isTemp`).
- **Game Status Management:** Updates the `[[game-entity]]` status (e.g., to `ANALYZED`).
- **Stats Recalculation:** Triggers `[[game-stats-service]]` to update box scores after a job completes.

## Event Consumption
Uses `[[pubsub-event-bus]]` to listen for messages emitted by the worker's `[[job-finalizer-service]]` and `[[chunk-processor-worker]]`.
