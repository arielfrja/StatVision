
# StatVision: Comprehensive Architecture & Product Analysis

## I. Project Overview & Current State
StatVision is currently positioned not just as a side project, but as a professional, SaaS-level video analytics platform tailored for pro, semi-pro, and amateur basketball coaches. 

*   **Core Philosophy:** **"Human-in-the-Loop."** The AI acts as an assistant that samples the game and generates events, but the UI empowers the coach/user to verify, edit, assign players, and finalize the data.
*   **Design Language:** "Functional Modernism" / "Minimalist Utility." It utilizes Material 3 Dark, Inter + JetBrains Mono fonts, high data density, and 4px rounding (`ROUND_FOUR`) to create a professional analyst environment.
*   **Tech Stack Breakdown:**
    *   **Frontend:** Next.js (App Router), Tailwind CSS, Material Web. Features a highly rich Game Analysis page including a video player (with progress/duration callbacks), synchronized Timeline Review, sticky Play-by-Play feed, Event Editor, Box Score, and an Entity Assignment Modal (mapping "Blue #23" to a real roster).
    *   **API:** Node/Express on Cloud Run, TypeORM, and PostgreSQL (Supabase) acting as the source of truth for games, events, players, and rosters.
    *   **Worker:** Node/TS on Cloud Run. Features Job Orchestration (Chunker, ChunkProcessor, EventProcessor, Finalizer), FFmpeg integration, and Gemini AI for video analysis.

## II. Validated Strengths (What is working exceptionally well)
1.  **Job-Based Worker Architecture:** Using an event-driven architecture with Cloud Tasks (Push) rather than Pub/Sub (Pull) is modern and highly effective. It allows for "scale to zero" cost efficiency, provides a clear queue with idempotency, and allows throttling to respect Gemini AI API quotas.
2.  **Highly Modular Pipeline:** The Worker is neatly divided into specialized services (`VideoChunkerService`, `EventProcessorService`, `JobFinalizerService`). This makes it easy to swap AI engines in the future or add Quality Control/Preprocessing steps.
3.  **Top-Tier UX/UI Integration:** The frontend perfectly executes the Human-in-the-Loop vision. The synchronized relationship between the video player, timeline, and editable play-by-play feed is a massive differentiator from purely raw statistical tools.
4.  **Strategic Documentation:** The `README`, `SAD.md`, `STRATEGY.md`, and `MASTER_ROADMAP.md` are documented at an enterprise SaaS level. The detailed pillars (Accuracy, Expansion, Engagement, Functionality, Profitability, Innovation) and the "Ethical Monetization" plan (Free/Pro/Org tiers) are highly professional.

---

## III. Architectural & Infrastructure Gaps (Areas for Immediate Improvement)

### 1. The Chunking Architecture Discrepancy (Virtual vs. Physical)
*   **The Problem:** The `SAD.md` envisions **"Virtual Chunking"** (Direct Video Analysis where the AI receives time offsets/ranges from a single uploaded file). However, the actual code in `VideoChunkerService` uses **"Physical Slicing"** (running `ffprobe` and `ffmpeg -ss/-t` to create temporary `enhanced-chunk-...mp4` files on the disk, with Sequential/Parallel switch modes).
*   **The Impact:** Discrepancy between documentation and code, heavy I/O operations, out-of-memory (OOM) risks, and unnecessary complexity.
*   **The Solution:** Choose one definitive path:
    *   *Path A (Recommended):* If Gemini's Video API handles offsets reliably, completely remove FFmpeg slicing from the analysis pipeline. Use FFmpeg *only* for initial preprocessing. The Worker should solely rely on `{startTime, endTime, sequence}` logical segments.
    *   *Path B:* If Gemini is unstable with offsets, embrace physical chunking, but update the `SAD` to reflect this as the canonical design and clean up the dual logic.

### 2. FFmpeg Bottlenecking the Critical Path
*   **The Problem:** According to `INFRA_STATUS`, FFmpeg consumes 100% CPU as a child process. This chokes the Node event loop, causing TLS connections to GCP to drop and resulting in timeouts.
*   **The Solutions:**
    *   **Pre-Processing Microservice:** Isolate heavy video prep into a separate Cloud Run service. Before reaching the main analysis worker, normalize the video (e.g., downscale to 720p/540p, normalize to a flat 25 FPS, standard H.264+AAC codec).
    *   **Concurrency Limits:** Use Cloud Tasks and Environment Variables (e.g., `MAX_CONCURRENT_JOBS`, `MAX_FFMPEG_JOBS`) to cap the number of jobs in the `CHUNKING` status simultaneously.
    *   **Metrics:** Add specific logging per job (time spent chunking, analysis duration, video size/fps) to measure if preprocessing optimizations are actually working.

### 3. Observability & The "Stuck in UPLOADED" Issue
*   **The Problem:** Jobs are getting stuck without a clear resolution path. While JSON logging and `errorId` exist, there is no centralized lifecycle management.
*   **The Solutions:**
    *   **Robust Job Entity:** Create a strict Jobs table containing: `jobId`, `gameId`, `status` (QUEUED, CHUNKING, ANALYZING, FINALIZING, FAILED, COMPLETED), `lastHeartbeatAt`, `lastError`, and `retryCount`.
    *   **Admin UI:** Create a hidden/internal protected route for admins to view pipeline statuses, debug logs, and click a "Force Retry / Replay from Step X" button.
    *   **Dead-Letter/Retry Policy:** Define strict rules (e.g., after *N* retries, mark as `FAILED` and send an email/dashboard notification).

---

## IV. Product & UX Enhancements

