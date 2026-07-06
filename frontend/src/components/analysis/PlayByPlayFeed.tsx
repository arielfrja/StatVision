'use client';
import React from 'react';
import { PlayerTeamHistory } from '@/types/player';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

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
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 16px',
                textAlign: 'center',
                border: '2px dashed var(--md-sys-color-outline-variant)',
                borderRadius: '12px',
                gap: '16px',
            }}>
                <md-icon style={{ fontSize: '40px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.3 }}>history</md-icon>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                }}>No plays recorded for this game.</span>
            </div>
        );
    }

    const sortedEvents = [...events].sort((a,b) => b.absoluteTimestamp - a.absoluteTimestamp);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            }}>
                <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--md-sys-color-on-surface-variant)',
                }}>Game Log</span>
                <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontStyle: 'italic',
                }}>{events.length} Events Detected</span>
            </div>
            
            <div style={{
                flex: 1,
                overflowY: 'auto',
            }}>
                <md-list>
                    {sortedEvents.map((event) => {
                        const isHome = event.teamId === homeTeamId;
                        const timeStr = `${Math.floor(event.absoluteTimestamp / 60)}:${(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}`;
                        const assignedPlayer = allPlayers.find(p => p.playerId === event.assignedPlayerId);
                        
                        return (
                            <md-list-item
                                key={event.id}
                                type="button"
                                onClick={() => onRowClick(event.absoluteTimestamp)}
                            >
                                <div slot="start" style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isHome 
                                        ? 'var(--md-sys-color-primary)' 
                                        : 'var(--md-sys-color-secondary)',
                                    flexShrink: 0,
                                }} />
                                <span slot="headline" style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.02em',
                                }}>
                                    {event.eventType.replace(/_/g, ' ')}
                                </span>
                                <span slot="supporting-text" style={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                }}>
                                    {assignedPlayer ? 
                                        `${assignedPlayer.player.name} (#${assignedPlayer.jerseyNumber})` : 
                                        'Unassigned'}
                                </span>
                                <div slot="end" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    <span style={{
                                        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: 'var(--md-sys-color-primary)',
                                    }}>
                                        {timeStr}
                                    </span>
                                    <md-icon-button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (onEditEvent) onEditEvent(event); }}
                                        title="Edit Event"
                                    >
                                        <md-icon>edit_square</md-icon>
                                    </md-icon-button>
                                </div>
                            </md-list-item>
                        );
                    })}
                </md-list>
            </div>
        </div>
    );
};

export default PlayByPlayFeed;
