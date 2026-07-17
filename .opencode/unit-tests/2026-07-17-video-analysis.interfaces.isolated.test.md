# Unit Test Record: video-analysis.interfaces.isolated.test.ts

## Target File
`common/src/core/interfaces/video-analysis.interfaces.ts`

## Test Description
Isolated unit tests for `ProcessedGameEvent` interface verifying optional `actorCertainty` and `eventTypeCertainty` fields are properly typed and accepted.

## Test Code (Preserved)
File: `common/src/core/interfaces/__tests__/video-analysis.interfaces.isolated.test.ts` (deleted after pass)

## Tests Run
1. **should allow creating a minimal ProcessedGameEvent with required fields** - PASS
   - Verifies that certainty fields are `undefined` when not provided
2. **should allow setting actorCertainty and eventTypeCertainty fields** - PASS
   - Verifies setting certainty to 0.95 and 0.85
3. **should allow setting certainty fields to edge values (0.0 and 1.0)** - PASS
   - Verifies edge values 0.0 and 1.0 are accepted

## Test Result
- **Status**: pass (3/3 tests passed)
- **Timestamp**: 2026-07-17T09:04:00Z
