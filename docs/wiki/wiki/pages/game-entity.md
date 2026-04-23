---
title: Game Entity
tags: [backend, entity, typeorm]
sources: [backend/src/core/entities/Game.ts]
updated: 2026-04-22
---

# Game Entity

The central entity representing a basketball game in StatVision.

## Key Fields
- `status`: Tracks the lifecycle (`PENDING` -> `UPLOADED` -> `PROCESSING` -> `ANALYZED` -> `COMPLETED`).
- `gameType`: Defines court size (`FULL_COURT`, `THREE_X_THREE`, etc.).
- `identityMode`: Strategy for identifying players (`JERSEY_COLORS` vs `INTERACTION_BASED`).
- `visualContext`: User-provided metadata (team colors, player rosters) used to seed AI analysis.
- `filePath`: Local path to the source video.

## Relations
- `user`: The owner of the game record.
- `events`: One-to-many relationship with `[[game-event-entity]]`.
- `teamStats`: Materialized stats for the teams.
- `playerStats`: Materialized stats for the players.
