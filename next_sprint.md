# Next Sprint: Code Consolidation & Strategic Foundation

**Sprint Goal:** Eliminate duplication by moving shared services to `common` and standardizing the AI analysis provider.

## Tasks
- [x] **[DEV-101]** Move `TeamService`, `PlayerService`, and `GameStatsService` to `common/src/core/services`.
- [x] **[DEV-102]** Consolidate `GeminiAnalysisService`, `GeminiProvider`, and `GeminiInteractionsProvider` into a single shared `GeminiProvider` in `common/src/infrastructure`.
- [x] **[DEV-103]** Update `api` and `worker` to import from `@statvision/common` for shared services.
- [x] **[DEV-104]** Verify builds and ensure no regressions in team/player management.
- [ ] **[PO-101]** Refine User Stories for "Temporal Roster Management" based on the new shared service structure.
- [x] **[DEV-105]** Implement Real-time Worker Progress Updates (Ref: [[REALTIME_PROGRESS_SPEC]])
    - [x] Update `VideoAnalysisJob` entity and database schema.
    - [x] Enhance `ProgressManager` to publish to `job-progress` topic.
    - [x] Implement Socket.io server and Pub/Sub forwarder in the API.
    - [x] Build `JobProgressBar` component in the frontend.
