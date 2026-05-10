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
The backend will be composed of two main services deployed as separate serverless containers (e.g., Google Cloud Run).

1.  **API Service (e.g., Node.js/Express with TypeORM):**
    *   **Responsibility:** Handles all synchronous HTTP requests from the frontend, including creating user records in PostgreSQL after Auth0 registration.
    *   **Flow:** Receives a request (e.g., user creation, or other API calls) -> Verifies Auth0 JWT (using a modular authentication provider) -> Calls the Service Layer -> The Service Layer uses the injected Repository to interact with PostgreSQL -> Returns a response.

2.  **Local Video Processor Service (In-Process Worker):**
    *   **Responsibility:** Executes the long-running video analysis task. This component is designed with a clear interface (Service/Repository pattern) to facilitate its extraction into a separate **Worker Service** when scaling is required.
    *   **Trigger:** Directly called by the API Service after a successful video upload.
    *   **Flow:** Called by API Service (with local video path) -> Calls `GameService` to update status -> Accesses local video -> Calls Gemini API -> Uses `GameEventRepository` to save results to PostgreSQL -> Updates game status -> **Deletes local video file (MVP Scope)**.

    **Statistical Flexibility Constraint:** The `GameStatsService` must be robust against sparse event data. It will calculate only the metrics possible based on the available events, defaulting uncalculated advanced metrics to zero or null. This ensures the system supports minimal statistical capture (e.g., Points only) without requiring a full pro-level data set.