---
title: Game Event Entity
tags: [backend, entity, typeorm]
sources: [backend/src/core/entities/GameEvent.ts]
updated: 2026-04-22
---

# Game Event Entity

Represents a single basketball action (e.g., shot, rebound, foul) identified during video analysis.

## Key Fields
- `eventType`: The primary action type.
- `status`: `DRAFT` (raw AI result) or `OFFICIAL` (user-validated).
- `absoluteTimestamp`: The exact time in the game when the event occurred.
- `assignedTeamId` / `assignedPlayerId`: Links the event to specific entities.
- `xCoord` / `yCoord`: Spatial coordinates on the court.
- `isSuccessful`: Success flag (e.g., shot made vs missed).

## Persistence
Events are initially persisted as `DRAFT` by `[[video-analysis-result-service]]` and later converted to `OFFICIAL` (or updated) by the user during the assignment phase.
