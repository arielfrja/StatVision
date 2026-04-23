---
title: Game Stats Service
tags: [backend, statistics, aggregation]
sources: [backend/src/service/GameStatsService.ts]
updated: 2026-04-22
---

# Game Stats Service

Responsible for aggregating granular `[[game-event-entity]]` records into materialized team and player statistics (Box Scores).

## Responsibilities
- **Data Aggregation:** Iterates through all events of a game to calculate totals for points, assists, rebounds, etc.
- **Advanced Metrics:** Calculates derived stats like Effective Field Goal Percentage (eFG%) and True Shooting Percentage (TS%).
- **Rule-Based Scoring:** Applies game rules (e.g., `1_AND_2` vs `2_AND_3` point values) to correctly attribute points.
- **Persistence:** Stores results in `GameTeamStats` and `GamePlayerStats` tables.
- **Statistical Flexibility:** Defaults missing data to 0 to handle incomplete or error-prone AI detections gracefully.

## Triggering
This service is typically called by `[[video-analysis-result-service]]` after a processing job completes, or manually after a user re-assigns entities.
