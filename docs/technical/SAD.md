# Software Architecture Document (SAD) - StatVision

### 1. Architectural Vision & Style
StatVision is a **distributed, event-driven platform** optimized for high-throughput video processing and stateful AI analysis. The system is built on a monorepo structure with decoupled services communicating via **Google Cloud Pub/Sub** and **Google Cloud Tasks**.

### 2. High-Level Architectural Diagram (Production)
The system leverages serverless orchestration to handle long-running computer vision tasks without blocking the main API.

```
+------------------+      +---------------------+      +------------------------+
|   Frontend App   |----->|        Auth0        |<-----|      API Service       |
|    (Next.js)     |      |  (Managed Service)  |      |   (Cloud Run - Prod)   |
+--------+---------+      +---------------------+      +----------+-------------+
         |                                                        |
         | (1) Upload Video (Resumable)                           | (2) Confirm Ingestion
         v                                                        v
+------------------+                                   +------------------------+
|  Cloud Storage   |                                   |   Cloud Tasks Queue    |
|   (GCS Bucket)   |                                   |  (Orchestrate-Queue)   |
+--------+---------+                                   +----------+-------------+
         ^                                                        |
         | (3) Download Once                                      | (4) Dispatch
         |                                                        v
+--------+--------------------------------------------------------+-------------+
|                          Worker Service (Cloud Run - Prod)                     |
|                                                                               |
|  +-------------------+      +-------------------+      +-------------------+  |
|  |   Orchestrator    |      |  Virtual Chunker  |      |  Chunk Processor  |  |
|  | (Job Lifecycle)   |----->| (Offset Logic)    |----->| (Gemini AI Chain) |  |
|  +-------------------+      +-------------------+      +---------+---------+  |
|            |                                                     |            |
+------------+-----------------------------------------------------+------------+
             |                                                     |
             | (5) Results & Progress                              | (6) AI Call
             v                                                     v
+------------------------+      +-----------------------------------------------+
|  PostgreSQL (Supabase) |      |            Google Gemini File API             |
|   (Managed Service)    |      |         (Single Upload + Multi-Turn)          |
+------------------------+      +-----------------------------------------------+
```

### 3. Component Breakdown

#### 3.1 Frontend Application
*   **Technology:** Next.js 15 (App Router), React 19.
*   **Responsibility:** Secure video streaming to GCS, real-time progress visualization, and interactive box-score verification.

#### 3.2 API Service
*   **Technology:** Node.js/Express.
*   **Responsibility:** Gateway for all data operations. Triggers the orchestration lifecycle by creating a Cloud Task once a video upload is confirmed.

#### 3.3 Worker Service (High-Performance)
*   **Resources:** Scaled to **2 vCPU / 4GiB RAM** with a **1-hour timeout**.
*   **Responsibilities:**
    *   **Orchestrator:** Manages the overall job state machine (`PENDING` -> `QUEUED` -> `CHUNKING` -> `ANALYZING` -> `FINALIZING` -> `COMPLETED`).
    *   **Virtual Chunker:** Replaces physical FFmpeg slicing. Calculates logical time segments (e.g., 0-120s) and persists them as database rows.
    *   **Chunk Processor:** Executes the **Sequential Multi-Turn Chain**. It uploads the video once to Gemini and iterates through segments, passing AI "memory" (chat history) from turn to turn. Updates a 30s **Heartbeat** for observability.
    *   **Job Finalizer:** Performs the final `onJobFinal` lifecycle: usage auditing, game status updates, and automatic sanitization of GCS and Gemini files.

#### 3.4 API Watchdog (Reliability)
*   **Responsibility:** A background service in the API that monitors the `VideoAnalysisJob` table. It detects "stale" jobs (no heartbeat for 15+ minutes) and auto-fails them to ensure the system remains observable and recoverable.

### 4. Data Pipeline Principles

1.  **Direct Video Analysis:** To maximize AI consistency, we avoid cutting the video into separate files. Gemini analyzes a single raw file using `start_offset` and `end_offset` metadata.
2.  **Stateful Context:** The pipeline is strictly sequential. Turnover $N$ includes the roster and events discovered in turnover $N-1$, preventing the AI from "forgetting" player identities.
3.  **Resource Sanitization:** To protect privacy and budget, the system follows a "Zero-Leaked-Assets" policy. All intermediate cloud files are deleted immediately upon job completion via the `onJobFinal` method.
