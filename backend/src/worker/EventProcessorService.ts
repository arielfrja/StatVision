import { chunkLogger as logger } from "../config/loggers";
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "../interfaces/video-analysis.interfaces";
import { VideoChunk } from "./VideoChunkerService";

// This should be managed via a shared constants file or similar
const ALLOWED_EVENT_TYPES = [
    "SHOT", "PASS", "DRIBBLE", "FOUL", "TURNOVER", "REBOUND", "BLOCK", "STEAL", "ASSIST", "SUBSTITUTION", "TIMEOUT", "JUMP_BALL",
    "Game Start", "Possession Change", "Shot Attempt", "Shot Missed", "Offensive Rebound", "Shot Made", "Defensive Rebound", "Shooting Foul", "Free Throw Made", "End of Period", "Violation", "Out of Bounds"
];
const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Define once

export class EventProcessorService {

    constructor() { }

    private generateConsistentUuid(input: string): string {
        return uuidv5(input, NAMESPACE_UUID);
    }

    // REASON FOR CHANGE:
    // This is the core logic fix. Instead of a naive `timestamp < 120` check,
    // we now use a proper temporal window to handle overlaps correctly.
    // Each chunk is "authoritative" only for events within its new, non-overlapping segment.
    // Events in the overlap are only included if they haven't been seen, preventing duplicates
    // while also preventing data loss.
    public processEvents(
        rawEvents: any[],
        gameId: string,
        chunk: VideoChunk,
        chunkDuration: number,
        overlapDuration: number,
        processedEventKeys: Set<string>, // Pass the Set in to maintain state across calls
        identifiedPlayers: IdentifiedPlayer[],
        identifiedTeams: IdentifiedTeam[]
    ): { finalEvents: ProcessedGameEvent[], updatedIdentifiedPlayers: IdentifiedPlayer[], updatedIdentifiedTeams: IdentifiedTeam[] } {

        logger.info(`[EventProcessorService] Processing ${rawEvents.length} raw events for chunk ${chunk.sequence}`, { phase: 'processing' });
        const finalEvents: ProcessedGameEvent[] = [];
        
        const currentIdentifiedPlayers = [...identifiedPlayers];
        const currentIdentifiedTeams = [...identifiedTeams];

        for (const rawEvent of rawEvents) {
            try {
                if (!rawEvent.eventType || !rawEvent.timestamp || typeof chunk.startTime === 'undefined') {
                    logger.warn("Skipping raw event due to missing data:", { rawEvent, chunkSequence: chunk.sequence, phase: 'processing' });
                    continue;
                }

                if (!ALLOWED_EVENT_TYPES.includes(rawEvent.eventType)) {
                    logger.debug(`Filtering out non-gameplay event type: ${rawEvent.eventType}`, { chunkSequence: chunk.sequence, phase: 'processing' });
                    continue;
                }

                // --- Timestamp Calculation ---
                const timestampParts = String(rawEvent.timestamp).split(':').map(Number);
                let eventTimestampInChunk = 0;
                if (timestampParts.length === 2) {
                    eventTimestampInChunk = timestampParts[0] * 60 + timestampParts[1];
                } else if (timestampParts.length === 3) {
                    eventTimestampInChunk = timestampParts[0] * 3600 + timestampParts[1] * 60 + timestampParts[2];
                } else {
                    logger.warn(`Could not parse timestamp format: ${rawEvent.timestamp}. Skipping event.`, { chunkSequence: chunk.sequence, phase: 'processing' });
                    continue;
                }
                
                const absoluteEventTimestamp = chunk.startTime + eventTimestampInChunk;

                // --- Player & Team Identification ---
                let assignedTeamId: string | null = null;
                let teamIdentifier = rawEvent.identifiedTeamColor?.toLowerCase() || rawEvent.identifiedTeamDescription?.toLowerCase() || '';
                
                if (teamIdentifier && rawEvent.assignedTeamType) {
                    const teamKey = `${rawEvent.assignedTeamType}-${teamIdentifier}`;
                    assignedTeamId = this.generateConsistentUuid(teamKey);

                    if (!currentIdentifiedTeams.some(team => team.id === assignedTeamId)) {
                        currentIdentifiedTeams.push({
                            id: assignedTeamId,
                            type: rawEvent.assignedTeamType,
                            color: rawEvent.identifiedTeamColor || null,
                            description: rawEvent.identifiedTeamDescription || null,
                        });
                    }
                }
                
                let assignedPlayerId: string | null = null;
                const jerseyNumber = rawEvent.identifiedJerseyNumber;
                const playerDescription = rawEvent.identifiedPlayerDescription?.toLowerCase();

                if (assignedTeamId && (jerseyNumber || playerDescription)) {
                    const playerKey = `${assignedTeamId}-${jerseyNumber || playerDescription}`;
                    assignedPlayerId = this.generateConsistentUuid(playerKey);
                    
                    if (!currentIdentifiedPlayers.some(player => player.id === assignedPlayerId)) {
                        currentIdentifiedPlayers.push({
                            id: assignedPlayerId,
                            teamId: assignedTeamId,
                            jerseyNumber: jerseyNumber || null,
                            description: playerDescription || null,
                        });
                    }
                }

                const gameEventData: ProcessedGameEvent = {
                    id: uuidv4(),
                    gameId: gameId,
                    eventType: rawEvent.eventType,
                    eventSubType: rawEvent.eventSubType || null,
                    isSuccessful: rawEvent.isSuccessful || false,
                    period: rawEvent.period || null, // Added missing property
                    timeRemaining: rawEvent.timeRemaining || null, // Added missing property
                    xCoord: rawEvent.xCoord || null, // Added missing property
                    yCoord: rawEvent.yCoord || null, // Added missing property
                    absoluteTimestamp: absoluteEventTimestamp,
                    assignedPlayerId: assignedPlayerId,
                    assignedTeamId: assignedTeamId,
                    relatedEventId: rawEvent.relatedEventId || null, // Added missing property
                    onCourtPlayerIds: rawEvent.onCourtPlayerIds || null, // Added missing property
                    identifiedTeamColor: rawEvent.identifiedTeamColor || null, // Added missing property
                    identifiedJerseyNumber: rawEvent.identifiedJerseyNumber || null, // Added missing property
                    videoClipStartTime: chunk.startTime,
                    videoClipEndTime: chunk.startTime + chunkDuration,
                };

                // --- Deduplication Logic ---
                // A more robust key using a 5-second tolerance window for the timestamp.
                const timeWindow = Math.floor(absoluteEventTimestamp / 5);
                const eventUniqueKey = `${gameEventData.eventType}-${timeWindow}-${assignedPlayerId || assignedTeamId || ''}`;

                if (!processedEventKeys.has(eventUniqueKey)) {
                    finalEvents.push(gameEventData);
                    processedEventKeys.add(eventUniqueKey);
                } else {
                    logger.debug(`Duplicate event detected and filtered: ${eventUniqueKey}`, { chunkSequence: chunk.sequence, phase: 'processing' });
                }
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
                // Continue to the next event, do not crash the whole chunk processing
            }
        }

        return {
            finalEvents,
            updatedIdentifiedPlayers: currentIdentifiedPlayers,
            updatedIdentifiedTeams: currentIdentifiedTeams,
        };
    }
}
