# StatVision Exploration Findings

## 1. Project Structure (Top 2 Levels)

StatVision/
├── api/          # Express REST API (Node.js/TypeScript, TypeORM, PostgreSQL)
├── common/       # @statvision/common shared package
├── worker/       # Video analysis pipeline services
├── frontend/     # Next.js 15 frontend
├── docs/         # product/, technical/, wiki/
├── sandbox/      # Test scripts
├── scripts/      # Build/run scripts
├── storage/      # Local storage
├── supabase/     # Supabase config
└── (config files)

Tech: Node.js, Express, TypeORM, PostgreSQL (Supabase), Next.js 15, Tailwind, Google Cloud Run, Gemini AI, FFmpeg, Cloud Tasks, Pub/Sub.

## 2. Prompt Files (in common/src/infrastructure/prompts/)

All 5 prompt files found:
- system_instruction.md  - Main AI persona + event taxonomy + identity rules
- first_chunk.md         - First video segment: initialize rosters with TEMP_ IDs
- subsequent_chunk.md    - Later segments: maintain roster consistency
- rulesets.md            - Game type rules (FULL_COURT, 3x3, STREET_BALL, 1v1) + identity modes
- coach_report.md        - Post-game coaching report template

Loaded by: PromptLoader.ts | Called from: GeminiProvider.ts

## 3. Schema/Gemini Config Files

- common/src/constants/gemini.ts          -> EVENT_SCHEMA (structured output schema for Gemini)
- common/src/constants/eventTypes.ts      -> ALLOWED_EVENT_TYPES (37 types)
- common/src/core/entities/GameEvent.ts   -> TypeORM entity for game_events table
- common/src/core/interfaces/video-analysis.interfaces.ts -> IdentifiedTeam, IdentifiedPlayer, ProcessedGameEvent

## 4. Confidence/Certainty Status

NOT IMPLEMENTED in production code. Three references only:

1. IdentifiedPlayer.teamAssignmentConfidence?: number (interface only, never used)
2. Proposed confidence?: number in statVisionReview.md design doc (not coded)
3. "low-confidence detections" mention in wiki design rationale

The actor concept uses identifiedJerseyNumber (e.g. "Player #23").

## 5. Key Analysis Code Files

- common/src/infrastructure/GeminiProvider.ts   - Main AI integration
- common/src/infrastructure/PromptLoader.ts     - Prompt file loading
- worker/src/worker/ChunkProcessorWorker.ts     - Analysis orchestrator
- worker/src/worker/EventProcessorService.ts    - Event extraction/cleaning
- worker/src/service/VideoAnalysisResultService.ts - Result persistence
- worker/src/modules/games/GameAnalysisService.ts  - Worker game analysis
- api/src/modules/games/GameAnalysisService.ts     - API game analysis (coach reports)

## 6. No packages/ directory exists

Shared code is in common/ (published as @statvision/common).
