---
title: Statistical Flexibility Constraint
tags: [decision, backend, statistics]
sources: [architecture_plan.md, SAD.md, backend/src/service/GameStatsService.ts]
updated: 2026-04-22
---

# Statistical Flexibility Constraint

A core design principle ensuring that the StatVision analytics pipeline is robust against varying levels of data availability.

## The Decision
The system must be capable of generating a Box Score regardless of how many (or few) events are detected by the AI.

## Rationale
- **AI Reliability:** Generative AI may miss events or produce low-confidence detections. The pipeline should not crash or produce invalid states if a specific stat (like "Blocks") has zero events.
- **Support for All Levels:** Pickup games might only need points tracked, while pro games need full advanced metrics. The system should support both seamlessly.

## Implementation
- **Defaulting:** The `[[game-stats-service]]` initializes all stat categories to 0.
- **Graceful Aggregation:** Derived metrics (like eFG% or TS%) check for zero-divisors (e.g., zero Field Goal attempts) and return 0 instead of NaN or erroring.
- **Materialization:** Stats are materialized into `GameTeamStats` and `GamePlayerStats` entities after each processing run, allowing for fast, reliable reads regardless of the underlying event complexity.
