import React from 'react';
import { Player } from '@/types/player';
import { Team } from '@/types/team';
import Loader from './Loader';
import Button from './Button';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';

// Add a 'players' property to the Team type and enrich the Player type for this component
type EnrichedPlayer = Player & { 
    jerseyNumber?: number | null; 
    description?: string | null;
    teamAssignmentConfidence?: number;
};
type TeamWithPlayers = Team & { players: EnrichedPlayer[] };

interface IdentifiedEntitiesTableProps {
    gameId: string;
}

const IdentifiedEntitiesTable: React.FC<IdentifiedEntitiesTableProps> = ({ gameId }) => {
    const { data: teamsWithPlayers, error, isLoading, mutate } = useSWR<TeamWithPlayers[]>(gameId ? `/games/${gameId}/identified-entities` : null);

    const handleSwitchTeam = async (playerId: string) => {
        try {
            await apiClient.put(`/players/${playerId}/switch-team`, { gameId });
            mutate();
        } catch (err) {
            console.error("Failed to switch team:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader size="large" label="Mapping Identities" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-error/10 border border-error/30 rounded-md flex items-center gap-4 text-error">
                <span className="material-symbols-outlined">error</span>
                <p className="text-xs font-bold uppercase tracking-wider">{error.message || "Failed to fetch identified entities."}</p>
            </div>
        );
    }

    if (!teamsWithPlayers || teamsWithPlayers.length === 0) {
        return (
            <div className="p-12 text-center bg-surface-high rounded-md border border-border-main">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4">group_off</span>
                <p className="text-xs font-bold uppercase tracking-wider text-tx-dim">No entities identified in game events yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold tracking-tight text-tx-primary">Identified Teams & Players</h2>
                <div className="h-px flex-1 bg-border-main ml-6"></div>
            </div>
            
            {teamsWithPlayers.map((team: TeamWithPlayers) => (
                <div key={team.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Team Info Header */}
                    <div className="px-4 py-3 bg-surface-high border-x border-t border-border-main rounded-t-md flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-tx-primary">{team.name}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-tx-dim bg-primary-bg px-2 py-0.5 rounded border border-border-main">
                                {team.isTemp ? 'DETECTION GROUP' : 'OFFICIAL ROSTER'}
                            </span>
                        </div>
                        {!team.isTemp && (
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-tx-secondary">
                                    SYNCED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Players Table */}
                    <div className="md-scrollable-table-container rounded-t-none">
                        <table className="md-table md-box-score-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th className="text-center">Jersey #</th>
                                    <th>Visual Identity</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.players.length > 0 ? team.players.map((player: EnrichedPlayer) => (
                                    <tr key={player.id} className="interactive group">
                                        <td>
                                            <span className="font-bold text-tx-primary">{player.name || 'Unknown Player'}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="inline-block px-1.5 py-0.5 bg-surface-high border border-border-main rounded text-xs font-bold text-tx-primary min-w-[24px]">
                                                {player.jerseyNumber ?? '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[11px] text-tx-secondary uppercase tracking-tight">
                                                {player.description ?? 'No visual data available'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => player.id && handleSwitchTeam(player.id)}
                                                icon="swap_horiz"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Switch Team
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center">
                                             <p className="text-[10px] font-bold uppercase tracking-widest text-tx-dim">No players identified for this group</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default IdentifiedEntitiesTable;
