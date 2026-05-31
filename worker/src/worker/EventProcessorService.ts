import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "@statvision/common";
import { GameType, IdentityMode } from "@statvision/common";
import { chunkLogger as logger } from "../config/loggers";

export class EventProcessorService {
    public processEvents(
        rawResponse: any,
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
        const rawEvents = rawResponse.events || [];
        
        // 1. EXTRACT UPDATED MASTER LISTS FROM AI RESPONSE
        // We trust Gemini to return the full state (old + new) in identifiedTeams
        const aiTeams: any[] = rawResponse.identifiedTeams || [];
        const updatedIdentifiedTeams: IdentifiedTeam[] = [];
        const updatedIdentifiedPlayers: IdentifiedPlayer[] = [];

        for (const team of aiTeams) {
            updatedIdentifiedTeams.push({
                id: team.id,
                name: team.name,
                color: team.color,
                type: team.type as 'HOME' | 'AWAY',
                description: team.description
            });

            if (team.players && Array.isArray(team.players)) {
                for (const player of team.players) {
                    updatedIdentifiedPlayers.push({
                        id: player.id,
                        number: player.number, // Local mapping for internal loop
                        jerseyNumber: player.number, // Interface requirement
                        name: player.name,
                        description: player.description,
                        position: player.position,
                        teamId: team.id // Link player to team
                    } as any);
                }
            }
        }

        // 2. PROCESS INDIVIDUAL EVENTS
        for (const rawEvent of rawEvents) {
            const absoluteTimestamp = chunkInfo.startTime + this.parseTime(rawEvent.timestamp);
            const eventKey = `${rawEvent.eventType}-${absoluteTimestamp}-${rawEvent.assignedTeamId || ''}-${rawEvent.assignedPlayerId || ''}`;

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
            updatedIdentifiedPlayers,
            updatedIdentifiedTeams,
        };
    }

    private parseTime(time: any): number {
        if (typeof time === 'number') return time;
        if (typeof time === 'string') {
            const parts = time.split(':');
            if (parts.length === 2) {
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
        }
        return 0;
    }
}
