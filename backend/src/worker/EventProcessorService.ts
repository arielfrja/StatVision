import { chunkLogger as logger } from "../config/loggers";
import { randomUUID, createHash } from 'crypto';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "../core/interfaces/video-analysis.interfaces";
import { VideoChunk } from "./VideoChunkerService";
import { GameType, IdentityMode } from "../core/entities/Game";

// This should be managed via a shared constants file or similar
const ALLOWED_EVENT_TYPES = [
    "SHOT", "PASS", "DRIBBLE", "FOUL", "TURNOVER", "REBOUND", "BLOCK", "STEAL", "ASSIST", "SUBSTITUTION", "TIMEOUT", "JUMP_BALL",
    "Game Start", "Possession Change", "Shot Attempt", "Shot Missed", "Offensive Rebound", "Shot Made", "Defensive Rebound", "Shooting Foul", "Free Throw Made", "End of Period", "Violation", "Out of Bounds"
];
// Create a Set of uppercase event types for efficient, case-insensitive lookups.
const UPPERCASE_ALLOWED_EVENT_TYPES = new Set(ALLOWED_EVENT_TYPES.map(t => t.toUpperCase()));

export class EventProcessorService {

    constructor() { }

    private generateConsistentUuid(input: string): string {
        const hash = createHash('sha256').update(input).digest('hex');
        // Convert hash to a UUID-like string (8-4-4-4-12 format)
        // This isn't a strict UUID but serves the same purpose of deterministic ID
        return [
            hash.substring(0, 8),
            hash.substring(8, 12),
            hash.substring(12, 16),
            hash.substring(16, 20),
            hash.substring(20, 32)
        ].join('-');
    }

