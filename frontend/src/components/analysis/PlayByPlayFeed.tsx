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
    onEditEvent?: (event: any) => void;
    onDeleteEvent?: (eventId: string) => void;
}

const PlayByPlayFeed: React.FC<PlayByPlayFeedProps> = ({ 
    events, 
    onRowClick, 
    allPlayers, 
    onAssignPlayer,
    onEditEvent,
    onDeleteEvent
}) => {
    if (!events || events.length === 0) {
        return (
            <div className="utility-card py-20 text-center border-dashed border-2 bg-transparent">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-20">history</span>
                <p className="text-xs font-medium text-tx-dim uppercase tracking-wider">No events recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-container border border-bd-ghost rounded-xl overflow-hidden flex flex-col h-full">
            <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-container-high border-b border-bd-ghost">
                            <th className="w-16 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim">Time</th>
                            <th className="w-28 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim">Event</th>
                            <th className="w-40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim">Assign</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim">Details</th>
                            <th className="w-16 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...events].sort((a,b) => b.absoluteTimestamp - a.absoluteTimestamp).map((event) => (
                            <tr
                                key={event.id}
                                className="border-b border-bd-ghost hover:bg-white/[0.02] transition-colors group cursor-pointer active:bg-container-highest"
                                onClick={() => onRowClick(event.absoluteTimestamp)}
                            >
                                <td className="px-4 py-4">
                                    <span className="text-[11px] font-medium text-tx-secondary mono-stat group-hover:text-electric transition-colors">
                                        {Math.floor(event.absoluteTimestamp / 60)}:{(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[10px] font-bold uppercase text-white group-hover:text-electric transition-colors">
                                        {event.eventType.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
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
                                <td className="px-4 py-4 truncate">
                                    <span className="text-[10px] font-medium text-tx-dim">
                                        {event.eventDetails ? JSON.stringify(event.eventDetails).slice(1, -1).replace(/"/g, '') : '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onEditEvent && onEditEvent(event)}
                                            className="p-1 hover:text-electric text-tx-dim transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => onDeleteEvent && onDeleteEvent(event.id)}
                                            className="p-1 hover:text-red-400 text-tx-dim transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
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
