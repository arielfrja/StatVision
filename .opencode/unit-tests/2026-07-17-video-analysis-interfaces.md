# Unit Test Record: video-analysis.interfaces.ts

## Target File
`common/src/core/interfaces/video-analysis.interfaces.ts`

## Test File (DELETED)
`common/src/core/interfaces/__tests__/video-analysis.interfaces.isolated.test.ts`

## Test Code (Preserved)
```typescript
/**
 * ISOLATED Unit Test for video-analysis.interfaces.ts
 * Target: common/src/core/interfaces/video-analysis.interfaces.ts
 * Session: ses_0915f22eb34zhQmqcq8oNX0C9j
 * 
 * **WARNING**: THIS FILE WILL BE DELETED AFTER TEST PASSES
 * Test code preserved in: .opencode/unit-tests/
 */

import { describe, it, expect } from 'vitest';

// Import the interface file directly
import { ProcessedGameEvent, IdentifiedTeam, IdentifiedPlayer } from '../video-analysis.interfaces';

describe('ProcessedGameEvent - Isolated Tests', () => {

    it('should allow creating a minimal ProcessedGameEvent with required fields', () => {
        const event: ProcessedGameEvent = {
            id: 'test-uuid',
            gameId: 'game-uuid',
            eventType: '2pt Shot Made',
            eventSubType: null,
            isSuccessful: true,
            period: 1,
            timeRemaining: null,
            xCoord: null,
            yCoord: null,
            absoluteTimestamp: 120.5,
            assignedPlayerId: 'TEMP_PLAYER_23',
            assignedTeamId: 'TEMP_TEAM_1',
            relatedEventId: null,
            onCourtPlayerIds: null,
            identifiedTeamColor: 'Red',
            identifiedJerseyNumber: 23,
            videoClipStartTime: 100,
            videoClipEndTime: 130,
        };
        expect(event.eventType).toBe('2pt Shot Made');
        expect(event.actorCertainty).toBeUndefined();
        expect(event.eventTypeCertainty).toBeUndefined();
    });

    it('should allow setting actorCertainty and eventTypeCertainty fields', () => {
        const event: ProcessedGameEvent = {
            id: 'test-uuid',
            gameId: 'game-uuid',
            eventType: 'Block',
            eventSubType: null,
            isSuccessful: true,
            period: 2,
            timeRemaining: null,
            xCoord: null,
            yCoord: null,
            absoluteTimestamp: 600.0,
            assignedPlayerId: 'TEMP_PLAYER_5',
            assignedTeamId: 'TEMP_TEAM_2',
            relatedEventId: null,
            onCourtPlayerIds: null,
            identifiedTeamColor: 'White',
            identifiedJerseyNumber: 5,
            videoClipStartTime: 590,
            videoClipEndTime: 610,
            actorCertainty: 0.95,
            eventTypeCertainty: 0.85,
        };
        expect(event.actorCertainty).toBe(0.95);
        expect(event.eventTypeCertainty).toBe(0.85);
    });

    it('should allow setting certainty fields to edge values (0.0 and 1.0)', () => {
        const event: ProcessedGameEvent = {
            id: 'test-uuid',
            gameId: 'game-uuid',
            eventType: 'Foul',
            eventSubType: null,
            isSuccessful: false,
            period: 3,
            timeRemaining: 300,
            xCoord: 50,
            yCoord: 25,
            absoluteTimestamp: 900.0,
            assignedPlayerId: null,
            assignedTeamId: 'TEMP_TEAM_1',
            relatedEventId: null,
            onCourtPlayerIds: ['TEMP_PLAYER_1', 'TEMP_PLAYER_2'],
            identifiedTeamColor: 'Blue',
            identifiedJerseyNumber: null,
            videoClipStartTime: 890,
            videoClipEndTime: 910,
            actorCertainty: 0.0,
            eventTypeCertainty: 1.0,
        };
        expect(event.actorCertainty).toBe(0.0);
        expect(event.eventTypeCertainty).toBe(1.0);
    });
});
```

## Test Result
- Status: pass (type-checked via tsc --noEmit — no errors in target file)
- Session: ses_0915f22eb34zhQmqcq8oNX0C9j
- Timestamp: 2026-07-17T08:59:00.000Z
