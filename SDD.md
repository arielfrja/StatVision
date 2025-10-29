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
*   **Authentication:** The frontend will use the **Auth0 Client SDK** to manage user authentication and retrieve the JWT token for API calls.

### 4. Backend Design

#### 4.1 PostgreSQL Database Schema
*   **`users` table:** `id` (PK), `provider_uid` (UNIQUE), `email` (UNIQUE), `created_at`
*   **`teams` table:** `id` (PK), `user_id` (FK to users), `name`
*   **`players` table:** `id` (PK), `team_id` (FK to teams), `name`, `jersey_number`, `UNIQUE(team_id, jersey_number)`
*   **`games` table:** `id` (PK), `user_id` (FK to users), `status`, `video_url`, `assigned_team_a_id` (FK to teams), `assigned_team_b_id` (FK to teams), `uploaded_at`
*   **`game_events` table:** `id` (PK), `game_id` (FK to games), `assigned_team_id` (FK to teams), `assigned_player_id` (FK to players), `identified_team_color`, `identified_jersey_number`, `event_type`, `event_details` (JSONB), `absolute_timestamp`, `video_clip_start_time`, `video_clip_end_time`

#### 4.2 Backend Services & Logic
The backend will be composed of two main services deployed as separate serverless containers (e.g., Google Cloud Run).

1.  **API Service (e.g., Node.js/Express with TypeORM):**
    *   **Responsibility:** Handles all synchronous HTTP requests from the frontend, including creating user records in PostgreSQL after Auth0 registration.
    *   **Flow:** Receives a request (e.g., user creation, or other API calls) -> Verifies Auth0 JWT (using a modular authentication provider) -> Calls the Service Layer -> The Service Layer uses the injected Repository to interact with PostgreSQL -> Returns a response.

2.  **Local Video Processor Service (In-Process Worker):**
    *   **Responsibility:** Executes the long-running video analysis task. This component is designed with a clear interface (Service/Repository pattern) to facilitate its extraction into a separate **Worker Service** when scaling is required.
    *   **Trigger:** Directly called by the API Service after a successful video upload.
    *   **Flow:** Called by API Service (with local video path) -> Calls `GameService` to update status -> Accesses local video -> Calls Gemini API -> Uses `GameEventRepository` to save results to PostgreSQL -> Updates game status -> **Deletes local video file (MVP Scope)**.