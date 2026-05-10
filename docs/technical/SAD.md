# Software Architecture Document (SAD) - StatVision

### 1. Architectural Vision & Style
The StatVision platform is designed as a **decoupled, service-oriented system**. The primary communication between the long-running analysis process and the main application will be **event-driven**, using a message queue. This approach was chosen to meet the core requirements of **Modularity, Scalability, and Resilience**.

### 2. High-Level Architectural Diagram (Local MVP)
The Worker Service is currently implemented as an in-process component within the API Service.

```
+------------------+ +---------------------+ +------------------------+
| |----->| Auth0 |<-----| |
| Frontend App | | (Managed Service) | | API Service |
| (Next.js) | +---------------------+ | (Node.js/Express) | 
| (User's Browser) | | (Synchronous Logic) |
+--------+---------+ +---------------------+ +----------+-------------+
| (3) | | (4)
| Upload | | Handle Upload
| Video +------------------------->| |
| | | (5) Trigger Local Processor
| | v
| | +------------------------+
| | | Local Video Processor |
| | | (In-Process Worker) |
| | +----------+-------------+
| | | (6) Call AI | (7) Write Results
| | v v
| | +---------------------+ +------------------------+
| | | Gemini AI API | | PostgreSQL Database |
| | | (External Service) | | (Managed Service) |
| | +---------------------+ +------------------------+
+------------------+
```
### 3. Component Breakdown and Responsibilities

#### 3.1 Frontend Application (The Client)
*   **Technology:** Next.js (React)
*   **Responsibility:** Renders the UI, manages client-side state, and communicates with backend services. The UI employs a responsive navigation pattern (SideNav on desktop, BottomNav on mobile) for core application routing.
*   **Interactions:** Authenticates users via the **Auth0 Client SDK**. Makes authenticated API calls to the **API Service** using an Auth0 JWT. Uploads files directly to the **API Service**.

#### 3.2 API Service (The Backend)
*   **Technology:** Node.js/Express. Deployed as a single serverless container.
*   **Responsibility:** Handles all user requests (CRUD operations, video uploads). It contains the **Local Video Processor Service** as an in-process component. It is designed to be easily split into a separate API and Worker service later.
*   **Interactions:** Verifies Auth0 JWTs. Communicates with the **PostgreSQL Database** for data operations. Upon video upload, it triggers the **Local Video Processor Service** directly.

#### 3.3 Local Video Processor Service (The In-Process Worker)
*   **Technology:** Node.js component running within the API Service process.
*   **Responsibility:** Performs the heavy, long-running task of video analysis. This component is designed with a clear interface (Service/Repository pattern) to facilitate its extraction into a separate **Worker Service** when scaling is required.
*   **Interactions:** Accesses the locally stored video, calls the external **Gemini AI API**, and writes the results to the **PostgreSQL Database**.

#### 3.4 Managed & External Services
*   **Auth0:** Manages user identity (generous free tier available). Configured as a modular authentication provider.
*   **PostgreSQL Database:** The single source of truth for all structured application data.
*   **Gemini AI API:** An external AI service for video analysis (generous free tier available).
*   **Future Video Storage (GCS/S3):** In the MVP, video files are processed locally and deleted. For future versions, a cloud storage solution (e.g., Google Cloud Storage or AWS S3) will be integrated to store video files for archival and interactive playback.

#### 3.5 Data Model Principles

The data architecture is built on two core principles:

1.  **Materialized Statistics (BE-305.1):** Raw event data is processed by the Local Video Processor Service, and the results (Box Scores, Player Stats) are materialized into separate database entities (`GameTeamStats`, `GamePlayerStats`). This ensures fast query performance for reporting and multi-game statistics.
2.  **Statistical Flexibility (New Constraint):** The system is designed to handle varying levels of statistical detail. The data pipeline is robust against sparse event data, calculating only the metrics possible and defaulting others to zero/null. This allows the system to support both minimal (e.g., Points only) and maximal (pro-level) statistical capture without breaking the core architecture.
3.  **Roster Management:** The direct Player-Team relationship has been replaced by a `PlayerTeamHistory` junction table to accurately track player jersey numbers and tenure across multiple teams and seasons.