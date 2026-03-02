# StatVision Workflow Evaluation & Refinement

## 1. Current Workflow Critique
The current workflow is "Good Enough" for a prototype but has significant architectural risks and user experience (UX) friction.

### Strengths
*   **Decoupled:** The use of Pub/Sub and Workers is appropriate for long-running video tasks.
*   **Stateful Identification:** The "Temporary ID" strategy for players/teams is a clever way to handle entity consistency across chunks.

### Weaknesses (Critical Issues)
*   **The "Guessing" Problem:** The AI starts with zero context. It has to "guess" who teams are. This leads to a high manual "Assignment" effort for the user later.
*   **Race Conditions:** In `PARALLEL` mode, multiple chunks updating the same `VideoAnalysisJob` record will cause data loss (last-write-wins).
*   **Brittle Deduplication:** The 5-second window for event deduplication is arbitrary and will fail for fast-paced sequences or long-duration events.
*   **"All-or-Nothing" Completion:** The user waits for the entire game to finish before seeing any value.

---

## 2. Proposed Refined Workflow: "Context-Aware Analysis"

I propose a shift from **Blind Analysis** to **Context-Aware Analysis**.

### Phase 0: Metadata Injection (Pre-Analysis)
*   **User Action:** Before uploading, the user selects the two teams and provides basic "Visual Identifiers" (Jersey colors, Key player numbers).
*   **Architectural Change:** This metadata is saved to the `Game` record.
*   **Benefit:** The Gemini prompt is injected with: *"You are watching a game between Team A (Red) and Team B (Blue). Team A has players #10, #12, #30..."*. This makes the AI significantly more accurate and reduces the "Assignment" phase to a simple "Verification".

### Phase 1: Chunk-Result Persistence (Fixing Race Conditions)
*   **Architectural Change:** Chunks should **not** update the `VideoAnalysisJob` record directly.
*   **New Flow:**
    1.  `ChunkProcessorWorker` analyzes video.
    2.  `ChunkProcessorWorker` writes events to a temporary `ChunkEvent` table (associated with that specific chunk).
    3.  `JobFinalizerService` runs once all chunks are done. It performs a **single, transactional deduplication** and merges results into the main `GameEvent` table.

### Phase 2: Live Event Stream
*   **UX Change:** As chunks finish, their events are visible in a "Draft" state on the dashboard.
*   **Benefit:** Users see progress immediately.

### Phase 3: The "Review & Verify" Interface
*   **UX Change:** Replace "Assignment Modal" with a "Timeline Editor".
*   **Functionality:** Users see the events on a timeline synced with the video. They can quickly confirm AI hits, delete misses, and fix "Temporary" players that the AI couldn't match.

---

## 3. Implementation Roadmap
1.  **Refactor Worker Data Flow:** Move from `Job` updates to `ChunkResult` persistence.
2.  **Enhance Prompt Engineering:** Implement the Context-Injection logic.
3.  **Frontend Update:** Create a "Game Setup" wizard to collect metadata before upload.
4.  **Deduplication 2.0:** Implement a more robust "Authoritative Window" strategy for overlapping chunks.
