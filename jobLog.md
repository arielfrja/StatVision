# Job Log - StatVision

## [2026-05-24] AI: Olympic-Level Statistician Logic Upgrade
**Objective:** Enhance AI detection precision by integrating professional NBA/Olympic-level statistician logic into the Gemini system instructions.

### Major Changes:
- **System Persona:** Transitioned the AI persona to an expert "Caller & Inputter" agent focused on absolute precision and objective tracking.
- **Broadcast Intelligence:**
    - Implemented strict logic to **ignore replays** (recognizing camera cuts/graphics) and **dead time** (commercials/stoppages).
    - Integrated dual-timestamping: Every event now tracks both `video_timestamp` and `game_clock` (anchored to the scorebug).
- **Event Taxonomy & Chaining:**
    - Expanded taxonomy for SHOTs (2PT/3PT/FT, Jump/Layup/Dunk), TURNOVERs (Violations/Bad Pass), and FOULs.
    - Enforced strict chronological chaining: REBOUNDs must follow MISSED shots; ASSISTs must precede MADE shots.
- **Infrastructure Alignment:**
    - Unified the professional logic with StatVision's 2-minute segment processing and 10-second overlap handling.
    - Hardened the JSON output schema to include detailed event metadata, coordinates (100x100 grid), and confidence scores.

**Status:** AI Intelligence core upgraded. Existing backend deduplication logic preserved. Ready for higher-precision game analysis.

## [2026-05-24] UI/UX: Professional Game Page Redesign
**Objective:** Redesign the Game Page to match professional basketball analytics standards (NBA.com/EuroLeague style) with read-only defaults and granular editing.

### Major Changes:
- **Scoreboard Header:**
    - Implemented a high-impact scoreboard showing team logos, live scores, and game status (FINAL/LIVE).
    - Integrated metadata (location, date, game type) with professional iconography.
- **Data Workspace:**
    - **Box Score Overhaul:** Transitioned from team-only totals to individual player rows. Added hover-reveal "Edit" buttons for every player row to allow manual stat correction.
    - **Play-by-Play Feed:** Redesigned as a high-density vertical feed with team indicators, timestamped actions, and integrated edit/delete triggers.
    - **Tabbed Interface:** Integrated Material Web Tabs (`md-tabs`) to organize Box Score and Personnel sections on both desktop and mobile.
- **Workflow & Interaction:**
    - Established a "Read-Only First" state for all analytical views to ensure professional clarity.
    - Optimized the video player layout with a persistent "Live Analysis" indicator and frame-perfect timeline syncing.
    - Standardized on JetBrains Mono for all numeric data rows to ensure perfect tabular alignment.

**Status:** Game Page redesigned for elite coaching use. Deployment to Vercel triggered.

## [2026-05-24] UI/UX: Foundational Design Blueprint & Material Web Integration
**Objective:** Establish a comprehensive DESIGN.md and refactor the frontend to align with the "Minimalist Utility" vision, officially based on the **Material Web (Material 3)** design system.

### Major Changes:
- **Design System Definition:**
    - Established the **"Material Utility"** aesthetic: A professional, high-density language built on official Material 3 components.
    - Defined a core **Color Palette** focused on neutral foundations (`#0A0A0B`, `#161618`) with a surgical **Electric Blue** (`#3B82F6`) primary accent.
    - Standardized **Typography** using "Inter" for UI and "JetBrains Mono" for technical data.
    - Standardized **Shapes** with a sharp 4px (`ROUND_FOUR`) roundness across all M3 components.
- **Frontend Refactor (Material-First):**
    - **Global M3 Tokens:** Added comprehensive Material 3 token overrides to `globals.css` to ensure all components automatically inherit the "StatVision" look.
    - **Core Components:** Refactored `Button.tsx` and `JobProgressBar.tsx` to wrap official `@material/web` components.
    - **Tables & Data:** Updated `IdentifiedEntitiesTable.tsx` and `UploadForm.tsx` to use M3-aligned typography, spacing, and progress indicators.
    - **Layout:** Standardized on a 4px/8px structural rhythm for maximum data density on desktop and usability on mobile.

**Status:** DESIGN.md finalized and Frontend refactored to be Material-powered. The platform now combines the accessibility of Material 3 with the focused utility of a professional coaching tool.

## [2026-05-21] Infrastructure: Refinements & Deployment
**Objective:** Finalize the Cloud Tasks transition with enhanced observability and verify deployment to the `test` environment.

