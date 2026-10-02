'use client';
import React, { useState, useEffect } from 'react';
import { GameEvent } from '@/types/gameEvent';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import { ALLOWED_EVENT_TYPES } from '@/constants/eventTypes';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
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
    // A4 (read-only UI improvement, no backend change): search + grouping for ~36 classes.
    const [search, setSearch] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const ADVANCED_TYPES = ['Pass', 'Dribble'];
    const isShotType = (v: string) => /shot|free throw/i.test(v);
    const isReboundType = (v: string) => /rebound/i.test(v);
    const isFoulType = (v: string) => /foul/i.test(v);
    const filteredTypes = ALLOWED_EVENT_TYPES.filter((v) => {
      if (!showAdvanced && (ADVANCED_TYPES as string[]).includes(v)) return false;
      if (!search.trim()) return true;
      return v.toLowerCase().includes(search.trim().toLowerCase());
    });
    const shotTypes = filteredTypes.filter(isShotType);
    const reboundTypes = filteredTypes.filter((v) => !isShotType(v) && isReboundType(v));
    const foulTypes = filteredTypes.filter((v) => !isShotType(v) && !isReboundType(v) && isFoulType(v));
    const otherTypes = filteredTypes.filter((v) => !isShotType(v) && !isReboundType(v) && !isFoulType(v));
    const renderTypeButton = (type: string) => (
      <button
        key={type}
        onClick={() => setEventType(type as any)}
        aria-pressed={eventType === type}
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
        {eventType === type && (<md-icon>check_circle</md-icon>)}
      </button>
    );

    useEffect(() => {
        setEventType(event.eventType);
        setAssignedTeamId(event.assignedTeamId || '');
        setAssignedPlayerId(event.assignedPlayerId || '');
    }, [event]);

    const handleSave = async (verified = false) => {
        setIsSaving(true);
        try {
            await onSave({
                id: event.id,
                eventType,
                assignedTeamId: assignedTeamId || null,
                assignedPlayerId: assignedPlayerId || null,
                ...(verified ? { timePrecision: 'verified' as const } : {}),
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
                        {(event as any).frameIndex != null ? ` · FRAME ${(event as any).frameIndex}` : ''}
                        {(event as any).sourceFps != null ? ` @ ${(event as any).sourceFps.toFixed(1)}FPS` : ''}
                        {' · ' + ((event as any).timePrecision === 'verified' ? 'VERIFIED' : 'ESTIMATED ±2s')}
                        {(event as any).needsReview ? ' · NEEDS REVIEW' : ''}
                    </p>
                </div>
                {onDelete && (
                    <md-text-button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label="Delete event"
                    >
                        <md-icon slot="icon">delete</md-icon>
                    </md-text-button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Event Type Selection (A4: searchable, grouped, advanced-gated — UI only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label htmlFor="event-type-search" style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                        Classification ({ALLOWED_EVENT_TYPES.length} types)
                    </label>
                    <input
                      id="event-type-search"
                      role="combobox"
                      aria-expanded="true"
                      aria-controls="event-type-groups"
                      aria-autocomplete="list"
                      aria-label="Search event types"
                      type="search"
                      placeholder="Search 36 event types… (e.g. shot, rebound, foul)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--md-sys-color-outline-variant)', fontSize: '12px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input id="show-advanced" type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} />
                      <label htmlFor="show-advanced" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show advanced (Pass, Dribble)</label>
                    </div>
                    <div id="event-type-groups" role="listbox" aria-label="Event type results" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {filteredTypes.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>No event types match &ldquo;{search}&rdquo;.</p>
                      ) : (
                      <>
                      {shotTypes.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Shot ({shotTypes.length})</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>{shotTypes.map(renderTypeButton)}</div>
                        </div>
                      )}
                      {reboundTypes.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Rebound ({reboundTypes.length})</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>{reboundTypes.map(renderTypeButton)}</div>
                        </div>
                      )}
                      {foulTypes.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Foul ({foulTypes.length})</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>{foulTypes.map(renderTypeButton)}</div>
                        </div>
                      )}
                      {otherTypes.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Other ({otherTypes.length})</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>{otherTypes.map(renderTypeButton)}</div>
                        </div>
                      )}
                      </>
                      )}
                    </div>
                </div>

                {/* Team & Player Assignment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="target-team" style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Target Team
                        </label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            id="target-team"
                            aria-label="Target Team"
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
                        <label htmlFor="assigned-personnel" style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Assigned Personnel
                        </label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            id="assigned-personnel"
                            aria-label="Assigned Personnel"
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
                    onClick={() => handleSave(false)} 
                    disabled={isSaving}
                >
                    Update Analytics
                </md-filled-button>
                {(event as any).timePrecision !== 'verified' && (
                    <md-outlined-button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                    >
                        <md-icon slot="icon">verified</md-icon>
                        Mark verified
                    </md-outlined-button>
                )}
            </div>
        </div>
    );
};

export default EventEditor;
