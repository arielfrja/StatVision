# Context - Certainty Levels for Play Events

## Current Status
- **Feature**: `playerCertainty` + `eventTypeCertainty` (0–1) on every play event
- **Migration**: ✅ Applied to Supabase — `player_certainty`, `event_type_certainty` columns exist
- **Worker fix**: ✅ `AppContainer.ts` now uses `MockEventBus` when `USE_MOCK_EVENT_BUS=true` (bypassed GCP PubSub ADC requirement)
- **Analysis test**: Ran on demo video — Gemini processed but returned 0 events (demo likely not basketball footage). Game ended FAILED.
- **All TS**: ✅ 3 packages compile zero errors
- **Build**: ✅ `next build --webpack` exit 0, 11 routes
- **Dev server**: ✅ HTTP 200 at localhost:3002

## Pending
1. Push to `test` branch — currently on `fix/usage-tracking-pricing`, need to commit → merge to test → push test
2. Give user Vercel preview link for test branch

## Files Changed
- `common/src/constants/gemini.ts` — EVENT_SCHEMA with certainty fields
- `common/src/infrastructure/prompts/system_instruction.md` — section 4 rubric
- `common/src/infrastructure/prompts/first_chunk.md` — output example
- `common/src/infrastructure/prompts/subsequent_chunk.md` — section 2.5
- `common/src/core/interfaces/video-analysis.interfaces.ts` — interface
- `common/src/core/entities/GameEvent.ts` — TypeORM columns
- `common/src/migration/1784270848000-AddCertaintyColumnsToGameEvent.ts` — DB migration
- `worker/src/worker/EventProcessorService.ts` — clamping logic
- `worker/src/service/VideoAnalysisResultService.ts` — explicit mapping
- `worker/src/shared/AppContainer.ts` — MockEventBus fix
- `frontend/next.config.ts` — turbopack config
- `AGENTS.md` — lightningcss note fix
