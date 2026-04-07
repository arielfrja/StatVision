import { EventProcessorService } from "../worker/EventProcessorService";
import { GameType, IdentityMode } from "../core/entities/Game";

describe('EventProcessorService', () => {
    let service: EventProcessorService;

    beforeEach(() => {
        service = new EventProcessorService();
    });

    it('should generate consistent UUIDs for temp IDs', () => {
        const rawEvents = [
            { eventType: 'SHOT', timestamp: '00:10', assignedTeamId: 'TEMP_TEAM_RED', assignedPlayerId: 'TEMP_PLAYER_23' }
        ];
        const chunk = { sequence: 0, startTime: 0, chunkPath: 'test.mp4', totalChunks: 1 };
        
        const result = service.processEvents(rawEvents, 'game-123', chunk as any, 120, 10, new Set(), [], []);
        
        expect(result.updatedIdentifiedTeams).toHaveLength(1);
        expect(result.updatedIdentifiedPlayers).toHaveLength(1);
        
        const teamUuid = result.updatedIdentifiedTeams[0].id;
        const playerUuid = result.updatedIdentifiedPlayers[0].id;
        
        // Running it again should yield the same UUIDs
        const result2 = service.processEvents(rawEvents, 'game-123', chunk as any, 120, 10, new Set(), [], []);
        expect(result2.updatedIdentifiedTeams[0].id).toBe(teamUuid);
        expect(result2.updatedIdentifiedPlayers[0].id).toBe(playerUuid);
    });

    it('should filter events based on authoritative window', () => {
        const rawEvents = [
            { eventType: 'SHOT', timestamp: '00:10' }, // In window [0, 110)
            { eventType: 'PASS', timestamp: '01:55' }  // Out of window (chunk is 120s, overlap is 10s)
        ];
        const chunk = { sequence: 0, startTime: 0, chunkPath: 'test.mp4', totalChunks: 2 };
        
        const result = service.processEvents(rawEvents, 'game-123', chunk as any, 120, 10, new Set(), [], []);
        
        expect(result.finalEvents).toHaveLength(1);
        expect(result.finalEvents[0].eventType).toBe('SHOT');
    });

    it('should capture metadata for teams and players', () => {
        const rawEvents = [
            { 
                eventType: 'SHOT', 
                timestamp: '00:10', 
                assignedTeamId: 'TEMP_TEAM_RED', 
                identifiedTeamColor: 'RED',
                assignedTeamType: 'HOME',
                assignedPlayerId: 'TEMP_PLAYER_23',
                identifiedJerseyNumber: 23,
                identifiedPlayerDescription: 'tall player'
            }
        ];
        const chunk = { sequence: 0, startTime: 0, chunkPath: 'test.mp4', totalChunks: 1 };
        
        const result = service.processEvents(rawEvents, 'game-123', chunk as any, 120, 10, new Set(), [], []);
        
        expect(result.updatedIdentifiedTeams[0].color).toBe('RED');
        expect(result.updatedIdentifiedTeams[0].type).toBe('HOME');
        expect(result.updatedIdentifiedPlayers[0].jerseyNumber).toBe(23);
        expect(result.updatedIdentifiedPlayers[0].description).toBe('tall player');
    });
});
