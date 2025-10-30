# StatVision Data Model Summary

Our current data models are designed with a normalized structure, separating core entities from raw event data and materialized statistics. **These models define the data structure used across both the backend API and the frontend application.**

## Key Entities and Relationships

| Entity | Purpose | Key Relationships | Key Fields |
| :--- | :--- | :--- | :--- |
| **User** | Authentication/Ownership | — | `providerUid` (Auth0 ID) |
| **Team** | Team Management | `User` (Owner) | `name`, `userId` |
| **Player** | Player Roster | `Team` | `name`, `jerseyNumber`, `teamId` |
| **Game** | Analysis Session | `User` (Owner), `Team` (Assigned A/B) | `status` (Enum), `videoUrl` |
| **GameEvent** | Raw Event Data | `Game`, `Team`, `Player` (Optional) | `eventType`, `absoluteTimestamp`, `eventDetails` (JSONB) |
| **GameTeamStats** | Materialized Box Score | `Game`, `Team` | `points`, `rebounds`, `assists` |
| **GamePlayerStats** | Materialized Player Stats | `Game`, `Player` | `points`, `rebounds`, `assists` |

## Architectural Detail

The system uses **materialized statistics** (`GameTeamStats`, `GamePlayerStats`). This means raw events are processed once, and the results (like total points, rebounds) are stored in these separate tables for fast retrieval and reporting, rather than calculating them on every request.

## Design Constraint: Statistical Flexibility

The system is designed to support all levels of basketball, from casual to professional. Therefore, the statistical pipeline adheres to the following principle:

**Statistical Detail is Optional:** Not all statistical fields are required for every game. The system must be robust against sparse data.

*   **Input Flexibility:** The system must gracefully handle GameEvents that only contain minimal data (e.g., only Shots, no Fouls or Steals).
*   **Calculation Robustness:** The `GameStatsService` will calculate only the metrics possible based on the available event data, defaulting uncalculated advanced metrics (like `TS%` or `blocks`) to zero or null.
*   **Reporting Gracefulness:** Frontend and API responses must be designed to handle and display these zero/null values without error, ensuring the system remains functional even when only basic stats are available.