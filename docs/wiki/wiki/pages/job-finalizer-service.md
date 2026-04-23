---
title: Job Finalizer Service
tags: [worker, finalization, aggregation]
sources: [backend/src/worker/JobFinalizerService.ts]
updated: 2026-04-22
---

# Job Finalizer Service

The final stage of the `[[video-processing-pipeline]]` within the worker.

## Responsibilities
- Checks the completion status of all chunks for a given `[[video-analysis-job-entity]]`.
- **Merging Data:** Aggregates identified players, teams, and processed events from all completed chunks.
- **Persistence:** Saves the aggregated `[[game-event-entity]]` records to the database.
- **Job Status Update:** Marks the job as `COMPLETED` or `FAILED`.
- **Notification:** Publishes a final result message to `video-analysis-results` via the `[[pubsub-event-bus]]`.
- **Cleanup:** Triggers `[[video-chunker-service]]` to delete temporary chunk files.

## Failure Handling
If any chunk fails, the entire job is typically marked as `FAILED` with a detailed reason aggregated from the failed segments.
