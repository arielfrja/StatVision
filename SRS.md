#### 1.3 Definitions, Acronyms, and Abbreviations
*   **AI:** Artificial Intelligence
*   **API:** Application Programming Interface
*   **GCS:** Google Cloud Storage
*   **JWT:** JSON Web Token
*   **ORM:** Object-Relational Mapper
*   **PBP:** Play-by-Play
*   **SRS:** Software Requirements Specification
*   **SQL:** Structured Query Language

---

### 2. Overall Description

#### 2.1 Product Perspective
StatVision is a cloud-native web application composed of several decoupled services. It is a self-contained system that relies on the following managed services:
*   **Authentication:** Auth0 (generous free tier available), configured as a modular authentication provider.
*   **Database:** A PostgreSQL instance, which can be self-hosted (e.g., on a local machine or a free-tier VM) or use managed services with free tiers (e.g., Supabase, ElephantSQL).
*   **Temporary File Storage:** The API Service will temporarily store video files during the analysis workflow.
*   **AI Service:** An external video intelligence API (e.g., Gemini) (generous free tier available).

#### 2.2 Product Functions
*   **User Management:** Handles user registration and login.
*   **Data Management:** Provides CRUD functionality for teams and players.
*   **Video Upload:** Facilitates secure uploads of large video files.
*   **Automated Analysis:** Processes videos in the background to generate game event data.
*   **Data Assignment:** Allows users to map AI-identified data to their rosters.
*   **Interactive Analysis & Archival:** Presents data interactively and stores it for future review.

#### 2.3 User Characteristics
Primary users are coaches, players, and analysts who are computer-literate but not necessarily technical experts.

#### 2.4 Constraints
*   **C-1:** The application must be a web-based platform for desktop browsers.
*   **C-2:** The backend architecture must be modular and service-oriented. The business logic must be decoupled from the data access layer.
*   **C-3:** User data must be strictly isolated at the database level.
*   **C-4:** The UI must clearly communicate the status of long-running, asynchronous tasks.

---

### 3. Specific Requirements

#### 3.1 Functional Requirements

##### Module 1: User Account Management
*   **FR-101: User Registration/Login:** The system shall use Auth0 (generous free tier available) for user registration and login. After successful Auth0 registration/login, the frontend will call the backend API to create the user record in PostgreSQL. (Note: This approach is used for low-budget/free tiers. A webhook or server-side rule is a better approach for higher budgets.)

##### Module 2: Team and Player Management
*   **FR-201: CRUD for Teams & Players:** The system shall provide full Create, Read, Update, and Delete functionality for a user's teams and players.

##### Module 3: Game Analysis Workflow
*   **FR-301: Video Upload:** The user shall upload video files to the API Service, which will temporarily store them for processing.
*   **FR-302: Asynchronous Processing:** A successful upload shall trigger an asynchronous background process to analyze the video.
*   **FR-303: AI Video Analysis:** The background process shall call the external AI service and persist the results as `GameEvent` records in the PostgreSQL database.

##### Module 4: Data Assignment
*   **FR-401: Assignment UI:** A dedicated interface shall allow users to assign AI-identified teams and players to their official rosters.
*   **FR-402: Automatic Player Matching:** The system shall attempt to auto-assign players based on jersey numbers stored in the database.

##### Module 5: Analysis and Visualization
*   **FR-501: Dashboard View:** The dashboard shall list all user games and their status from the database.
*   **FR-502: Interactive Playback:** Every event in the analysis view must be linked to its corresponding video clip.
*   **FR-503: Accessing Past Games:** Users must be able to access any previously completed game analysis from their dashboard at any time.