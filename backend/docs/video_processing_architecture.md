# Decoupled Video Processing Worker Service Architecture

This document outlines the architecture and workflow for the decoupled video processing worker service, which handles the intensive task of analyzing uploaded game videos using the Gemini API.

## Overall Goal
To decouple heavy video processing and AI analysis from the main backend API, thereby improving the responsiveness of the API and enhancing the scalability and resilience of the video analysis pipeline.

## Components Involved

*   **Frontend:** The user interface responsible for initiating video uploads.
*   **Main Backend API:** The primary API server that handles user requests, including receiving video uploads.
*   **Pub/Sub (or other Message Queue):** A messaging service (e.g., Google Cloud Pub/Sub) that acts as an asynchronous communication channel between the Main Backend API and the Video Processing Worker Service.
*   **Video Processing Worker Service (New Microservice):** A dedicated service responsible for consuming video upload events, processing videos, interacting with AI models, and storing analysis results.
*   **PostgreSQL Database:** The central data store for game information, events, and statistics.
*   **Google Cloud Storage (Future):** For scalable and durable storage of video files.

## Step-by-Step Workflow

### Step 1: Video Upload Initiation (Frontend to Main API)
1.  The user uploads a video file via the frontend UI (e.g., the "Analyze New Game" component).
2.  The frontend sends this video file as a request to the `POST /games/upload` endpoint on the **Main Backend API** (`BE-302`).

### Step 2: Main API Handles Upload & Publishes Event (`BE-306`)
1.  The **Main Backend API** receives the video file.
2.  It saves the video file to a designated storage location (e.g., local filesystem for MVP, or eventually Google Cloud Storage as per `DEVOPS-03`).
3.  It updates the `Game` record in the database (using `BE-305`) with the file path and sets its status (e.g., to `PROCESSING_PENDING`).
4.  The Main API constructs a message containing essential information (e.g., `gameId`, `filePath` of the uploaded video, `userId`).
5.  This message is then published to a **Pub/Sub topic** (`DEVOPS-04`). This acts as an event, signaling that a video is ready for processing.
6.  The Main API immediately sends a response back to the frontend (e.g., a 202 Accepted status), indicating that the upload was successful and processing has been initiated. This keeps the API responsive.

### Step 3: Worker Service Consumes Event (`BE-303`)
1.  The **Video Processing Worker Service** is a separate application (even if co-located initially, it's designed as a distinct logical unit).
2.  This Worker Service continuously listens for new messages on the configured **Pub/Sub topic**.
3.  When a new message (video upload event) arrives, the Worker Service consumes it, extracting the `gameId`, `filePath`, and other relevant data.

### Step 4: Worker Processes Video & Calls AI (`BE-303`)
1.  The Worker Service retrieves the actual video file from storage using the `filePath`.
2.  It then performs the intensive video processing:
    *   **Video Chunking:** Breaks the video into smaller, manageable segments (e.g., 2 minutes 30 seconds duration with 30 seconds overlapping, like 0-2:30, 2:00-4:30, etc.). This is vital for efficient AI processing and to fit within API limits. FFmpeg will be used for this purpose. Each chunk file should also include metadata such as sequence number, timestamp in video (start time of the chunk), and absolute original time (time of creation + timestamp).
    *   **AI Analysis (Gemini API):** For each video segment, it makes calls to the **Gemini API**. Gemini analyzes the visual content to identify basketball events (shots, passes, rebounds, fouls), player movements, ball trajectory, etc. The processor should specifically detect only events *started* in the first 2 minutes of the segment.
    *   **Parsing AI Response:** The Worker Service parses the structured data returned by the Gemini API, transforming it into our defined `GameEvent` data model. During this process, it must detect and handle overlapping events, ensuring each unique event is counted only once.
3.  It uses the `GameEventRepository` (`BE-304`) to **batch insert** these newly parsed `GameEvent` records into the **PostgreSQL Database**.
4.  After inserting the events, it triggers the logic from `BE-305.1` to **calculate and store detailed derived statistics** (like shooting percentages, turnovers, fouls, etc.) based on these events, saving them into the `game_team_stats` and `game_player_stats` tables.

### Step 5: Worker Updates Game Status (`BE-305`)
1.  Once the video processing, event insertion, and stat calculation are complete (or if an error occurs during the process), the Worker Service updates the `Game` record's status in the database (e.g., to `ANALYZED` or `FAILED`) using the `GameService` (which leverages `BE-305`). This notifies the main application that the analysis is finished.

## Benefits of this Decoupled Approach

*   **Responsiveness:** The main API remains fast and responsive to user requests, as it offloads heavy processing.
*   **Scalability:** The Worker Service can be scaled independently. If video uploads increase, you can simply run more instances of the worker without affecting the main API.
*   **Resilience:** If the worker crashes, messages remain in Pub/Sub and can be reprocessed, preventing data loss.
*   **Maintainability:** Clear separation of concerns makes the codebase easier to understand, develop, and debug.
