'use client';
import React, { useState, useEffect } from 'react';
import { GameEvent } from '@/types/gameEvent';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import { ALLOWED_EVENT_TYPES } from '@/constants/eventTypes';

import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/icon/icon.js';

interface EventEditorProps {
    event: GameEvent;
    allTeams: Team[];
    allPlayers: PlayerTeamHistory[];
    onSave: (updatedEvent: Partial<GameEvent>) => Promise<void>;
    onCancel: () => void;
    onDelete?: (eventId: string) => Promise<void>;
}

const EventEditor: React.FC<EventEditorProps> = ({ event, allTeams, allPlayers, onSave, onCancel, onDelete }) => {
    const [eventType, setEventType] = useState(event.eventType);
    const [assignedTeamId, setAssignedTeamId] = useState(event.assignedTeamId || '');
    const [assignedPlayerId, setAssignedPlayerId] = useState(event.assignedPlayerId || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEventType(event.eventType);
        setAssignedTeamId(event.assignedTeamId || '');
        setAssignedPlayerId(event.assignedPlayerId || '');
    }, [event]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                id: event.id,
                eventType,
                assignedTeamId: assignedTeamId || null,
                assignedPlayerId: assignedPlayerId || null,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ 
            padding: '24px', 
            backgroundColor: 'var(--md-sys-color-surface-container-high)', 
            borderRadius: '16px',
            boxShadow: 'var(--shadow-elevation-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--md-sys-color-primary)' }}>Edit Event</h3>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Time: {event.absoluteTimestamp.toFixed(1)}s
                </span>
            </div>

            <md-filled-select
                label="Event Type"
                value={eventType}
                onchange={(e: any) => setEventType(e.target.value)}
            >
                {ALLOWED_EVENT_TYPES.map(type => (
                    <md-select-option key={type} value={type}><span>{type}</span></md-select-option>
                ))}
            </md-filled-select>

            <md-filled-select
                label="Team"
                value={assignedTeamId}
                onchange={(e: any) => {
                    setAssignedTeamId(e.target.value);
                    setAssignedPlayerId(''); // Reset player when team changes
                }}
            >
                <md-select-option value=""><span>Unassigned</span></md-select-option>
                {allTeams.map(team => (
                    <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                ))}
            </md-filled-select>

            <md-filled-select
                label="Player"
                value={assignedPlayerId}
                onchange={(e: any) => setAssignedPlayerId(e.target.value)}
                disabled={!assignedTeamId}
            >
                <md-select-option value=""><span>Unassigned</span></md-select-option>
                {allPlayers
                    .filter(ph => !assignedTeamId || ph.teamId === assignedTeamId)
                    .map(ph => (
                    <md-select-option key={ph.playerId} value={ph.playerId}>
                        <span>{ph.player.name} {ph.jerseyNumber ? `(#${ph.jerseyNumber})` : ''}</span>
                    </md-select-option>
                ))}
            </md-filled-select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                {onDelete && (
                    <md-outlined-button 
                        onClick={() => onDelete(event.id)} 
                        style={{ '--md-outlined-button-outline-color': 'var(--md-sys-color-error)', '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)' }}
                    >
                        Delete
                    </md-outlined-button>
                )}
                <md-outlined-button onClick={onCancel}>Cancel</md-outlined-button>
                <md-filled-button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </md-filled-button>
            </div>
        </div>
    );
};

export default EventEditor;
