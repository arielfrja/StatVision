# Technical Task Breakdown - StatVision (MVP)

### [EPIC] Project Foundation & DevOps
- [x] **[DEVOPS-01]** Configure Auth0 (Auth).
- [ ] **[DEVOPS-02]** Provision a managed PostgreSQL instance and configure access rules.
- [ ] **[DEVOPS-03]** Configure a Google Cloud Storage bucket with appropriate permissions. (Future: For video archival and interactive playback).
- [ ] **[DEVOPS-04]** Set up a Pub/Sub topic for upload events. (Future: For decoupling API and Worker services).
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
    - [x] **[BE-201]** Create `teams` and `players` table schemas and migrations.
    - [x] **[BE-202]** Implement the Service and Repository layers for `Teams`.
    - [x] **[BE-203]** Implement the Service and Repository layers for `Players`.
    - [x] **[BE-204]** Create the API endpoints (`GET /teams`, `POST /teams`, `POST /teams/{id}/players`).
    - [x] **[FE-201]** Build the "My Teams" page UI with its two-column layout.
    - [x] **[FE-202]** Implement the client-side logic to fetch, display, and create teams and players by calling the API.

### [EPIC] Core Analysis Pipeline (Local MVP)
- [ ] **[STORY]** As an Analyst, I want to upload a video to have it analyzed by the AI.
    - [x] **[BE-301]** Create `games` and `game_events` table schemas and migrations.
    - [ ] **[BE-302]** Implement the API endpoint `POST /games/upload` to handle direct video upload to the local server filesystem.
    - [ ] **[BE-303]** Implement the **Local Video Processor Service** (In-Process Worker) with a clear interface, responsible for video processing, chunking, calling the Gemini API, and parsing the response. (Designed for easy migration to a separate Worker Service later).
    - [ ] **[BE-304]** Implement the Repository layer for `GameEvents` to allow for batch insertion of parsed data into PostgreSQL.
    - [x] **[BE-305]** Implement the logic to update the game status in the database at each stage of the process.
    - [ ] **[FE-301]** Build the "Analyze New Game" UI component with a standard file upload form.
    - [ ] **[FE-302]** Implement the client-side logic to perform the direct upload to the API endpoint.

### [EPIC] Assignment & Visualization
- [ ] **[STORY]** As an Analyst, I want to assign AI data to my rosters so the stats are meaningful.
    - [ ] **[BE-401]** Implement the API endpoint `POST /games/{id}/assignment`.
    - [ ] **[BE-402]** Implement the business logic in `GameService` to handle the assignment, including the automatic player matching.
    - [ ] **[FE-401]** Build the "Assignment Screen" UI.
    - [ ] **[FE-402]** Implement the logic to fetch game data, populate dropdowns, and submit the final assignments to the API.
- [ ] **[STORY]** As an Analyst, I want to view the final analysis with interactive video.
    - [x] **[BE-500]** Implement the API endpoint `GET /games` that returns a list of all games for the authenticated user.
    - [x] **[BE-500.1]** Enhance `GET /games` to include `assignedTeamA` and `assignedTeamB` names for the dashboard view.
    - [x] **[FE-500]** Build the "Game Management Dashboard" UI to list all games and their current status.
    - [x] **[BE-501]** Implement the API endpoint `GET /games/{id}` that returns all game details and its associated events.
    - [x] **[FE-501]** Build the "Analysis Screen" UI with its multi-panel layout.
    - [ ] **[FE-502]** Implement the `VideoPlayer` component with methods to control playback.
    - [ ] **[FE-503]** Implement the `PlayByPlayFeed` component, including the logic for making rows clickable and triggering the video player.
    - [ ] **[FE-504]** Implement the `BoxScoreTable` component.
