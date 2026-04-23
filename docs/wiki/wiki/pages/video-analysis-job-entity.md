---
title: Video Analysis Job Entity
tags: [backend, entity, typeorm, worker]
sources: [backend/src/core/entities/VideoAnalysisJob.ts]
updated: 2026-04-22
---

# Video Analysis Job Entity

Tracks the internal state and progress of the background processing pipeline for a specific game video.

## Key Fields
- `status`: Lifecycle state (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
- `chunks`: Collection of `Chunk` entities associated with this job.
- `chatHistory`: JSON blob storing the conversational context passed to/from the Gemini API to maintain continuity.
- `retryCount`: Number of times the job has been attempted.
- `failureReason`: Detailed error message if the job fails.

## Purpose
Decouples the long-running analysis process from the `[[game-entity]]`. It allows for detailed progress tracking and state recovery if the worker service restarts.
