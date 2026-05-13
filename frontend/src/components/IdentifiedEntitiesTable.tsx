/* eslint-disable */
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
            <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-500">
                <span className="material-symbols-outlined">error</span>
                <p className="text-xs font-bold uppercase tracking-widest">{error.message || "Failed to fetch identified entities."}</p>
            </div>
        );
    }

    if (!teamsWithPlayers || teamsWithPlayers.length === 0) {
        return (
            <div className="p-12 text-center bg-container-low rounded-2xl border border-bd-ghost">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4">group_off</span>
                <p className="text-xs font-bold uppercase tracking-widest text-tx-dim">No entities identified in game events yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Identified Teams & Players</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-bd-ghost to-transparent ml-6"></div>
            </div>
            
            {teamsWithPlayers.map(team => (
                <div key={team.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Team Info Card */}
                    <div className="p-6 bg-container-low border border-bd-ghost rounded-2xl mb-6 flex justify-between items-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-electric/20 group-hover:bg-electric transition-colors"></div>
                        <div className="pl-2">
                            <h3 className="text-lg font-black italic uppercase text-white mb-1">{team.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-tx-dim">
                                {team.isTemp ? 'Detected Group' : 'Official Roster'}
                            </p>
                        </div>
                        {!team.isTemp && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-container-highest rounded-full border border-bd-ghost">
                                <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse"></div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-tx-secondary">
                                    Synced
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Players Table */}
                    {team.players.length > 0 ? (
                        <div className="bg-container border border-bd-ghost rounded-2xl overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-container-high/50 border-b border-bd-ghost">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim text-center">Jersey #</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Visual Identity</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.players.map((player) => (
                                        <tr key={player.id} className="border-b border-bd-ghost/50 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-white group-hover:text-electric transition-colors">{player.name || 'Unknown Player'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-2 py-1 bg-container-highest border border-bd-ghost rounded-md text-[10px] font-black text-tx-primary min-w-[28px]">
                                                    {player.jerseyNumber ?? '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-tight leading-snug">
                                                    {player.description ?? 'No visual data available'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-container/50 border border-bd-ghost border-dashed rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-dim">No players identified for this group</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default IdentifiedEntitiesTable;
