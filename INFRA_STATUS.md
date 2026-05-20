# 🏗️ StatVision Technical Infrastructure Status (May 2026)

## 1. System Architecture Overview
StatVision is a monorepo consisting of:
*   **Frontend**: Next.js 16 (App Router) hosted on Vercel.
*   **API**: Node.js/Express service on Google Cloud Run.
*   **Worker**: Node.js background processor on Google Cloud Run (handles FFMPEG & Gemini AI).
*   **Storage**: Google Cloud Storage (GCS) for video assets.
*   **Messaging**: Google Cloud Pub/Sub for service orchestration.
*   **Database**: PostgreSQL hosted on Supabase.

## 2. Current "Uploaded but stuck" Status
**Issue**: Several games are stuck in `UPLOADED` status without triggering analysis.
**Root Cause**: 
*   **Resource Constraints**: The Worker was initially hitting OOM (Out of Memory) errors at 512MB RAM during video downloads. 
*   **CPU Starvation**: Upgrading to 4GB RAM allowed the process to survive, but the 2-vCPU limit is causing `ffmpeg` to consume 100% CPU, which starves the Node.js event loop and drops the TLS/gRPC connections to GCP, leading to silent failures or timeouts (`14 UNAVAILABLE`).
*   **Scaling Conflict**: Cloud Run's default "Scale to Zero" behavior conflicts with Pub/Sub **Pull** subscriptions. The Worker goes to sleep and never "hears" new messages unless kept alive at a fixed monthly cost (~$20/mo).

## 3. Recent Major Fixes
*   ✅ **Direct-to-Cloud Uploads**: Refactored from server-proxied uploads to GCS Resumable Signed URLs. Data now flows directly from Browser -> GCS.
*   ✅ **Shared Filesystem**: Implemented GCS providers in both services to allow the Worker to download videos uploaded by the API.
*   ✅ **Persistent Resumption**: Added `localStorage` and DB columns (`upload_url`) to allow users to resume large uploads across page refreshes.
*   ✅ **JSON Logging**: Migrated production logs to structured JSON for better observability in Cloud Run.

## 4. Implemented Optimizations (May 2026)
1.  **Transition to Cloud Tasks**: Replaced Pub/Sub Pull with **Google Cloud Tasks (Push via HTTP)**. This allows the Worker to scale to **0 instances** when idle, significantly reducing costs.
2.  **Controlled Fan-Out**: Implemented a two-stage processing model (Chunker -> Analyzer) triggered by Cloud Tasks with strict rate limits (12 chunks/min) to stay within Gemini Free Tier quotas.
3.  **FFMPEG Stabilization**: Configured `ffmpeg` with `-threads 2` to prevent CPU starvation. This keeps the Node.js event loop responsive for gRPC heartbeats and network stability.
4.  **Atomic Progress Tracking**: Added `total_chunks` and `completed_chunks` tracking to the database to manage parallel analysis jobs.

## 5. Current Bottleneck Game
*   **Status**: Refactor in progress. System is being transitioned to the new task-based architecture.

---
**Status Report Updated: Transitioning to Task-Based Architecture**
