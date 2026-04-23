---
title: Chunk Processor Worker
tags: [worker, ai, video-analysis]
sources: [backend/src/worker/ChunkProcessorWorker.ts]
updated: 2026-04-22
---

# Chunk Processor Worker

The core execution engine for analyzing individual video segments in the `[[video-processing-pipeline]]`.

## Responsibilities
- Subscribes to `chunk-analysis` messages.
- Coordinates with `[[gemini-analysis-service]]` to get structured AI results.
- Uses `[[event-processor-service]]` to refine, deduplicate, and map AI events to the database.
- Implements `[[authoritative-window-deduplication]]` logic.
- Maintains **Context Continuity**: Passes identified players and teams from previous chunks to maintain identity stability.
- Triggers `[[job-finalizer-service]]` after each chunk is processed.

## Concurrency Control
- In **SEQUENTIAL** mode, it waits for the previous chunk (by sequence number) to be `COMPLETED` before starting the next one.
- In **PARALLEL** mode, it uses a `parallelStageLimit` to prevent overwhelming the AI provider.
