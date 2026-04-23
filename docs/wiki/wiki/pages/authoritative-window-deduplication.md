---
title: Authoritative Window Deduplication
tags: [concept, algorithm, video-processing]
sources: [backend/src/worker/EventProcessorService.ts]
updated: 2026-04-22
---

# Authoritative Window Deduplication

A critical algorithm for ensuring data integrity when processing a single video as multiple overlapping segments.

## Problem
To maintain AI context (e.g., tracking a player moving across the frame), video segments must overlap (e.g., 5s of overlap for a 60s chunk). This leads to the same events (a shot at 59s) appearing in two adjacent chunks.

## Solution
Each chunk is assigned an **Authoritative Window** within its duration.
- **Segment Start:** Always 0.
- **Segment End:** `duration - overlap` (except for the last chunk, which is authoritative until the very end).

## Logic
When processing raw events from an AI provider:
1. Calculate the event's timestamp relative to the chunk start.
2. If the timestamp falls within `[0, Segment End)`, it is accepted.
3. Otherwise, it is **discarded**, as it is mathematically guaranteed to fall within the *first* segment of the *next* chunk.

## Benefits
- **Stateless Deduplication:** Chunks can be processed in any order or in parallel without needing to check what other chunks found.
- **Idempotency:** Re-processing a chunk always results in the same set of unique events for that time slice.
