'use client';
import React, { useState, useEffect } from 'react';
import { GameEvent } from '@/types/gameEvent';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import { ALLOWED_EVENT_TYPES } from '@/constants/eventTypes';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

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
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(event.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '6px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.025em', textTransform: 'uppercase' }}>
                        Edit Analytics Event
                    </h3>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        TIMESTAMP: {event.absoluteTimestamp.toFixed(2)}s
                    </p>
                </div>
                {onDelete && (
                    <md-text-button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <md-icon slot="icon">delete</md-icon>
                    </md-text-button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Event Type Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                        Classification
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {ALLOWED_EVENT_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setEventType(type as any)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '-0.025em',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    backgroundColor: eventType === type
                                        ? 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)'
                                        : 'var(--md-sys-color-surface-container-high)',
                                    borderColor: eventType === type
                                        ? 'var(--md-sys-color-primary)'
                                        : 'var(--md-sys-color-outline-variant)',
                                    color: eventType === type
                                        ? 'var(--md-sys-color-primary)'
                                        : 'var(--md-sys-color-on-surface-variant)',
                                    transition: 'border-color 200ms, background-color 200ms',
                                }}
                            >
                                {type.replace('_', ' ')}
                                {eventType === type && (
                                    <md-icon>check_circle</md-icon>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Team & Player Assignment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Target Team
                        </label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            value={assignedTeamId}
                            onchange={(e: any) => {
                                setAssignedTeamId(e.target.value);
                                setAssignedPlayerId(''); 
                            }}
                            style={{ width: '100%' }}
                        >
                            <md-select-option value=""><span>Unassigned</span></md-select-option>
                            {allTeams.map(team => (
                                <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Assigned Personnel
                        </label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            value={assignedPlayerId}
                            onchange={(e: any) => setAssignedPlayerId(e.target.value)}
                            disabled={!assignedTeamId}
                            style={{ width: '100%' }}
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
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                <md-text-button 
                    onClick={onCancel} 
                    disabled={isSaving}
                >
                    Discard
                </md-text-button>
                <md-filled-button 
                    onClick={handleSave} 
                    disabled={isSaving}
                >
                    Update Analytics
                </md-filled-button>
            </div>
        </div>
    );
};

export default EventEditor;
