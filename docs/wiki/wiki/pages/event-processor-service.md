---
title: Event Processor Service
tags: [worker, processing, deduplication]
sources: [backend/src/worker/EventProcessorService.ts]
updated: 2026-04-22
---

# Event Processor Service

Transforms raw AI-generated events into structured, deduplicated game events.

## Responsibilities
- **Deterministic ID Generation:** Creates consistent UUIDs for teams and players based on temporary labels (e.g., `TEMP_TEAM_HOME`).
- **Identity Mapping:** Maps AI-assigned temporary IDs to permanent system IDs.
- **Timestamp Conversion:** Normalizes video-relative timestamps into absolute game timestamps.
- **Authoritative Window logic:** Implements `[[authoritative-window-deduplication]]`.

## Authoritative Window logic
To handle overlapping chunks without creating duplicate events:
- Each chunk is only "authoritative" for events that *start* within its unique segment (typically `[0, duration - overlap)`).
- The last chunk is authoritative for its entire duration.
- Events outside the authoritative window are discarded, as they are expected to be captured by adjacent chunks.
