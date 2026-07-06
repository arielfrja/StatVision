# StatVision Architectural Failure Analysis

## 🏗 Project Architecture Overview
StatVision utilizes a **Decoupled Event-Driven Modular Monolith** architecture. Communication is orchestrated via:
- **REST (HTTP):** For synchronous frontend-to-API and internal local development triggers.
- **Google Cloud Tasks:** For production asynchronous orchestration and sequential worker chains.
- **Shared Database (TypeORM/PostgreSQL):** Central state management across all services.
- **GCS & Gemini File API:** Shared storage for large binary video data and AI session state.

---

## ⚠️ Potential Failure Points & Architectural Risks

### 1. Sequential Chain Fragility (The "Stuck Chain" Risk)
- **Mechanism:** Chunk $N$ triggers Chunk $N+1$ via a POST request (Cloud Task).
- **Failure Scenario:** A worker crash or network failure during the "handover" stops the entire analysis.
- **Impact:** Analysis stops mid-way; job remains "ANALYZING" indefinitely.
- **Recommendation:** Implement a background watchdog service in the API to detect stale jobs.

### 2. Disk Space Pressure (Cloud Run Ephemeral Storage)
- **Mechanism:** Full video downloads to `/tmp/statvision/{jobId}` for analysis.
- **Failure Scenario:** Large videos (>500MB) or concurrent jobs can exceed the container's memory/disk limit (Cloud Run uses memory for `/tmp`).
- **Impact:** `ENOSPC` errors and worker crashes.
- **Recommendation:** Increase Cloud Run memory/disk allocation and strictly use `VIRTUAL` chunking.

### 3. Database Connection Saturation
- **Mechanism:** High-frequency updates during chunk completion and event merging.
- **Failure Scenario:** Connection pool exhaustion during high concurrency.
- **Impact:** `QueryFailedError` and failed worker tasks.
- **Recommendation:** Optimize connection pooling and use lightweight queries for status updates.

### 4. Gemini Rate Limiting (429 Errors)
- **Mechanism:** Sequential processing blocks the entire job on a single retryable error.
- **Failure Scenario:** 429 errors from Google AI SDK.
- **Impact:** Significant delays in processing.
- **Recommendation:** Implement robust exponential backoff within the application layer, separate from Cloud Task retries.

### 5. "Zero-Leaked-Assets" Race Condition
- **Mechanism:** `JobFinalizerService` deletes GCS video once the job is marked terminal.
- **Failure Scenario:** A delayed chunk attempt occurs after the finalizer has already purged the source video.
- **Impact:** Permanent failure of late-arriving or retried chunks.
- **Recommendation:** Add a safety delay or a "cleanup-pending" state before final deletion.

### 6. Sub-Repository Access Breach (Encapsulation Failure)
- **Problem:** `VideoAnalysisResultService.ts` uses bracket notation (`this.playerRepository['playerBaseRepository']`) to access underlying TypeORM repositories that should be private.
- **Impact:** Brittle code that depends on the internal implementation of the `@statvision/common` library.
- **Result:** High risk of runtime crashes if the library structure changes or when running in strict environments.

### 7. Redundant & Conflicting Persistence (Double-Save Risk)
- **Problem:** Both `JobFinalizerService` and `VideoAnalysisResultService` are called by the `ChunkProcessorWorker`. Both have logic to save `GameEvent` records.
- **Impact:** `handleChunkResult` saves "DRAFT" events, and then `finalizeJob` might attempt to merge and save them again.
- **Result:** Duplicate records in the `game_events` table for the same game actions.

### 8. The "Placeholder Paradox" (Mapping vs. Temp Creation)
- **Clarification:** You are correct that the system *intends* to map AI data to `isTemp` players and teams. The code in `VideoAnalysisResultService` is designed to create these records.
- **The Bug:** Because `EventProcessorService` converts the string `"TEMP_TEAM_1"` into a UUID (e.g., `550e8400...`) before it reaches the mapping logic, the system **loses the context** that this UUID represents "Team 1".
- **Impact:** 
    - The mapping logic: `if (teamId === 'TEMP_TEAM_1') { teamId = game.homeTeamId; }` **never runs** because `teamId` is no longer `"TEMP_TEAM_1"`.
    - Instead, it falls through and creates a **new Temp Team** even if you already assigned an official Home Team to the game.
- **Result:** You get "Temp" data as you expected, but you **don't** get the mapping to your *existing* saved teams/players that you assigned during setup.

---

## 🛠 Proposed Resolution Strategy

