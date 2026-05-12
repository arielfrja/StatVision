'use client';
import React from 'react';
import { PlayerTeamHistory } from '@/types/player';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

interface PlayByPlayFeedProps {
    events: any[];
    onRowClick: (time: number) => void;
    allPlayers: PlayerTeamHistory[];
    onAssignPlayer: (gameEventId: string, playerId: string | null) => void;
}

const PlayByPlayFeed: React.FC<PlayByPlayFeedProps> = ({ events, onRowClick, allPlayers, onAssignPlayer }) => {
    if (!events || events.length === 0) {
        return (
            <div className="stadium-card py-20 text-center border-dashed border-2 border-bd-ghost bg-transparent">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-30">history</span>
                <p className="text-xs font-bold text-tx-dim uppercase tracking-widest">No events recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-container border border-bd-ghost rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-container-highest border-b border-bd-ghost">
                            <th className="w-20 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Time</th>
                            <th className="w-32 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Event</th>
                            <th className="w-48 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Assignment</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...events].sort((a,b) => b.absoluteTimestamp - a.absoluteTimestamp).map((event) => (
                            <tr
                                key={event.id}
                                className="border-b border-bd-ghost/50 hover:bg-white/[0.02] transition-colors group cursor-pointer active:bg-container-highest click-flash"
                                onClick={() => onRowClick(event.absoluteTimestamp)}
                            >
                                <td className="px-4 py-5">
                                    <span className="text-[10px] font-black text-white/40 mono-stat group-hover:text-electric transition-colors">
                                        {Math.floor(event.absoluteTimestamp / 60)}:{(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}
                                    </span>
                                </td>
                                <td className="px-4 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase text-white group-hover:text-electric transition-colors leading-none">
                                            {event.eventType.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                                    <md-filled-select
                                        className="w-full scale-90 -ml-2"
                                        value={event.assignedPlayerId || ''}
                                        onchange={(e: any) => onAssignPlayer(event.id, e.target.value || null)}
                                    >
                                        <md-select-option value=""><span>Unassigned</span></md-select-option>
                                        {allPlayers.map(playerHistory => (
                                            <md-select-option key={playerHistory.playerId} value={playerHistory.playerId}>
                                                <span>{playerHistory.player.name} {playerHistory.jerseyNumber ? `(#${playerHistory.jerseyNumber})` : ''}</span>
                                            </md-select-option>
                                        ))}
                                    </md-filled-select>
                                </td>
                                <td className="px-4 py-5 truncate">
                                    <span className="text-[10px] font-medium text-tx-dim italic">
                                        {event.eventDetails ? JSON.stringify(event.eventDetails).slice(0, 40) + '...' : '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlayByPlayFeed;