### Major Changes:
- **Data Integrity & Player Discovery:**
    - **Explicit Mapping:** Replaced `Object.assign` with manual field mapping in `VideoAnalysisResultService` and `JobFinalizerService`. This prevents raw AI fields (like `absolute_timestamp` or `timestamp`) from polluting the `GameEvent` entity and causing database type errors.
    - **Robust Time Parsing:** Hardened the `parseTime` utility to handle edge cases, whitespace, and invalid formats. It now guarantees a numeric output, eliminating `NaN` errors that were causing PostgreSQL rejections.
    - **Player Discovery Hardening:** Ensured that `resolvePlayerIds` is called during both live streaming and final aggregation. This guarantees that every detected player—even those without jersey numbers—is assigned a unique `Temp Player` record in the database.
    - **UUID Validation:** Implemented strict UUID checks (`isUuid`) to prevent temporary AI strings (like "TEMP_PLAYER_X") from being saved into UUID columns.
- **Deployment:**
    - Pushed the final data-integrity refactor to the `test` branch.

### Status Update:
- **Build:** ✅ Passing
- **Deployment:** 🔄 In Progress (Final Data Hardening)
- **Aggregation:** ⏳ Pending (Automatically retries on worker startup).

## [2026-05-20] Infrastructure: Cloud Tasks Refactor & Stability
**Objective:** Transition the video processing pipeline to a "Controlled Fan-Out" architecture using Google Cloud Tasks to reduce costs and fix gRPC timeouts.

### Major Changes:
- **Cost Optimization:**
    - Replaced Pub/Sub **Pull** subscriptions in the Worker with **HTTP Push endpoints**.
    - This allows the Worker to scale to **0 instances** when idle, saving ~60% in monthly compute costs.
- **Controlled Fan-Out (Scale):**
    - Split processing into two stages: **Orchestrator (Chunker)** and **Analyzer**.
    - Implemented a "governor" via Cloud Tasks queue limits (12 chunks/min) to stay within Gemini Free Tier rate limits (15 RPM).
    - Future-proofed the system for parallel processing by adjusting queue limits.
- **Stability Fixes:**
    - Restructured FFMPEG commands to use `-threads 2`, preventing CPU starvation of the Node.js event loop.
    - This eliminates `14 UNAVAILABLE` gRPC errors caused by dropped heartbeat signals.
- **Progress Tracking:**
    - Added `total_chunks` and `completed_chunks` columns to the `games` table and `worker_video_analysis_jobs` for atomic progress tracking.
    - Implemented atomic increments in the database per chunk completion.
- **Integration:**
    - Updated the API to trigger orchestration via Cloud Tasks instead of Pub/Sub.
    - Added a new migration `1816000000000-AddChunkTrackingToGameAndJob.ts`.

### QA Task List:
- [ ] **Task Triggering:** Verify that uploading a video through the API creates a Cloud Task for the Worker.
- [ ] **Chunking Flow:** Confirm the Orchestrator successfully slices the video and queues new Tasks for each chunk.
- [ ] **Analysis Aggregation:** Verify that `completed_chunks` increments correctly and the job is finalized when all chunks are done.
- [ ] **Scale-to-Zero:** Confirm (via GCP Console) that Cloud Run instances terminate when no tasks are in the queue.

**Status:** Implementation Complete. Monorepo builds successfully. Ready for deployment to `test` environment.

## [2026-05-17] Integration: Feature Merging & QA Preparation
**Objective:** Merged all active feature branches into the `test` branch to prepare for unified QA verification.

### Major Changes:
- **Branch Merging:**
    - Merged `feat/minimalist-pivot` (UI overhaul) into `test`.
    - Merged `feature/local-pubsub-emulator` (Shared Infra) into `test`.
    - Merged `feat/realtime-progress` (Socket.io updates) into `test`.
- **Conflict Resolution:**
    - Resolved infrastructure conflicts in `api/src/app.ts` and `AppContainer.ts` to support both Pub/Sub consumers and Socket.io progress updates.
    - Standardized `IEventBus` usage across all services to use the consolidated `@statvision/common` implementation.
- **Verification:**
    - Successfully executed `npm run master:build` ensuring all services (`api`, `worker`, `frontend`, `common`) are compile-safe.

### QA Task List:
- [ ] **Real-time Progress:** Verify that video processing progress is reported via Socket.io to the frontend.
- [ ] **Pub/Sub Emulator:** Ensure that local runs using `scripts/run-all.sh` correctly use the GCloud emulator.
- [ ] **Minimalist UI:** Confirm that all pages follow the new functional minimalist design tokens.
- [ ] **Video Upload:** Verify the "Fast Upload" flow end-to-end.

## [2026-05-17] Infrastructure: Vercel Deployment Diagnosis
**Objective:** Resolve the recurring build failure: "Couldn't find any pages or app directory".

