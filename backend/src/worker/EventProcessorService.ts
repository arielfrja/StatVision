import logger from "../config/logger";
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "../interfaces/video-analysis.interfaces";
import { VideoChunk } from "./VideoChunkerService";

// This should be managed via a shared constants file or similar
const ALLOWED_EVENT_TYPES = [
    'Game Start', 'Period Start', 'Jump Ball', 'Jump Ball Possession', 'Possession Change',
    'Shot Attempt', 'Shot Made', 'Shot Missed', '3PT Shot Attempt', '3PT Shot Made', '3PT Shot Missed',
    'Free Throw Attempt', 'Free Throw Made', 'Free Throw Missed',
    'Offensive Rebound', 'Defensive Rebound', 'Team Rebound',
    'Assist', 'Steal', 'Block', 'Turnover',
    'Personal Foul', 'Shooting Foul', 'Offensive Foul', 'Technical Foul', 'Flagrant Foul',
    'Violation', 'Out of Bounds', 'Substitution', 'Timeout Taken',
    'End of Period', 'End of Game'
];

export class EventProcessorService {

    constructor() { }

    private generateConsistentUuid(input: string): string {
        // Use a namespace for consistency. This can be any valid UUID.
        // Using a fixed namespace ensures that the same input string always produces the same UUID.
        const NAMESPACE_URL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Example namespace for URL
        return uuidv5(input, NAMESPACE_URL);
    }