To resolve these failures while preserving the **Draft -> Manual Mapping** workflow, I propose the following implementation plan:

### 1. Delay ID Conversion (Fix Mapping Paradox)
- **Change:** Modify `EventProcessorService` to stop converting `TEMP_` strings into UUIDs. It should pass the raw AI placeholders (`TEMP_TEAM_1`, `TEMP_PLAYER_2`) directly to the result service.
- **Why:** This allows `VideoAnalysisResultService` to recognize "Team 1" and successfully map it to your official `home_team_id` before any UUIDs are generated.

### 2. Deterministic Event IDs (Prevent Duplicates)
- **Change:** Generate a unique `id` for every event *before* saving (e.g., `hash(gameId + timestamp + type + actorId)`).
- **Why:** If a worker task retries, the system will see the same ID and "upsert" (update) the record instead of creating a duplicate. This makes the "Live Feed" 100% idempotent.

### 3. Full Context Persistence (Fix `onCourtPlayerIds`)
- **Change:** 
    1. Update `EventProcessorService` to include the `onCourtPlayerIds` array in its output.
    2. Update `VideoAnalysisResultService` to loop through this array and resolve each ID.
    3. Ensure `GameEvent` persistence includes this field in both "Live" and "Final" phases.
- **Why:** Ensures "Lineup" and "Plus/Minus" data is preserved from the moment of AI detection.

### 4. Consolidate Persistence Logic
- **Change:** Move all `GameEvent` database logic into `VideoAnalysisResultService`. 
- **Why:** `JobFinalizer` should simply trigger the final "Merge & Stats" logic rather than re-implementing the event mapping. This eliminates the "Double-Save" risk and makes the system easier to maintain.

### 5. Add a "Watchdog" Task
- **Change:** Create a periodic Cloud Function or API task that searches for jobs stuck in `ANALYZING` for more than 30 minutes.
- **Why:** Automatically resumes "Stuck Chains" caused by worker crashes or network timeouts without requiring a full manual restart.

---

## 🔍 Data Flow Verification (Mismatches & Inconsistencies)

### 1. The `onCourtPlayerIds` UUID Leak (Critical)
- **Problem:** `EventProcessorService.ts` successfully converts `assignedPlayerId` and `assignedTeamId` to UUIDs, but **ignores** the `onCourtPlayerIds` array.
- **Impact:** The database stores official UUIDs for the main actors, but the "supporting cast" (on-court players) are stored as raw AI strings (e.g., `["TEMP_PLAYER_1"]`).
- **Result:** Downstream analytics (Plus/Minus, Lineup Analysis) will fail to link these players to the roster.

### 2. Early Conversion Blocks Official Mapping (Logic Bug)
- **Workflow Conflict:** The user expects a "Draft Result" that can be mapped to official teams.
- **Bug:** `EventProcessorService` converts `TEMP_TEAM_1` into a deterministic UUID *before* it reaches the `resolvePlayerIds` service.
- **Impact:** `resolvePlayerIds` looks for the literal string `TEMP_TEAM_1` to link it to the game's `home_team_id`. Since it now sees a UUID, it skips the link and creates a **redundant Temp Team** record instead.
- **Result:** Even if the user pre-assigned teams to a game, the AI events will point to new "Temp" records instead of the official ones.

### 3. Non-Idempotent Live Stream (Duplicate Draft Events)
- **Problem:** `VideoAnalysisResultService` uses `batchInsert` for draft events during live chunk processing.
- **Impact:** If a worker crashes after saving events but before marking a chunk as `COMPLETED`, the retry will insert the **exact same events again**.
- **Result:** Multiple duplicate "DRAFT" events in the UI for the same game action.

### 4. Brittle UUID Validation in `JobFinalizer`
- **Problem:** `JobFinalizerService.ts` explicitly rejects any ID starting with `TEMP_` before saving.
- **Impact:** If `EventProcessor` fails to map a player, the Finalizer silently sets the field to `NULL`.
- **Result:** Silent data loss instead of preserving the "TEMP" string for user mapping.

### 5. Systematic Omission in Live Results
- **Problem:** `VideoAnalysisResultService` (handling live updates) **omits** the `onCourtPlayerIds` field entirely during its manual mapping to the `GameEvent` entity.
- **Impact:** During "Analyzing" phase, the user sees no on-court data. The data only appears *after* the entire job is finalized (and even then, it's malformed as raw strings).
- **Result:** Inconsistent data view between "Live" and "Final" states.
