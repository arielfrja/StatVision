# Decoupled Video Processing Worker

This directory contains the core logic for the StatVision video analysis pipeline. It is designed as a decoupled microservice that runs independently of the main API server, communicating via Google Cloud Pub/Sub. This architecture ensures that long-running, resource-intensive video analysis tasks do not block or slow down the main user-facing API.

## Architecture & Workflow

The worker is composed of several services that orchestrate a multi-stage, event-driven workflow:

1.  **Orchestration (`VideoOrchestratorService`)**:
    -   Listens for new jobs on the `video-upload-events` Pub/Sub subscription.
    -   When a message is received, it creates a `VideoAnalysisJob` record in the database.
    -   It uses the `VideoChunkerService` to split the source video into smaller, overlapping segments using **FFmpeg**.
    -   For each segment, it creates a `Chunk` record in the database.
    -   It then publishes a message for each chunk to the `chunk-analysis` topic, delegating the analysis task.

2.  **Analysis (`ChunkProcessorWorker`)**:
    -   Listens for individual chunk jobs on the `chunk-analysis` subscription.
    -   For each chunk, it calls the **Google Gemini API** to perform video intelligence analysis.
    -   The prompt sent to Gemini includes context about already-identified players and teams to ensure consistency across chunks.

3.  **Event Processing (`EventProcessorService`)**:
    -   Receives the raw JSON output from the Gemini API.
    -   Parses the data, validates it, and transforms it into structured `ProcessedGameEvent` objects.
    -   Crucially, it implements **deduplication logic** to prevent events that occur in the overlapping portion of video chunks from being counted multiple times.
    -   It assigns consistent UUIDs to newly identified teams and players.

4.  **Finalization (`JobFinalizerService`)**:
    -   After each chunk is processed, this service checks the overall status of the `VideoAnalysisJob`.
    -   If all chunks are completed successfully, it marks the job as `COMPLETED`.
    -   If any chunk fails permanently, it marks the entire job as `FAILED` and records the reason.
    -   Upon completion or failure, it publishes the final result (including all processed events) to the `video-analysis-results` topic. The main backend API consumes this message to update the final game status and persist all events and calculated stats.

## Running the Worker

The worker is started from the root of the `/backend` directory using a dedicated npm script.

```bash
# From the /backend directory
npm run start:worker
```

This command uses `ts-node` to run `/backend/src/startWorker.ts`, which initializes the worker services and begins listening for messages on the configured Pub/Sub subscriptions.

## Key Files

-   **`startWorker.ts`**: The main entry point for the worker process. It initializes and starts all worker services.
-   **`videoProcessorWorker.ts`**: The `VideoOrchestratorService` that manages the end-to-end job lifecycle.
-   **`ChunkProcessorWorker.ts`**: The worker responsible for the core analysis of a single video chunk.
-   **`VideoChunkerService.ts`**: A utility service that uses `ffmpeg` to split videos into manageable segments.
-   **`GeminiAnalysisService.ts`**: Handles all communication with the Google Gemini API, including file uploads and content generation.
-   **`EventProcessorService.ts`**: Contains the business logic for cleaning, deduplicating, and structuring the raw AI output.
-   **`JobFinalizerService.ts`**: Determines the final status of a job and publishes the outcome.
-   **`VideoAnalysisJob.ts` & `Chunk.ts`**: The TypeORM entities used to track the state of jobs and chunks in the database.
