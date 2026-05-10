# Technical Task Breakdown - StatVision (MVP)

### [EPIC] Project Foundation & DevOps
- [x] **[DEVOPS-01]** Configure Auth0 (Auth).
- [ ] **[DEVOPS-02]** Provision a managed PostgreSQL instance and configure access rules.
- [ ] **[DEVOPS-03]** Configure a Google Cloud Storage bucket with appropriate permissions. (Future: For video archival and interactive playback).
- [x] **[DEVOPS-04]** Set up a Pub/Sub topic for upload events. (For decoupling API and Worker services).
- [ ] **[DEVOPS-05]** Configure CI/CD pipeline for deploying the Next.js frontend to Vercel.
- [ ] **[DEVOPS-06]** Configure CI/CD pipeline for building and deploying the backend services (API, Worker) as containers to Google Cloud Run.
- [x] **[DEVOPS-07]** Implement centralized logging for backend services using Winston, capturing request/response details and errors.

### [EPIC] Backend Architecture Refinement
- [x] **[BE-001]** Refactor `app.ts` into modular route files (e.g., `authRoutes.ts`, `teamRoutes.ts`, `playerRoutes.ts`) to improve maintainability and organization.

### [EPIC] User Authentication
- [ ] **[STORY]** As a new user, I want to register for an account so I can use the service.
    - [x] **[BE-101]** Create the `users` table schema and migration in PostgreSQL (using `provider_uid`).
    - [x] **[BE-102]** Implement an API endpoint to create a new user record in PostgreSQL, to be called by the frontend after a new user signs up via Auth0. (Note: This approach is used for low-budget/free tiers. A webhook or server-side rule is a better approach for higher budgets.)
    - [x] **[FE-101]** Create the Register page UI component in Next.js. (Implemented via redirect to Auth0 hosted page on '/')
    - [x] **[FE-102]** Integrate the Auth0 SDK for user registration.
    - [x] **[FE-102.1]** After successful Auth0 registration, call the backend API to create the user record in PostgreSQL.
- [ ] **[STORY]** As a returning user, I want to log in to access my data.
    - [x] **[BE-103]** Implement API middleware to validate the Auth0 JWT on incoming requests and attach user info to the request object (using a modular authentication provider).
    - [x] **[FE-103]** Create the Login page UI component. (Implemented via redirect to Auth0 hosted page on '/')
    - [x] **[FE-104]** Integrate the Auth0 SDK for login and token management.
    - [x] **[FE-105]** Implement global state management (e.g., in a React Context) to track auth status across the app.

### [EPIC] Core Data Management
- [ ] **[STORY]** As an Analyst, I want to manage my teams and players so I can use them in game assignments.
    - [x] **[BE-201]** Create `teams`, `players` (with new metadata: position, height, weight), and the **`player_team_history`** junction table schemas and migrations.
    - [x] **[BE-202]** Implement the Service and Repository layers for `Teams`.
    - [x] **[BE-203]** Implement the Service and Repository layers for `Players`.
    - [x] **[BE-204]** Create the API endpoints (`GET /teams`, `POST /teams`, `POST /teams/{id}/players`).
    - [x] **[FE-201]** Build the "My Teams" page UI with its two-column layout.
    - [x] **[FE-202]** Implement the client-side logic to fetch, display, and create teams and players by calling the API.

### [EPIC] Core Analysis Pipeline (Local MVP)
- [ ] **[STORY]** As an Analyst, I want to upload a video to have it analyzed by the AI.
    - [x] **[BE-301]** Create `games` (with new metadata: date, location, opponent) and `game_events` (with new granular fields: x/y coords, period, time remaining) table schemas and migrations.
    - [x] **[BE-302]** Implement the API endpoint `POST /games/upload` to handle direct video upload to the local server filesystem.
    - [x] **[BE-303]** Implement the **Video Processing Worker Service** (Decoupled Microservice Design) with a clear interface, responsible for consuming video upload events, video processing, chunking (2:30 duration, 30s overlap), calling the Gemini API, parsing the response, and generating chunk metadata (sequence number, timestamp in video, absolute original time).
    - [x] **[BE-304]** Implement the Repository layer for `GameEvents` to allow for batch insertion of parsed data into PostgreSQL.
    - [x] **[BE-305]** Implement the logic to update the game status in the database at each stage of the process.
    - [x] **[BE-305.1]** Implement logic to calculate and store **detailed derived stats** (including shooting splits, turnovers, fouls, and efficiency metrics) in the `game_team_stats` and `game_player_stats` tables after event insertion.
    - [x] **[FE-301]** Build the "Analyze New Game" UI component with a standard file upload form.
    - [x] **[FE-302]** Implement the client-side logic to perform the direct upload to the API endpoint.
    - [x] **[BE-306]** Implement the main backend API logic to publish video upload events to the Pub/Sub topic after a successful video upload.

### [EPIC] Assignment & Visualization
- [ ] **[STORY]** As an Analyst, I want to assign AI data to my rosters so the stats are meaningful.
    - [ ] **[BE-401]** Implement the API endpoint `POST /games/{id}/assignment`.
    - [ ] **[BE-402]** Implement the business logic in `GameService` to handle the assignment, including the automatic player matching.
    - [ ] **[FE-401]** Build the "Assignment Screen" UI.
    - [ ] **[FE-402]** Implement the logic to fetch game data, populate dropdowns, and submit the final assignments to the API.
- [ ] **[STORY]** As an Analyst, I want to customize which stats are displayed so I can focus on the metrics most relevant to my analysis.
    - [ ] **[FE-403]** Design and implement a UI component for selecting desired stats (e.g., a multi-select dropdown or checkboxes).
    - [ ] **[BE-403]** Implement a mechanism to store user-specific stat preferences (e.g., a new table `user_preferences` or a JSONB column in the `users` table).
    - [ ] **[BE-404]** Modify existing API endpoints (e.g., `GET /games/{id}`, `GET /teams/{id}/players`) to filter or prioritize stats based on user preferences.
- [ ] **[STORY]** As an Analyst, I want to view the final analysis with interactive video.
    - [x] **[BE-500]** Implement the API endpoint `GET /games` that returns a list of all games for the authenticated user.
    - [x] **[BE-500.1]** Enhance `GET /games` to include `assignedTeamA` and `assignedTeamB` names for the dashboard view.
    - [x] **[FE-500]** Build the "Game Management Dashboard" UI to list all games and their current status.
    - [x] **[BE-501]** Implement the API endpoint `GET /games/{id}` that returns all game details and its associated events.
    - [x] **[FE-501]** Build the "Analysis Screen" UI with its multi-panel layout.
    - [x] **[FE-502]** Implement the `VideoPlayer` component with methods to control playback.
    - [x] **[FE-503]** Implement the `PlayByPlayFeed` component, including the logic for making rows clickable and triggering the video player.
    - [x] **[FE-504]** Implement the `BoxScoreTable` component.

### [EPIC] Responsive Navigation & Dashboard
- [x] **[FE-601]** Create a new `SideNav.tsx` component for persistent desktop navigation.
- [x] **[FE-602]** Create a new `BottomNav.tsx` component for responsive mobile navigation.
- [x] **[FE-603]** Integrate navigation components into `frontend/src/app/layout.tsx` with responsive logic.
- [x] **[FE-604]** Refactor the home page (`/app/page.tsx`) to serve as the main authenticated Dashboard.
