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
        <div className="stadium-card frosted-glass min-w-[320px] max-w-lg border-2 border-bd-ghost shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Edit Event</h3>
                    <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Moment: {event.absoluteTimestamp.toFixed(1)}s</p>
                </div>
                {onDelete && (
                    <button 
                        onClick={() => onDelete(event.id)} 
                        className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                )}
            </div>

            {/* Tactile Event Type Grid */}
            <div className="mb-6">
                <p className="text-[10px] font-black text-tx-dim uppercase tracking-widest mb-3">Event Classification</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALLOWED_EVENT_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setEventType(type as any)}
                            className={`py-2.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                eventType === type 
                                    ? 'bg-electric text-[#00373a] border-electric shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                                    : 'bg-container-low text-tx-dim border-bd-ghost hover:border-tx-dim'
                            }`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div>
                    <p className="text-[10px] font-black text-tx-dim uppercase tracking-widest mb-2">Team Assignment</p>
                    <md-filled-select
                        className="w-full"
                        value={assignedTeamId}
                        onchange={(e: any) => {
                            setAssignedTeamId(e.target.value);
                            setAssignedPlayerId(''); 
                        }}
                    >
                        <md-select-option value=""><span>Unassigned</span></md-select-option>
                        {allTeams.map(team => (
                            <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                        ))}
                    </md-filled-select>
                </div>

                <div>
                    <p className="text-[10px] font-black text-tx-dim uppercase tracking-widest mb-2">Player Assignment</p>
                    <md-filled-select
                        className="w-full"
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
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onCancel} 
                    className="flex-1 py-4 bg-container-high text-tx-secondary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-container-highest transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-electric text-[#00373a] rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Processing...' : 'Apply Intelligence'}
                </button>
            </div>
        </div>
    );
};

export default EventEditor;
