# Software Architecture Document (SAD) - StatVision

### 1. Architectural Vision & Style
The StatVision platform is designed as a **decoupled, service-oriented system**. The primary communication between the long-running analysis process and the main application will be **event-driven**, using a message queue. This approach was chosen to meet the core requirements of **Modularity, Scalability, and Resilience**.

### 2. High-Level Architectural Diagram
```
+------------------+ +---------------------+ +------------------------+
| |----->| Auth0 |<-----| |
| Frontend App | | (Managed Service) | | API Service |
| (Next.js) | +---------------------+ | (e.g., Node.js/Express)| 
| (User's Browser) | | (Synchronous Logic) |
+--------+---------+ +---------------------+ +----------+-------------+
| (3) | API Service         | (5) | (4)
| Upload | (Temporary Storage) |<------------------+ Handle Upload
| Video +----------+----------+ |
+------------------------->| |
| (6) Upload Event      |
v v (7) DB Ops
+---------------------+ +------------------------+
| Message Queue | | |
| (e.g., Pub/Sub) |--------->| PostgreSQL Database |
+---------+-----------+ (8) | (Managed Service) |
| +----------+-------------+
| New Job ^
v | (10) Write Results
+---------------------+ |
| Worker Service |-------------------+
| (e.g., Cloud Run) |
| (Asynchronous Logic)|
+---------+-----------+
|
| (9) Call AI
v
+---------------------+
| Gemini AI API |
| (External Service) |
+---------------------+
```
### 3. Component Breakdown and Responsibilities

#### 3.1 Frontend Application (The Client)
*   **Technology:** Next.js (React)
*   **Responsibility:** Renders the UI, manages client-side state, and communicates with backend services.
*   **Interactions:** Authenticates users via the **Auth0 Client SDK**. Makes authenticated API calls to the **API Service** using an Auth0 JWT. Uploads files to the **API Service**, which temporarily stores them.

#### 3.2 API Service (The Synchronous Backend)
*   **Technology:** Any backend framework (e.g., Node.js/Express, .NET, Go). Deployed as a serverless container on platforms with generous free tiers (e.g., Google Cloud Run, Render, Vercel for serverless functions).
*   **Responsibility:** Handles all fast, synchronous user requests (CRUD operations, temporary video uploads). It **never** performs long-running tasks. It uses a **modular authentication provider** to verify JWTs.
*   **Interactions:** Verifies Auth0 JWTs. Communicates with the **PostgreSQL Database** for data operations. Publishes messages to the **Message Queue** to trigger background work, including the path to the temporarily stored video.

#### 3.3 Worker Service (The Asynchronous Backend)
*   **Technology:** Containerized application (e.g., using Docker) deployed on a service with a generous free tier like Google Cloud Run.
*   **Responsibility:** Performs the heavy, long-running task of video analysis.
*   **Interactions:** Subscribes to the **Message Queue**. When a job is received, it accesses the temporarily stored video (path provided in the message queue), calls the external **Gemini AI API**, writes the results to the **PostgreSQL Database**, and then deletes the temporary video file.

#### 3.4 Managed & External Services
*   **Auth0:** Manages user identity (generous free tier available). Configured as a modular authentication provider.
*   **PostgreSQL Database:** The single source of truth for all structured application data. Can be self-hosted (e.g., on a local machine or a free-tier VM) or use managed services with free tiers (e.g., Supabase, ElephantSQL).
*   **Message Queue (e.g., Google Pub/Sub):** Decouples the API Service from the Worker Service (generous free tier available).
*   **Gemini AI API:** An external AI service for video analysis (generous free tier available).