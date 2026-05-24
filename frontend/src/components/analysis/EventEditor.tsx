'use client';
import React, { useState, useEffect } from 'react';
import { GameEvent } from '@/types/gameEvent';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import { ALLOWED_EVENT_TYPES } from '@/constants/eventTypes';
import Button from '../Button';

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
        <div className="bg-surface border border-border-main rounded-md p-6 flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-tx-primary tracking-tight uppercase">Edit Analytics Event</h3>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mono-stat">
                        TIMESTAMP: {event.absoluteTimestamp.toFixed(2)}s
                    </p>
                </div>
                {onDelete && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon="delete" 
                        onClick={handleDelete}
                        isLoading={isDeleting}
                        className="!text-error hover:!bg-error/10"
                    />
                )}
            </div>

            <div className="space-y-6">
                {/* Event Type Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-tx-dim uppercase tracking-wider">Classification</label>
                    <div className="grid grid-cols-2 gap-2">
                        {ALLOWED_EVENT_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setEventType(type as any)}
                                className={`py-2 px-3 rounded border text-[10px] font-bold uppercase tracking-tight transition-all text-left flex items-center justify-between group ${
                                    eventType === type 
                                        ? 'bg-accent/10 border-accent text-accent' 
                                        : 'bg-primary-bg border-border-main text-tx-secondary hover:border-tx-dim'
                                }`}
                            >
                                {type.replace('_', ' ')}
                                {eventType === type && <span className="material-symbols-outlined text-xs">check_circle</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Team & Player Assignment */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-tx-dim uppercase tracking-wider">Target Team</label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            value={assignedTeamId}
                            onchange={(e: any) => {
                                setAssignedTeamId(e.target.value);
                                setAssignedPlayerId(''); 
                            }}
                            className="w-full"
                        >
                            <md-select-option value=""><span>Unassigned</span></md-select-option>
                            {allTeams.map(team => (
                                <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-tx-dim uppercase tracking-wider">Assigned Personnel</label>
                        {/* @ts-ignore */}
                        <md-filled-select
                            value={assignedPlayerId}
                            onchange={(e: any) => setAssignedPlayerId(e.target.value)}
                            disabled={!assignedTeamId}
                            className="w-full"
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

            <div className="flex gap-3 pt-6 border-t border-border-main">
                <Button 
                    variant="ghost"
                    onClick={onCancel} 
                    fullWidth
                    disabled={isSaving}
                >
                    Discard
                </Button>
                <Button 
                    onClick={handleSave} 
                    isLoading={isSaving}
                    fullWidth
                    className="flex-[2]"
                >
                    Update Analytics
                </Button>
            </div>
        </div>
    );
};

export default EventEditor;