    public processEvents(rawEvents: any[], gameId: string, chunkDuration: number, identifiedPlayers: IdentifiedPlayer[], identifiedTeams: IdentifiedTeam[]): { finalEvents: ProcessedGameEvent[], updatedIdentifiedPlayers: IdentifiedPlayer[], updatedIdentifiedTeams: IdentifiedTeam[] } {

        logger.info("[EventProcessorService] Parsing and filtering raw events...");
        const finalEvents: ProcessedGameEvent[] = [];
        const processedEventKeys = new Set<string>(); // To track unique events based on a composite key

        // Create mutable copies for updates
        const currentIdentifiedPlayers = [...identifiedPlayers];
        const currentIdentifiedTeams = [...identifiedTeams];

        for (const rawEvent of rawEvents) {
            // Ensure rawEvent has necessary properties
            if (!rawEvent.eventType || !rawEvent.timestamp || !rawEvent.chunkMetadata || typeof rawEvent.chunkMetadata.startTime === 'undefined') {
                logger.warn("Skipping raw event due to missing eventType, timestamp, or chunk metadata:", rawEvent);
                continue;
            }

            // Filter for only allowed event types
            if (!ALLOWED_EVENT_TYPES.includes(rawEvent.eventType)) {
                logger.debug(`Filtering out non-gameplay event type: ${rawEvent.eventType}`);
                continue;
            }

            const chunkStartTime = (rawEvent.chunkMetadata as VideoChunk).startTime;
            let eventTimestampInChunk = 0; // Default if parsing fails

            // Attempt to parse timestamp, handle both HH:MM:SS and MM:SS
            const timestampParts = String(rawEvent.timestamp).split(':').map(Number);
            if (timestampParts.length === 2) {
                eventTimestampInChunk = timestampParts[0] * 60 + timestampParts[1];
            } else if (timestampParts.length === 3) {
                eventTimestampInChunk = timestampParts[0] * 3600 + timestampParts[1] * 60 + timestampParts[2];
            } else {
                logger.warn(`Could not parse timestamp format for event: ${rawEvent.timestamp}. Assuming 0.`);
            }

            const absoluteEventTimestamp = chunkStartTime + eventTimestampInChunk; // Absolute timestamp in the original video

            // Ensure only events *started* in the first 2 minutes (120 seconds) of the segment are considered.
            // TODO: This logic will be replaced by Temporal Event Stitching later.
            if (eventTimestampInChunk < 120) {
                let assignedTeamId: string | null = null;
                // --- Team Identification ---
                let teamIdentifier = '';
                if (rawEvent.identifiedTeamColor) {
                    teamIdentifier = rawEvent.identifiedTeamColor.toLowerCase();
                } else if (rawEvent.identifiedTeamDescription) {
                    teamIdentifier = rawEvent.identifiedTeamDescription.toLowerCase();
                }

                if (teamIdentifier && rawEvent.assignedTeamType) { // assignedTeamType is crucial for team distinction
                    teamIdentifier = `${rawEvent.assignedTeamType}-${teamIdentifier}`;
                    assignedTeamId = this.generateConsistentUuid(teamIdentifier);

                    // Check if team already identified, if not, add it
                    if (!currentIdentifiedTeams.some(team => team.id === assignedTeamId)) {
                        currentIdentifiedTeams.push({
                            id: assignedTeamId,
                            type: rawEvent.assignedTeamType,
                            color: rawEvent.identifiedTeamColor || null,
                            description: rawEvent.identifiedTeamDescription || null,
                            // Add other relevant info if needed
                        });
                    }
                }

                let assignedPlayerId: string | null = null;
                // --- Player Identification ---
                let playerIdentifier = '';
                if (rawEvent.identifiedJerseyNumber && assignedTeamId) {
                    playerIdentifier = `${assignedTeamId}-${rawEvent.identifiedJerseyNumber}`;
                } else if (rawEvent.identifiedPlayerDescription && assignedTeamId) {
                    playerIdentifier = `${assignedTeamId}-${rawEvent.identifiedPlayerDescription.toLowerCase()}`;
                }

                if (playerIdentifier) {
                    assignedPlayerId = this.generateConsistentUuid(playerIdentifier);

                    // Check if player already identified, if not, add it
                    if (!currentIdentifiedPlayers.some(player => player.id === assignedPlayerId)) {
                        currentIdentifiedPlayers.push({
                            id: assignedPlayerId,
                            teamId: assignedTeamId,
                            jerseyNumber: rawEvent.identifiedJerseyNumber || null,
                            description: rawEvent.identifiedPlayerDescription || null,
                            // Add other relevant info if needed
                        });
                    }
                }

                const gameEventData: ProcessedGameEvent = {
                    id: rawEvent.id || uuidv4(),
                    gameId: gameId,
                    eventType: rawEvent.eventType,
                    eventSubType: rawEvent.eventSubType || null,
                    isSuccessful: rawEvent.isSuccessful || false,
                    period: rawEvent.period || null,
                    timeRemaining: rawEvent.timeRemaining || null,
                    xCoord: rawEvent.xCoord || null,
                    yCoord: rawEvent.yCoord || null,
                    absoluteTimestamp: absoluteEventTimestamp,
                    assignedPlayerId: assignedPlayerId, // Use generated ID
                    assignedTeamId: assignedTeamId, // Use generated ID
                    relatedEventId: rawEvent.relatedEventId || null,
                    onCourtPlayerIds: rawEvent.onCourtPlayerIds || null,
                    identifiedTeamColor: rawEvent.identifiedTeamColor || null,
                    identifiedJerseyNumber: rawEvent.identifiedJerseyNumber || null,
                    videoClipStartTime: chunkStartTime, // Start of the chunk
                    videoClipEndTime: chunkStartTime + chunkDuration, // End of the chunk
                };

                const eventUniqueKey = `${gameEventData.eventType}-${gameEventData.absoluteTimestamp}-${gameEventData.assignedPlayerId || ''}-${gameEventData.identifiedJerseyNumber || ''}`;

                if (!processedEventKeys.has(eventUniqueKey)) {
                    finalEvents.push(gameEventData);
                    processedEventKeys.add(eventUniqueKey);
                } else {
                    logger.debug(`Duplicate event detected and filtered: ${eventUniqueKey}`);
                }
            } else {
                logger.debug(`Filtering event outside 2-minute window: absoluteTimestamp=${absoluteEventTimestamp}, chunkStartTime=${chunkStartTime}, eventTimestampInChunk=${eventTimestampInChunk}`);
            }
        }
        return {
            finalEvents,
            updatedIdentifiedPlayers: currentIdentifiedPlayers,
            updatedIdentifiedTeams: currentIdentifiedTeams,
        };
    }
}
