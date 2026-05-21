import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "@statvision/common";
import { GameType, IdentityMode } from "@statvision/common";
import { chunkLogger as logger } from "../config/loggers";

export class EventProcessorService {
    public processEvents(
        rawEvents: any[],
        gameId: string,
        chunkInfo: { startTime: number; sequence: number; id?: string },
        chunkDuration: number,
        chunkOverlap: number,
        processedEventKeys: Set<string>,
        identifiedPlayers: IdentifiedPlayer[],
        identifiedTeams: IdentifiedTeam[],
        gameType: GameType,
        identityMode: IdentityMode
    ): { finalEvents: ProcessedGameEvent[]; updatedIdentifiedPlayers: IdentifiedPlayer[]; updatedIdentifiedTeams: IdentifiedTeam[] } {
        const finalEvents: ProcessedGameEvent[] = [];
        const currentIdentifiedPlayers = [...identifiedPlayers];
        const currentIdentifiedTeams = [...identifiedTeams];

        for (const rawEvent of rawEvents) {
            const absoluteTimestamp = chunkInfo.startTime + rawEvent.timestampInChunk;
            const eventKey = `${rawEvent.eventType}-${absoluteTimestamp}-${rawEvent.teamId || ''}-${rawEvent.jerseyNumber || ''}`;

            if (processedEventKeys.has(eventKey)) continue;

            const processedEvent: ProcessedGameEvent = {
                ...rawEvent,
                gameId,
                absoluteTimestamp,
                chunkId: chunkInfo.id || null,
            };

            finalEvents.push(processedEvent);
            processedEventKeys.add(eventKey);
        }

        return {
            finalEvents,
            updatedIdentifiedPlayers: currentIdentifiedPlayers,
            updatedIdentifiedTeams: currentIdentifiedTeams,
        };
    }
}
