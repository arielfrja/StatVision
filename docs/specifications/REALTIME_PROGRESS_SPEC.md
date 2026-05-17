---
title: Real-time Worker Progress Updates
tags: [real-time, worker, websockets, pubsub]
sources: [worker-src, api-src]
updated: 2026-05-15
---

# Specification: Real-time Worker Progress Updates

## 1. Objective
Provide users with real-time visibility into the status and progress of their video analysis jobs. This includes a percentage-based progress bar and a description of the current phase (e.g., "Chunking Video", "Analyzing Chunk 3/10", "Finalizing Stats").

## 2. Architecture Overview
We will utilize the existing Google Cloud Pub/Sub infrastructure for inter-service communication and implement WebSockets (via Socket.io) in the API to push updates to the Frontend.

### Workflow:
1.  **Worker:** 
    *   Enhances `ProgressManager` to track percentage and current phase.
    *   Publishes updates to a new Pub/Sub topic: `job-progress`.
    *   Periodically updates the `VideoAnalysisJob` entity in the database to ensure state persistence.
2.  **API:**
    *   Subscribes to the `job-progress` Pub/Sub topic.
    *   Hosts a Socket.io server.
    *   Emits progress events to connected clients joined in "job-specific" rooms.
3.  **Frontend:**
    *   Connects to the API via Socket.io.
    *   Joins a room for the specific `jobId` being tracked.
    *   Displays a dynamic progress bar and status text.

## 3. Technical Changes

### 3.1 @statvision/common (Entities)
- **VideoAnalysisJob:**
    *   Add `progress: number` (0-100).
    *   Add `currentPhase: string` (e.g., 'CHUNKING', 'ANALYZING', 'FINALIZING').
    *   Add `totalChunks: number` (to calculate percentage accurately).

### 3.2 @statvision/worker
- **ProgressManager:**
    *   Enhance to accept a `jobId`.
    *   Add a method `publishProgress(jobId: string, progress: number, phase: string)`.
    *   Inject `PubSubService` (or similar) to handle publishing.
- **Worker Logic (VideoOrchestrator, ChunkProcessor):**
    *   Call `ProgressManager.updateJob(...)` which now triggers both CLI bar updates and Pub/Sub publishing.

### 3.3 @statvision/api
- **Dependencies:** Install `socket.io`.
- **Infrastructure:**
    *   Initialize Socket.io server in `app.ts`.
    *   Create a `ProgressSubscriber` that listens to `job-progress` Pub/Sub topic.
- **WebSocket Logic:**
    *   Clients join room: `job:${jobId}`.
    *   On Pub/Sub message, emit `progress_update` to the room.

### 3.4 Frontend
- **Dependencies:** Install `socket.io-client`.
- **Components:**
    *   Create a `JobProgressBar` component.
    *   Create a `useJobProgress` hook to manage WebSocket connection and state.

## 4. Database Schema Update (Migration)
```sql
ALTER TABLE worker_video_analysis_jobs 
ADD COLUMN progress INTEGER DEFAULT 0,
ADD COLUMN current_phase VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN total_chunks INTEGER DEFAULT 0;
```

## 5. Security
- WebSocket connection should be authenticated (reuse existing JWT logic).
- Users can only join rooms for jobs they own.

## 6. Edge Cases & Reliability
- **Stale Progress:** If a worker crashes, the progress might stay stuck. The `processing_heartbeat_at` column should be used to detect and reset stale jobs.
- **Network Interruptions:** Frontend should automatically reconnect and fetch the latest state from the API/DB.
