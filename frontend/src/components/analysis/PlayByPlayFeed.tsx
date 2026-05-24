'use client';
import React from 'react';
import { PlayerTeamHistory } from '@/types/player';

interface PlayByPlayFeedProps {
    events: any[];
    onRowClick: (time: number) => void;
    allPlayers: PlayerTeamHistory[];
    _onAssignPlayer: (gameEventId: string, playerId: string | null) => void;
    onEditEvent?: (event: any) => void;
    _onDeleteEvent?: (eventId: string) => void;
    homeTeamId: string | null;
}

const PlayByPlayFeed: React.FC<PlayByPlayFeedProps> = ({ 
    events, 
    onRowClick, 
    allPlayers, 
    _onAssignPlayer,
    onEditEvent,
    _onDeleteEvent,
    homeTeamId
}) => {
    if (!events || events.length === 0) {
        return (
            <div className="utility-card py-20 text-center border-dashed border-2 bg-transparent">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-20">history</span>
                <p className="text-xs font-medium text-tx-dim uppercase tracking-widest">No plays recorded for this game.</p>
            </div>
        );
    }

    const sortedEvents = [...events].sort((a,b) => b.absoluteTimestamp - a.absoluteTimestamp);

    return (
        <div className="flex flex-col h-full bg-surface border border-border-main rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-high border-b border-border-main">
                <span className="text-[10px] font-bold uppercase tracking-widest text-tx-secondary">Game Log</span>
                <span className="text-[10px] font-medium text-tx-dim italic">{events.length} Events Detected</span>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="md-table md-box-score-table">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="w-16 text-center">TIME</th>
                            <th className="w-12">TEAM</th>
                            <th>ACTION</th>
                            <th className="w-10 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEvents.map((event) => {
                            const isHome = event.teamId === homeTeamId;
                            const timeStr = `${Math.floor(event.absoluteTimestamp / 60)}:${(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}`;
                            const assignedPlayer = allPlayers.find(p => p.playerId === event.assignedPlayerId);
                            
                            return (
                                <tr
                                    key={event.id}
                                    className="interactive"
                                    onClick={() => onRowClick(event.absoluteTimestamp)}
                                >
                                    <td className="text-center font-bold text-accent mono-stat">
                                        {timeStr}
                                    </td>
                                    <td>
                                        <div className={`w-2 h-2 rounded-full ${isHome ? 'bg-accent' : 'bg-warning'}`}></div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col py-1">
                                            <span className="text-xs font-bold text-tx-primary uppercase tracking-tight">
                                                {event.eventType.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[10px] text-tx-secondary font-medium">
                                                {assignedPlayer ? 
                                                    `${assignedPlayer.player.name} (#${assignedPlayer.jerseyNumber})` : 
                                                    'Unassigned'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); if (onEditEvent) onEditEvent(event); }}
                                            className="p-1.5 rounded text-tx-dim hover:text-accent hover:bg-accent/10 transition-colors"
                                            title="Edit Event"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_square</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlayByPlayFeed;
