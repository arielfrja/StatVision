# Technical Task Breakdown - StatVision (MVP)

### [EPIC] Project Foundation & DevOps
- [ ] **[DEVOPS-01]** Configure Auth0 (Auth).
- [ ] **[DEVOPS-02]** Provision a managed PostgreSQL instance and configure access rules.
- [ ] **[DEVOPS-03]** Configure a Google Cloud Storage bucket with appropriate permissions.
- [ ] **[DEVOPS-04]** Set up a Pub/Sub topic for upload events.
- [ ] **[DEVOPS-05]** Configure CI/CD pipeline for deploying the Next.js frontend to Vercel.
- [ ] **[DEVOPS-06]** Configure CI/CD pipeline for building and deploying the backend services (API, Worker) as containers to Google Cloud Run.

### [EPIC] User Authentication
- [ ] **[STORY]** As a new user, I want to register for an account so I can use the service.
    - [ ] **[BE-101]** Create the `users` table schema and migration in PostgreSQL (using `provider_uid`).
    - [ ] **[BE-102]** Implement an API endpoint to create a new user record in PostgreSQL, to be called by the frontend after a new user signs up via Auth0. (Note: This approach is used for low-budget/free tiers. A webhook or server-side rule is a better approach for higher budgets.)
    - [ ] **[FE-101]** Create the Register page UI component in Next.js.
    - [ ] **[FE-102]** Integrate the Auth0 SDK for user registration.
    - [ ] **[FE-102.1]** After successful Auth0 registration, call the backend API to create the user record in PostgreSQL.
- [ ] **[STORY]** As a returning user, I want to log in to access my data.
    - [ ] **[BE-103]** Implement API middleware to validate the Auth0 JWT on incoming requests and attach user info to the request object (using a modular authentication provider).
    - [ ] **[FE-103]** Create the Login page UI component.
    - [ ] **[FE-104]** Integrate the Auth0 SDK for login and token management.
    - [ ] **[FE-105]** Implement global state management (e.g., in a React Context) to track auth status across the app.

### [EPIC] Core Data Management
- [ ] **[STORY]** As an Analyst, I want to manage my teams and players so I can use them in game assignments.
    - [ ] **[BE-201]** Create `teams` and `players` table schemas and migrations.
    - [ ] **[BE-202]** Implement the Service and Repository layers for `Teams`.
    - [ ] **[BE-203]** Implement the Service and Repository layers for `Players`.
    - [ ] **[BE-204]** Create the API endpoints (`GET /teams`, `POST /teams`, `POST /teams/{id}/players`).
    - [ ] **[FE-201]** Build the "My Teams" page UI with its two-column layout.
    - [ ] **[FE-202]** Implement the client-side logic to fetch, display, and create teams and players by calling the API.

### [EPIC] Core Analysis Pipeline
- [ ] **[STORY]** As an Analyst, I want to upload a video to have it analyzed by the AI.
    - [ ] **[BE-301]** Create `games` and `game_events` table schemas and migrations.
    - [ ] **[BE-302]** Implement the API endpoint `POST /games/initiate-upload` that generates and returns a signed GCS URL.
    - [ ] **[BE-303]** Implement the Worker Service trigger (Pub/Sub subscription).
    - [ ] **[BE-304]** Implement the core video processing logic in the Worker: download from GCS, chunking, calling the Gemini API, and parsing the response.
    - [ ] **[BE-305]** Implement the Repository layer for `GameEvents` to allow for batch insertion of parsed data into PostgreSQL.
    - [ ] **[BE-306]** Implement the logic to update the game status in the database at each stage of the process.
    - [ ] **[FE-301]** Build the "Analyze New Game" UI component.
    - [ ] **[FE-302]** Implement the client-side logic to get the signed URL and perform the direct upload to GCS.

### [EPIC] Assignment & Visualization
- [ ] **[STORY]** As an Analyst, I want to assign AI data to my rosters so the stats are meaningful.
    - [ ] **[BE-401]** Implement the API endpoint `POST /games/{id}/assignment`.
    - [ ] **[BE-402]** Implement the business logic in `GameService` to handle the assignment, including the automatic player matching.
    - [ ] **[FE-401]** Build the "Assignment Screen" UI.
    - [ ] **[FE-402]** Implement the logic to fetch game data, populate dropdowns, and submit the final assignments to the API.
- [ ] **[STORY]** As an Analyst, I want to view the final analysis with interactive video.
    - [ ] **[BE-501]** Implement the API endpoint `GET /games/{id}` that returns all game details and its associated events.
    - [ ] **[FE-501]** Build the "Analysis Screen" UI with its multi-panel layout.
    - [ ] **[FE-502]** Implement the `VideoPlayer` component with methods to control playback.
    - [ ] **[FE-503]** Implement the `PlayByPlayFeed` component, including the logic for making rows clickable and triggering the video player.
    - [ ] **[FE-504]** Implement the `BoxScoreTable` component.