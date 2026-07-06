# Software Design Document (SDD)
## Project: "StatVision"

**Version:** 1.2
**Date:** October 18, 2025

---

### 1. Introduction
This document provides a detailed design of the StatVision platform, focusing on a modular architecture using Next.js, a PostgreSQL database (can be self-hosted or use free-tier managed services), and serverless Google Cloud services (many with generous free tiers).

### 2. Architectural Design Patterns
To achieve modularity, the backend will be built using a combination of established design patterns:

*   **Service Layer Pattern:** Business logic is encapsulated within "Service" classes (e.g., `GameService`).
*   **Repository Pattern:** A "Repository" interface (e.g., `IGameRepository`) defines data access methods, abstracting the database. A concrete implementation (`PostgresGameRepository`) contains the actual SQL queries (using an ORM like TypeORM, which is open-source).
*   **Dependency Injection (DI):** A DI container will be used to inject concrete repositories into the services, decoupling the business logic from the data access layer.

### 3. Frontend Design (Next.js)
*   **Framework:** Next.js with the App Router.
*   **Key Components:** `DashboardPage`, `TeamsPage`, `AssignmentPage`, and `AnalysisPage` (containing `VideoPlayer`, `PlayByPlayFeed`, `BoxScoreTable`).
*   **Navigation:** The application will use a responsive navigation system: a persistent `SideNav` on desktop and a `BottomNav` on mobile, both featuring text and icons.
*   **Authentication:** The frontend will use the **Auth0 Client SDK** to manage user authentication and retrieve the JWT token for API calls.

### 4. Backend Design

#### 4.1 PostgreSQL Database Schema (Advanced)

*   **`users` table:** `id` (PK), `provider_uid` (UNIQUE), `email` (UNIQUE), `created_at`
*   **`teams` table:** `id` (PK), `user_id` (FK to users), `name`
*   **`players` table:** `id` (PK), `name`, `position`, `height`, `weight`, `is_active` (Note: Team relation moved to history table)
*   **`player_team_history` table:** `id` (PK), `player_id` (FK to players), `team_id` (FK to teams), `jersey_number`, `start_date`, `end_date` (Junction table for M:N relationship over time)
*   **`games` table:** `id` (PK), `user_id` (FK to users), `status`, `video_url`, `home_team_id` (FK to teams), `away_team_id` (FK to teams), `game_date`, `location`, `opponent_name`, `quarter_duration`, `uploaded_at`
*   **`game_events` table:** `id` (PK), `game_id` (FK to games), `team_id` (FK to teams), `player_id` (FK to players), `event_type`, `event_sub_type`, `is_successful`, `period`, `time_remaining`, `x_coord`, `y_coord`, `related_event_id`, `on_court_player_ids` (Array), `event_details` (JSONB), `absolute_timestamp`, `video_clip_start_time`, `video_clip_end_time`
*   **`game_team_stats` table:** `id` (PK), `game_id` (FK to games), `team_id` (FK to teams), `points`, `assists`, `offensive_rebounds`, `defensive_rebounds`, `field_goals_made/attempted`, `three_pointers_made/attempted`, `free_throws_made/attempted`, `steals`, `blocks`, `turnovers`, `fouls`, `effective_field_goal_percentage`, `true_shooting_percentage`, `details` (JSONB)
*   **`game_player_stats` table:** `id` (PK), `game_id` (FK to games), `player_id` (FK to players), `minutes_played`, `plus_minus`, (All other detailed stats from `game_team_stats`)

#### 4.2 Backend Services & Logic
The backend is composed of two primary services deployed on **Google Cloud Run**.

1.  **API Service (Node.js/Express):**
    *   **Responsibility:** Primary gateway for CRUD and Auth0 integration.
    *   **Orchestration:** Triggers analysis by creating a **Google Cloud Task**.
    *   **Watchdog:** Monitors worker heartbeats every 5 minutes and auto-fails stale jobs.
    *   **Coach AI:** Provides a `POST /coach-report` endpoint for LLM-powered tactical analysis.

2.  **Worker Service (Node.js Chunker/Processor):**
    *   **Responsibility:** Executes the compute-intensive analysis pipeline.
    *   **Virtual Pipeline:**
        1. **Chunker Phase:** Calculates logical time-offsets (no FFmpeg slicing).
        2. **Analysis Phase:** Single video upload to Gemini; multi-turn sequential processing with 30s DB heartbeats.
        3. **Finalization Phase:** Results aggregation, Box Score computation, and asset purging.

    **Statistical Flexibility:** The `GameStatsService` must be robust against sparse event data. It will calculate only the metrics possible based on the available events, defaulting uncalculated advanced metrics to zero.