import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "@statvision/common";
import { GameType, IdentityMode } from "@statvision/common";
import { chunkLogger as logger } from "../config/loggers";
import { v5 as uuidv5, validate as validateUuid } from 'uuid';

// Fixed namespace for deterministic UUID generation (v5)
const STATVISION_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; 

export class EventProcessorService {
    /**
     * Ensures an ID is a valid UUID. If it's a TEMP_ string, 
     * it generates a deterministic UUID based on the string and gameId.
     */
    private ensureUuid(id: string | null | undefined, gameId: string): string | null {
        if (!id) return null;
        if (validateUuid(id)) return id;
        
        // Deterministic mapping: TEMP_PLAYER_1 + GameUUID -> Real UUID
        // This ensures the same player always gets the same UUID throughout the game
        return uuidv5(`${gameId}:${id}`, STATVISION_NAMESPACE);
    }

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
        const aiTeams: any[] = rawResponse.identifiedTeams || [];
        const updatedIdentifiedTeams: IdentifiedTeam[] = [];
        const updatedIdentifiedPlayers: IdentifiedPlayer[] = [];

        // Map of AI ID (TEMP_TEAM_1) to Database UUID
        const idMap = new Map<string, string>();

        for (const team of aiTeams) {
            const teamUuid = this.ensureUuid(team.id, gameId)!;
            idMap.set(team.id, teamUuid);

            updatedIdentifiedTeams.push({
                id: teamUuid,
                name: team.name,
                color: team.color,
                type: team.type as 'HOME' | 'AWAY',
                description: team.description
            });

            if (team.players && Array.isArray(team.players)) {
                for (const player of team.players) {
                    const playerUuid = this.ensureUuid(player.id, gameId)!;
                    idMap.set(player.id, playerUuid);

                    updatedIdentifiedPlayers.push({
                        id: playerUuid,
                        number: player.number,
                        jerseyNumber: player.number,
                        name: player.name,
                        description: player.description,
                        position: player.position,
                        teamId: teamUuid // Link to the mapped team UUID
                    } as any);
                }
            }
        }

        // 2. PROCESS INDIVIDUAL EVENTS
        for (const rawEvent of rawEvents) {
            const absoluteTimestamp = chunkInfo.startTime + this.parseTime(rawEvent.timestamp);
            
            // Map AI IDs to UUIDs
            const mappedPlayerId = this.ensureUuid(rawEvent.assignedPlayerId, gameId);
            const mappedTeamId = this.ensureUuid(rawEvent.assignedTeamId, gameId);

            const eventKey = `${rawEvent.eventType}-${absoluteTimestamp}-${mappedTeamId || ''}-${mappedPlayerId || ''}`;

            if (processedEventKeys.has(eventKey)) continue;

            const processedEvent: ProcessedGameEvent = {
                ...rawEvent,
                assignedPlayerId: mappedPlayerId,
                assignedTeamId: mappedTeamId,
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