    // Implement Authoritative Window logic for robust deduplication across overlapping chunks.
    // Each chunk is only authoritative for events starting within its unique segment.
    // Segment = [0, chunkDuration - overlapDuration).
    // EXCEPT for the last chunk, which is authoritative for [0, chunkDuration].
    public processEvents(
        rawEvents: any[],
        gameId: string,
        chunk: VideoChunk,
        chunkDuration: number,
        overlapDuration: number,
        processedEventKeys: Set<string>, // Not used anymore with Authoritative Window logic, but kept for interface compatibility
        identifiedPlayers: IdentifiedPlayer[],
        identifiedTeams: IdentifiedTeam[],
        gameType: GameType = GameType.FULL_COURT,
        identityMode: IdentityMode = IdentityMode.JERSEY_COLORS
    ): { finalEvents: ProcessedGameEvent[], updatedIdentifiedPlayers: IdentifiedPlayer[], updatedIdentifiedTeams: IdentifiedTeam[] } {

        logger.info(`[EventProcessorService] Processing ${rawEvents.length} raw events for chunk ${chunk.sequence}`, { phase: 'processing', gameType, identityMode });
        
        const finalEvents: ProcessedGameEvent[] = [];
        const currentIdentifiedPlayers = [...identifiedPlayers];
        const currentIdentifiedTeams = [...identifiedTeams];
        const tempIdToUuidMap = new Map<string, string>();
        const TEMP_TEAM_PREFIX = 'TEMP_TEAM_';
        const TEMP_PLAYER_PREFIX = 'TEMP_PLAYER_';

        // Authoritative Window logic
        const segmentStart = 0;
        const totalChunks = chunk.totalChunks || 0;
        const segmentEnd = chunk.sequence === totalChunks - 1 ? chunkDuration : (chunkDuration - overlapDuration);
        
        logger.info(`[EventProcessorService] Authoritative Window for chunk ${chunk.sequence}: [${segmentStart}, ${segmentEnd})s within chunk.`, { phase: 'processing' });

        // First pass: Process teams and create permanent IDs for new ones
        for (const rawEvent of rawEvents) {
            const teamId = rawEvent.assignedTeamId;
            if (teamId && typeof teamId === 'string' && teamId.startsWith(TEMP_TEAM_PREFIX)) {
                if (!tempIdToUuidMap.has(teamId)) {
                    const permanentTeamId = this.generateConsistentUuid(teamId);
                    tempIdToUuidMap.set(teamId, permanentTeamId);
                    
                    if (!currentIdentifiedTeams.some(team => team.id === permanentTeamId)) {
                        currentIdentifiedTeams.push({
                            id: permanentTeamId,
                            type: rawEvent.assignedTeamType || null,
                            color: rawEvent.identifiedTeamColor || null,
                            description: rawEvent.identifiedTeamDescription || null,
                        });
                        logger.info(`[EventProcessorService] New team identified and added: ${teamId} -> ${permanentTeamId}`, { phase: 'processing' });
                    }
                }
            }
        }
        
        // Second pass: Process players and create permanent IDs
        for (const rawEvent of rawEvents) {
            let currentTeamId = rawEvent.assignedTeamId;
            // Map to permanent ID if we have one
            if (currentTeamId && tempIdToUuidMap.has(currentTeamId)) {
                currentTeamId = tempIdToUuidMap.get(currentTeamId);
            }
            
            const playerId = rawEvent.assignedPlayerId;
            if (playerId && typeof playerId === 'string' && playerId.startsWith(TEMP_PLAYER_PREFIX)) {
                if (!tempIdToUuidMap.has(playerId)) {
                    const permanentPlayerId = this.generateConsistentUuid(playerId);
                    tempIdToUuidMap.set(playerId, permanentPlayerId);

                    if (!currentIdentifiedPlayers.some(player => player.id === permanentPlayerId)) {
                        currentIdentifiedPlayers.push({
                            id: permanentPlayerId,
                            teamId: currentTeamId || null, // Use permanent team ID if available
                            jerseyNumber: rawEvent.identifiedJerseyNumber ? Number(rawEvent.identifiedJerseyNumber) : null,
                            description: rawEvent.identifiedPlayerDescription || null,
                        });
                         logger.info(`[EventProcessorService] New player identified and added: ${playerId} -> ${permanentPlayerId}`, { phase: 'processing' });
                    }
                }
            }
        }


        // Final pass: Create event objects with permanent IDs
        for (const rawEvent of rawEvents) {
            try {
                if (!rawEvent.eventType || !rawEvent.timestamp || typeof chunk.startTime === 'undefined') {
                    logger.warn("Skipping raw event due to missing data:", { rawEvent, chunkSequence: chunk.sequence, phase: 'processing' });
                    continue;
                }

                const timestampParts = String(rawEvent.timestamp).split(':').map(Number);
                let eventTimestampInChunk = 0;
                if (timestampParts.length === 2) { // MM:SS
                    eventTimestampInChunk = timestampParts[0] * 60 + timestampParts[1];
                } else if (timestampParts.length === 3) { // HH:MM:SS
                    eventTimestampInChunk = timestampParts[0] * 3600 + timestampParts[1] * 60 + timestampParts[2];
                } else {
                    logger.warn(`Could not parse timestamp format: ${rawEvent.timestamp}. Skipping event.`, { chunkSequence: chunk.sequence, phase: 'processing' });
                    continue;
                }
                const absoluteEventTimestamp = chunk.startTime + eventTimestampInChunk;
                
                // Authoritative Window filtering
                if (eventTimestampInChunk >= segmentEnd) {
                    logger.debug(`Event at ${eventTimestampInChunk}s is outside authoritative window [0, ${segmentEnd})s for chunk ${chunk.sequence}. Skipping.`, { phase: 'processing' });
                    continue;
                }

                const finalAssignedTeamId = rawEvent.assignedTeamId && tempIdToUuidMap.get(rawEvent.assignedTeamId) || rawEvent.assignedTeamId;
                const finalAssignedPlayerId = rawEvent.assignedPlayerId && tempIdToUuidMap.get(rawEvent.assignedPlayerId) || rawEvent.assignedPlayerId;

                const gameEventData: ProcessedGameEvent = {
                    id: randomUUID(),
                    gameId: gameId,
                    eventType: rawEvent.eventType,
                    eventSubType: rawEvent.eventSubType || null,
                    isSuccessful: rawEvent.isSuccessful || false,
                    period: rawEvent.period || null,
                    timeRemaining: rawEvent.timeRemaining || null,
                    xCoord: rawEvent.xCoord || null,
                    yCoord: rawEvent.yCoord || null,
                    absoluteTimestamp: absoluteEventTimestamp,
                    assignedPlayerId: finalAssignedPlayerId,
                    assignedTeamId: finalAssignedTeamId,
                    relatedEventId: rawEvent.relatedEventId || null,
                    onCourtPlayerIds: rawEvent.onCourtPlayerIds || null,
                    identifiedTeamColor: rawEvent.identifiedTeamColor || null,
                    identifiedJerseyNumber: rawEvent.identifiedJerseyNumber || null,
                    videoClipStartTime: chunk.startTime,
                    videoClipEndTime: chunk.startTime + chunkDuration,
                };

                finalEvents.push(gameEventData);

            } catch (error: any) {
                logger.error(`[EventProcessorService] Unexpected error processing a raw event for chunk ${chunk.sequence}.`, {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        rawEvent: rawEvent,
                        chunkSequence: chunk.sequence,
                        gameId: gameId,
                    },
                    phase: 'processing'
                });
            }
        }

        return {
            finalEvents,
            updatedIdentifiedPlayers: currentIdentifiedPlayers,
            updatedIdentifiedTeams: currentIdentifiedTeams,
        };
    }
}
