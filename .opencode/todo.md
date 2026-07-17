# Mission: Add Certainty Levels to Play Event Extraction

## M1: Update Schema & Prompts (Gemini-facing) | status: completed
### T1.1: Update EVENT_SCHEMA in gemini.ts | agent:Worker
- [x] S1.1.1: Add actorCertainty and eventTypeCertainty fields to EVENT_SCHEMA
### T1.2: Update system_instruction.md | agent:Worker
- [x] S1.2.1: Add section 4: CERTAINTY ASSESSMENT with instructions (fixed duplicate + numbering)
### T1.3: Update first_chunk.md | agent:Worker
- [x] S1.3.1: Add certainty fields to output format example
### T1.4: Update subsequent_chunk.md | agent:Worker
- [x] S1.4.1: Add note about certainty assessment (fixed duplicate)

## M2: Update TypeScript Interfaces & Entity | status: completed
### T2.1: Update ProcessedGameEvent interface | agent:Worker
- [x] S2.1.1: Add actorCertainty and eventTypeCertainty fields
### T2.2: Update GameEvent TypeORM entity | agent:Worker
- [x] S2.2.1: Add actor_certainty and event_type_certainty columns

## M3: Update Processing Pipeline | status: completed
### T3.1: Update EventProcessorService | agent:Worker
- [x] S3.1.1: Add explicit certainty field clamping (0-1)
### T3.2: Update VideoAnalysisResultService | agent:Worker
- [x] S3.2.1: Add certainty fields to destructuring exclusion and explicit mapping

## M4: Verify all changes | status: completed
- [x] S4.1.1: Verified all 8 modified files contain correct certainty fields
- [x] S4.1.2: All TypeScript syntax verified (naming, braces, commas, nullable handling)
- [x] S4.1.3: Consistency confirmed across all layers (schema → interface → entity → processing)

## M5: Database Migration | status: completed
### T5.1: Create TypeORM migration | agent:Worker
- [x] S5.1.1: Create migration file `1784270848000-AddCertaintyColumnsToGameEvent.ts`

## M6: Build & Dev Server Verification | status: completed
### T6.1: Production build | agent:Reviewer
- [x] S6.1.1: `npm run build` → exit code 0, 118s compile, 11 routes generated (7 static, 4 dynamic)
### T6.2: Dev server | agent:Reviewer
- [x] S6.2.1: `npm run dev` → HTTP 200 at localhost:3002, full page renders with certainty field changes compiled
