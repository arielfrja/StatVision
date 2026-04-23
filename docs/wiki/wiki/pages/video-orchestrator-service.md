---
title: Video Orchestrator Service
tags: [worker, video-processing, orchestration]
sources: [backend/src/worker/videoProcessorWorker.ts]
updated: 2026-04-22
---

# Video Orchestrator Service

The first stage of the `[[video-processing-pipeline]]`. It manages the initial breakdown of an uploaded video into chunks.

## Responsibilities
- Subscribes to `video-upload-events` via `[[pubsub-event-bus]]`.
- Manages `[[video-analysis-job-entity]]` lifecycle.
- Uses `[[video-chunker-service]]` (FFmpeg) to split videos into segments.
- **Overlapping Chunks:** Implements a sliding window strategy (e.g., 60s chunks with 5s overlap) to ensure continuity for AI analysis.
- Publishes `chunk-analysis` messages for each segment.

## Chunking Logic
The orchestrator calculates the number of chunks based on `chunkDuration` and `overlap` settings. It creates a `Chunk` entity for each segment and publishes it for analysis.

## Processing Modes
- **SEQUENTIAL:** Processes one job and its chunks in order (useful for debugging).
- **PARALLEL:** Processes multiple chunks concurrently (production default).
