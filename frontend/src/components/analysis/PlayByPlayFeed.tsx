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
    if (!events || events.length === 0) return <p style={{padding: 'var(--spacing-md)'}}>No events found.</p>;

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Play-by-Play</h2>
            <table className="md-table interactive">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Player</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr
                            key={event.id}
                            className="interactive"
                            onClick={() => onRowClick(event.absoluteTimestamp)}
                        >
                            <td>{event.absoluteTimestamp.toFixed(1)}s</td>
                            <td>{event.eventType}</td>
                            <td>
                                <md-filled-select
                                    label="Assign Player"
                                    value={event.assignedPlayerId || ''}
                                    onchange={(e: any) => onAssignPlayer(event.id, e.target.value || null)}
                                    style={{ width: '100%' }}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent row click when changing player
                                >
                                    <md-select-option value=""><span>Unassigned</span></md-select-option>
                                    {allPlayers.map(playerHistory => (
                                        <md-select-option key={playerHistory.playerId} value={playerHistory.playerId}>
                                            <span>{playerHistory.player.name} {playerHistory.jerseyNumber ? `(#${playerHistory.jerseyNumber})` : ''}</span>
                                        </md-select-option>
                                    ))}
                                </md-filled-select>
                            </td>
                            <td>{JSON.stringify(event.eventDetails)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlayByPlayFeed;