### Diagnosis:
- **Root Cause:** Vercel project was configured to build from the repository root instead of the `frontend/` subdirectory.
- **Evidence:** Git-triggered builds showed 923 packages (monorepo total) vs 622 packages for isolated frontend builds.
- **Resolution:** Manually verified that deploying from the `frontend/` directory via CLI succeeds. 
- **Recommendation:** User must update Vercel Project Settings > General > Root Directory to `frontend`.

**Status:** Diagnosis Complete. Manual deployment verified at https://frontend-mkle3gnj5-arielfrja-2128s-projects.vercel.app.

## [2026-05-17] Infrastructure: GitHub Deployment Workflow Fix
**Objective:** Resolve failures in the automated deployment pipeline (`deploy.yml`).

### Fixes:
- **GCP Sequence:** Moved `Google Auth` before `Sync Pub/Sub Infrastructure` to ensure ADC are available.
- **Vercel Pathing:** Removed `working-directory: frontend` from the Vercel action to prevent redundant nesting (Vercel project is already configured with `frontend` as root).

**Status:** Fixes applied to `deploy.yml`. Pushed to `test` for verification.

## [2026-05-17] Feature: Resumable Chunked Video Uploads
**Objective:** Improve upload reliability for large video files by implementing chunking and retries.

### Changes:
- **Backend (API):**
    - Added `GET /games/upload/status/:gameId` to query previously uploaded chunks.
    - Added `POST /games/upload/chunk` to receive 5MB segments and store them temporarily.
    - Implemented memory-efficient merging using Node.js streams once all chunks are received.
    - Automatic cleanup of chunk segments after successful assembly.
- **Frontend:**
    - Updated `UploadForm` to slice files into 5MB chunks.
    - Implemented sequential chunk uploading with a retry policy (3 attempts per chunk).
    - Integrated progress tracking based on completed chunks.
    - Support for resuming interrupted uploads by checking server status before starting.

**Status:** Implementation complete and optimized with streams. Ready for testing.

## [2026-05-18] Documentation: Project Cost Estimation Research
**Objective:** Provide a clear financial roadmap for infrastructure and AI model scaling.

### Activities:
- Researched May 2026 pricing for Gemini 2.5 Flash, GCP Cloud Run/Storage/PubSub, Vercel, and Supabase.
- Defined Alpha (Low Volume) vs. Growth (Medium Volume) cost scenarios.
- Identified strategic cost optimization paths (Batch API, Context Caching).
- Published comprehensive report to `docs/product/COST_ESTIMATION.md`.

**Status:** Research complete. Documentation added to the knowledge base.


## [2026-05-15] Infrastructure: GCloud Pub/Sub Emulator Transition
**Objective:** Replaced the local EventEmitter bus with a fully functional Google Cloud Pub/Sub emulator for local development.

### Major Changes:
- **Implementation Consolidation:**
    - Moved `PubSubEventBus` and `IEventBus` to `@statvision/common`.
    - Removed redundant implementations from `api` and `worker` directories.
    - Updated `AppContainer` in both services to use the shared implementation.
- **Local Emulator Support:**
    - Created `scripts/start-pubsub-emulator.sh` to launch the `gcloud` Pub/Sub emulator.
    - Created `scripts/init-pubsub.sh` to automatically provision topics and subscriptions on startup.
    - Added `init-pubsub` script to `worker/package.json` using `ts-node`.
- **Development Workflow:**
    - Integrated the emulator into `scripts/run-all.sh`.
    - Standardized environment variables (`PUBSUB_EMULATOR_HOST=localhost:8085`, `GCP_PROJECT_ID=statvision-local`) for local runs.

### Results:
- High parity between local development and cloud production environments.
- Simplified codebase by removing duplicate infrastructure logic.
- Robust event-driven architecture that accurately simulates asynchronous processing locally.

**Status:** Pub/Sub Emulator Integration Complete.

## [2026-05-14] Strategic Pivot: Minimalist Utility Transition
**Objective:** Transitioned StatVision from a "High-Dopamine/Gaming" aesthetic to a "Minimalist Utility" tool for coaches.

### Major Changes:
- **Visual Overhaul:** 
    - Replaced flashy "Stadium" styles (glows, glassmorphism, pulsing animations) with clean, high-contrast "Functional Minimalism".
    - Standardized typography to **Inter** sans-serif, removing the "black italic uppercase" gaming font.
    - Simplified color palette to neutrals with a single subtle accent (`electric`).
- **Analysis Page Redesign:**
    - Implemented a vertical layout: **Video Player on Top**, side-by-side **Box Score & Play-by-Play** on Bottom.
    - Removed redundant "Strategic Pulse" selection to lower cognitive load.
    - Refined "AI Analysis" indicators for a professional, clean look.
