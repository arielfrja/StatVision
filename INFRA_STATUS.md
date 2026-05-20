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

## 4. Proposed Optimizations (Under Review)
1.  **Switch to Push Subscriptions**: Change Pub/Sub from Pull to **Push** (Webhooks). This allows the Worker to scale to **0 instances** and only pay for compute when a video actually arrives.
2.  **Resource Boost**: Increase Worker to **4 vCPU / 4GB RAM** to ensure `ffmpeg` finishes chunking fast enough to prevent network connection drops.
3.  **Ephemeral Storage**: Explicitly increase container disk limits to accommodate large 4K video downloads.

## 5. Current Bottleneck Game
*   **Game ID**: `6722a6d9-9992-4ce4-b8cc-8ea996de738e`
*   **Status**: Video is 100% safe in GCS, but the analysis job is currently a "Zombie" (marked as `PROCESSING` in DB but idle in reality).

---
**Status Report Generated for: Senior Architect Review**
