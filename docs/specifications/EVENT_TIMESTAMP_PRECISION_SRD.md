---
title: Event Timestamp Precision (SRD)
tags: [pipeline, timestamps, accuracy, ux-honesty]
sources: [worker-src, common-src, api-src, frontend-src]
updated: 2026-10-02
status: PROPOSED
---

# SRD: Event Timestamp Precision

## 1. Problem

Every `game_events` row carries `absoluteTimestamp` (float seconds), but it is
**AI-estimated at 1fps granularity** (`ANALYSIS_FPS=1`), not measured:

- Sub-second digits are interpolation, not observation.
- QA caught impossible orderings (rebound logged *before* its shot attempt).
- The UI prints bare `MM:SS`, implying precision the data doesn't have.
- The roadmap's "frame-perfect timeline sync" claim is fiction: no frame
  index is stored, seeking is second-granularity, and `game_clock` is
  optional/unvalidated.

## 2. Objective

Make timestamps **honest, comparable, and improvable**: store what we know
(source fps, derived frame, precision label), display uncertainty, seek with
padding, and flag impossible sequences for review instead of shipping them
silently. No precision theater.

## 3. Requirements

### 3.1 Capture (worker, Phase 1 — no extra AI cost)

- R1. At orchestration, probe source fps via ffprobe; persist per-game
  `sourceFps` on the job row (nullable when unprobable).
- R2. Keep current derivation (`chunk_offset + segment MM:SS`) as
  `absoluteTimestamp`; additionally store `frameIndex =
  round(absoluteTimestamp * sourceFps)` (nullable when fps unknown).
- R3. Every event carries `timePrecision`: `estimated` (default, AI-derived)
  or `verified` (human-confirmed via EventEditor). Backfill existing rows as
  `estimated`.
- R4. Prompt change (no schema): instruct the model to report the visible
  play-clock/scorebug time when present, and to emit events in true
  chronological order within a chunk. Cost-neutral (few tokens).

### 3.2 Validation (worker/API, Phase 1)

- R5. Server-side ordering rules on insert/finalize, violations set
  `needsReview=true` (new nullable flag, default false) rather than dropping:
  - `*REBOUND` requires a preceding `*MISS`/`*ATTEMPT` within 8s same period.
  - `*MADE` requires a same-possession `*ATTEMPT` (±5s).
  - `FREE_THROW_MADE` requires its `ATTEMPT`.
- R6. `/games/:id` detail includes `needsReviewCount`; box score NEVER
  aggregates flagged events into team/player totals without a visible
  "under review" marker (totals stay honest).

### 3.3 Display & Seek (frontend, Phase 1)

- R7. Log renders `~MM:SS` for `estimated`, `MM:SS` for `verified`
  (tilde = honesty marker, with tooltip "AI-estimated ±2s").
- R8. `handleSeek` pads: `seekTo(max(0, t - 2))` and, where the player
  supports it, loops/highlights the `[t-2, t+3]` window instead of a point.
- R9. EventEditor shows raw seconds + derived frame + fps alongside `MM:SS`,
  and offers one-click "Mark verified" (sets `verified`, records reviewer).
- R10. Remove all "frame-perfect"/"exact" copy from UI and docs until R12 lands.

### 3.4 Refinement sampling (Phase 2 — costs tokens, needs product sign-off)

- R11. Optional per-game `precisionMode`: after draft events land, re-sample
  ±6s windows around low-certainty (`eventTypeCertainty < 0.6`) or
  flagged events at full fps for boundary correction. Budgeted per game
  (estimate before running; default OFF).
- R12. `verified`-by-refinement sets `timePrecision=verified`,
  `verifiedBy='refinement'`.

## 4. Database Schema (migration)

```sql
ALTER TABLE game_events
  ADD COLUMN source_fps FLOAT NULL,
  ADD COLUMN frame_index INTEGER NULL,
  ADD COLUMN time_precision VARCHAR(16) NOT NULL DEFAULT 'estimated',
  ADD COLUMN needs_review BOOLEAN NOT NULL DEFAULT FALSE;
-- Backfill: existing rows keep absoluteTimestamp; new columns default as above.
-- No data rewrite required.
```

## 5. Acceptance Criteria

- AC1. 100% of events have non-null `absoluteTimestamp`; 100% carry an
  explicit precision label (no silent defaults in API responses).
- AC2. Seeded impossible sequence (REB before ATTEMPT) → `needsReview=true`,
  excluded from totals with marker, listed in a review queue.
- AC3. Click-to-seek on an `estimated` event starts playback within 3s
  before the labeled moment on the reference clip.
- AC4. Full-pipeline E2E (359MB demo): all 9 chunks land with fps + frame
  populated; zero `undefined`/null timestamps in list, detail, and editor.
- AC5. No UI string claims frame/exact precision unless R11+R12 shipped.

## 6. Non-Goals / Out of Scope

- Broadcast-scorebug OCR as source of truth (unreliable across gyms).
- Sub-second display precision (implies more than we measure).
- Clip export (needs video retention decision first — see retention note).
- Changing `ANALYSIS_FPS` globally (cost explosion; R11 is the scalpel).

## 7. Rollout

1. Migration (nullable/defaulted — zero-downtime) → worker R1–R5 → API
   markers → frontend R7–R10 → copy sweep (R10).
2. Verify on a fresh pipeline run (AC4), then prod deploy.
3. R11/R12 only after product prices the token budget.

## 8. Open Questions for Product

1. Is ±2s + `~` marker acceptable to coaches, or is refinement (R11) a
   launch requirement for the "elite accuracy" story?
2. Who may mark `verified` — any coach, or team admins only?
3. Does the review queue need its own screen, or is a filter on play-by-play enough?
