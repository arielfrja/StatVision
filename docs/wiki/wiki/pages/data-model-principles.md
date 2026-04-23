---
title: Data Model Principles
tags: [concept, backend, data-architecture]
sources: [SAD.md, SDD.md, SRS.md]
updated: 2026-04-22
---

# Data Model Principles

The StatVision data architecture is built on three core pillars:

## 1. Materialized Statistics
Raw `[[game-event-entity]]` records are processed to calculate aggregates (Points, Rebounds, etc.). These are stored in dedicated materialized tables:
- `GameTeamStats`: Aggregated stats for the team per game.
- `GamePlayerStats`: Individual performance metrics.
**Benefit:** Fast query performance for dashboards and leaderboards without re-scanning thousands of events.

## 2. Statistical Flexibility
The system calculates only what it can based on available data.
- Derived metrics like `trueShootingPercentage` default to 0 if relevant events (Field Goals) are missing.
- This ensures the UI remains stable even with sparse AI detections.

## 3. Roster History & M:N Relations
Player identities are decoupled from teams to support complex league structures.
- **PlayerTeamHistory:** A junction table that tracks which player wore which jersey number for which team during a specific period.
- This allows a player to change teams or jersey numbers across seasons while maintaining a consistent historical record.

## 4. DRAFT vs OFFICIAL Lifecycle
Events identified by AI are marked as `status = DRAFT`. Only after a user confirms or edits the data does it become part of the `OFFICIAL` box score (or the system recalculates stats including the draft events for immediate feedback).