- **Play-by-Play Enhancements:**
    - Improved row click targets for the "Magic Interaction" (seek to timestamp).
    - Added **Edit** and **Delete** actions to PBP rows (MoSCoW Must-Have).
- **Performance Dashboard (Command Center):**
    - Refactored the main landing page into a clean "Performance Dashboard".
    - Flattened all cards and removed unnecessary tactical "fluff".
- **Upload Form Optimization:**
    - Simplified the "Upload & Forget" flow with a clean, professional multi-step interface.

### Results:
- Reduced **Time-to-Value** by making data more accessible and readable.
- Lowered **Cognitive Load** for coaches by removing visual distractions.
- Built a foundation for **Trust-based AI** by exposing errors via Edit/Delete actions.

**Status:** Strategic Pivot Implementation Complete. Next focus will be on AI Confidence flagging and manual review optimization.

## [2026-05-13] Cloud Staging & CI/CD Stabilization
- **Infrastructure**: Provisioned isolated Cloud Staging environment in GCP (`statsvision-477017`) using `-test` suffix for Pub/Sub and services.
- **CI/CD**: Fixed `ci.yml` and `deploy.yml` for monorepo structure. Added `workflow_dispatch` for manual control.
- **Authentication**: Hardened cloud environments by disabling mock authentication (`USE_MOCK_AUTH=false`) in `deploy.yml` and Vercel settings.
- **Frontend Refactor**:
    - Implemented stateful mock authentication in `UserProviderWrapper` using `sessionStorage`, fixing the "logout does nothing" bug.
    - Resolved `useContext` and `useState` build-time errors by isolating client-side providers to mount-only execution, bypassing Next.js static prerendering for special pages (e.g., `_global-error`, `_not-found`).
- **Vercel & Auth0 Sync**:
    - Verified stable deployment alias: `https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`.
    - Updated Auth0 "Allowed Callback URLs", "Logout URLs", and "Origins" via Auth0 CLI.
    - Synced all `NEXT_PUBLIC_AUTH0_*` and `NEXT_PUBLIC_BASE_URL` variables across Vercel Production and Preview environments.
- **Project Mandate**: Formalized "Test-First Alpha Workflow" in `GEMINI.md`, prioritizing the `test` branch for all active development and deployments.
- **Monorepo**: Successfully stabilized `@statvision/common` as the backend source of truth.
- **Frontend**: Achieved 100% green CI run by resolving 20+ TypeScript and Linting errors (conditional hooks, type mismatches, build-time auth hydration).
- **Permissions**: Fixed GCP service account permissions for Artifact Registry and Cloud Run.
- **Deployment**: Verified successful Docker build and push logic after resolving IAM permission gaps.
- **Build Optimization**: Resolved `android/arm64` build failure in `test` branch by forcing Webpack (`--webpack`) in `scripts/build-all.sh`, bypassing Turbopack incompatibilities.
- **Staging Verification**: Successfully deployed `test` branch to Vercel and Cloud Run; verified end-to-end connectivity.


## [2026-05-08] Sprint 1 Planning | Code Consolidation & Strategic Foundation
- **Attendees:** PO, SM, Dev Team, DevOps.
- **Decision:** Consolidate duplicated services (`TeamService`, `PlayerService`, `GameStatsService`) from `api` and `worker` into `common` to eliminate technical debt.
- **Decision:** Standardize the Gemini Analysis providers to use a single, shared infrastructure abstraction.
- **Sprint Goal:** Establish a clean, shared service layer and prepare for Multi-Tenancy / Temporal Roster implementation.
- **Status:** Sprint Completed. Logic consolidated into `@statvision/common`. Backend builds passing.

## [2026-05-15] Real-Time Infrastructure Design
- **Decision:** Selected Socket.io for API-to-Frontend real-time communication.
- **Decision:** Leveraged existing GCP Pub/Sub for Worker-to-API progress propagation.
- **Documentation:** Created [docs/specifications/REALTIME_PROGRESS_SPEC.md](docs/specifications/REALTIME_PROGRESS_SPEC.md).
- **Planning:** Added Task **[DEV-105]** to `next_sprint.md` for implementation.

## [2026-05-15] Real-Time Progress Implementation Complete
- **Database**: Added `progress`, `current_phase`, and `total_chunks` to `worker_video_analysis_jobs`.
- **Worker**: Enhanced `ProgressManager` to persist state to DB and publish to Pub/Sub topic `job-progress`.
- **API**: Initialized Socket.io server and implemented `ProgressSubscriberService` to forward Pub/Sub updates to clients.
- **Frontend**: Created `useJobProgress` hook and `JobProgressBar` component for live UI updates.
- **Status**: DEV-105 Completed. Ready for QA.
