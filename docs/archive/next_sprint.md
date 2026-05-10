### Next Sprint Plan: Decoupled Video Processing Worker

**Reference:** For detailed architecture, see `backend/docs/video_processing_architecture.md`.

**Goal:** Implement a decoupled video processing worker service, designed as a microservice, and integrate it with the main backend API via a messaging queue.

## Tasks

*   **[BE-303]** Implement the **Video Processing Worker Service** (Decoupled Microservice Design) with a clear interface, responsible for consuming video upload events, video processing, chunking (2:30 duration, 30s overlap), calling the Gemini API, parsing the response, and generating chunk metadata (sequence number, timestamp in video, absolute original time). The processor should detect overlapping events and count them only once, and each video segment should detect only events *started* in the first 2 minutes of the segment.
*   **[BE-306]** Implement the main backend API logic to publish video upload events to the Pub/Sub topic after a successful video upload.