### 1. "A Day in the Life of a Coach" Workflow
*   **Game Status Badges:** Add clear logical states to games: `RAW` → `IN_REVIEW` → `VERIFIED`. Display these as badges on the UI.
*   **Finalization:** Add a "Mark Game as Verified" button once the coach finishes human-in-the-loop edits.
*   **Dashboard Filters:** Allow filtering by "Show only unverified games."

### 2. Player-Centric View (B2C / Single Player Mode)
*   **Player Profiles (`/players/[playerId]`):** Enhance this page with eFG% (Effective Field Goal) and TS% (True Shooting) trend lines over time, cumulative shot charts, and a "Top 5 Best Games" list.
*   **Single-Session View:** Instead of a team box score, show an isolated breakdown for a single player. Include their specific shot chart and an auto-generated highlight reel of all their shots/drives. This creates a perfect entry point for a "Free Tier" offering.

### 3. Hardening UI & API Contracts
*   **Strict Typing:** Create a shared library (e.g., `@statvision/common`) containing Zod schemas, TypeScript DTO interfaces, and Enums (gameStatus, eventType) to ensure zero drift between the API and Frontend.
*   **Safe Deletion:** Currently, deleting an event in the PlayByPlay feed relies on a hard confirmation. Implement a "Soft Delete" (using a `deletedAt` column) and a client-side "Undo last deleted event" buffer to prevent accidental data loss.

---

## V. AI, ML & Data Schema Evolution

### 1. Robust Event Schema
Ensure the `GameEvent` schema is strictly defined to decouple UI updates from the underlying AI model. It should look like this:
```typescript
type GameEvent = {
  id: string;
  gameId: string;
  type: 'SHOT' | 'REBOUND' | 'ASSIST' | 'TURNOVER' | ... ;
  result?: 'MADE' | 'MISSED' | 'OFFENSIVE' | 'DEFENSIVE';
  teamId?: string;
  playerId?: string | null;           // Post-human mapping
  detectedEntity?: string;            // e.g., "Blue #23"
  absoluteTimestamp: number;          // Seconds from video start
  period: number;                     // Quarter/Half
  shotLocation?: { x: number; y: number }; // Normalized court coords (0-1)
  sourceChunkSequence?: number;       // For debugging
  sourceModel?: 'GEMINI_3_5_FLASH' | 'CV_MODEL_X';
  confidence?: number;
};
```
*Benefit:* This makes generating Box Scores a simple aggregation task and makes plotting Shot Charts highly trivial.

### 2. The "Virtual Coach" Report (LLM Integration)
Leverage the existing Gemini integration for high-level insights, not just data extraction.
*   **Endpoint:** `POST /games/:id/coach-report`
*   **Input:** Batched events + box score + game metadata (age group, level).
*   **Output:** A structured JSON containing:
    *   3 Strengths (What went well).
    *   3 Weaknesses (Areas to focus on).
    *   2-3 Recommended Drills (e.g., "Catch-and-shoot from the left wing").
*   **UI Integration:** Add a "Coach Report" tab on the Analysis page with export-to-PDF/share capabilities.

### 3. Future Computer Vision (CV) Integration
Once the system outgrows relying solely on Gemini, introduce:
*   **Court Homography:** Mapping 2D video frames to a standardized court map to understand spatial positioning.
*   **Microservice Tracking:** A separate Python service running YOLO + ByteTrack to generate bounding boxes for players and the ball, creating frame-by-frame trajectory data.

---

## VI. Consolidated Actionable Roadmap

### Phase 1: Short-Term (Next 1-2 Sprints)
1.  **Resolve Chunking Architecture:** Decide definitively between Virtual vs. Physical chunking, align documentation, and isolate FFmpeg to pre-processing only.
2.  **Implement Job Observability:** Build the Jobs table, define retry logic, create the internal Admin replay UI, and squash the "UPLOADED but stuck" bug.
3.  **UI Hardening:** Implement Soft Delete and an "Undo" button for events. Establish the `@statvision/common` shared typed contracts.
4.  **Coach Report V1:** Build the LLM-powered insights tab based on parsed events.

### Phase 2: Medium-Term (3-6 Sprints)
1.  **Spatial Analytics:** Add `shotLocation` coordinates to the event schema. Build an SVG court map on the UI to display heatmaps and shot charts per game/player.
2.  **Player-Centric Views:** Build out the individual player dashboards with trend graphs and isolated stats.
3.  **Highlight Generator V1:** Build a process that takes specific events (e.g., all `SHOT_MADE`), extracts those timestamp clips, and stitches them into a single short MP4 reel.

### Phase 3: Long-Term 
1.  **Multi-Tenancy & Temporal Rosters:** Build Workspaces/Organizations, handle changing jersey numbers across seasons, and manage Coach/Player permissions.
2.  **Gamification & Market Expansion:** Implement ELO-based leaderboards, cross-game/cross-season Park Legends rankings, and tools for sharing verified stats with scouts.

---

## VII. Next Steps / Deep Dive Options
To move forward, you should choose one specific vertical to drill down into on your next iteration:
1.  **The Worker / Infrastructure:** A file-by-file refactoring plan for the Chunker/JobFinalizer, extracting interfaces, and setting up the Pre-processing service.
2.  **API Contracts & Data Integrity:** Building the exact Zod schemas, implementing `@statvision/common`, and guaranteeing zero drift.
3.  **Frontend UX / Performance:** Optimizing the React state in `games/[gameId]`, adding virtualization/memoization to handle high data density without lag, and seamlessly adding the Shot Chart/Coach Report tabs.
