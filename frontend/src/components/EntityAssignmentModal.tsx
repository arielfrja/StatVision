/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';
import { Player, PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import Loader from './Loader';
import Button from './Button';

// Import Material Web Components
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/dialog/dialog.js';

interface EntityAssignmentModalProps {
    gameId: string;
    isOpen: boolean;
    onClose: () => void;
    onAssignmentComplete: () => void;
}

type EnrichedPlayer = Player & { jerseyNumber?: number | null; description?: string | null };
type TeamWithPlayers = Team & { players: EnrichedPlayer[] };

const EntityAssignmentModal: React.FC<EntityAssignmentModalProps> = ({ gameId, isOpen, onClose, onAssignmentComplete }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [identifiedEntities, setIdentifiedEntities] = useState<TeamWithPlayers[]>([]);
    const [officialTeams, setOfficialTeams] = useState<Team[]>([]);
    const [officialPlayers, setOfficialPlayers] = useState<PlayerTeamHistory[]>([]);
    
    const [teamMappings, setTeamMappings] = useState<{ [tempId: string]: string }>({});
    const [playerMappings, setPlayerMappings] = useState<{ [tempId: string]: string }>({});

    // Track which rows are in "edit" mode
    const [editingEntityId, setEditingEntityId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && gameId) {
            fetchInitialData();
        }
    }, [isOpen, gameId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const headers = { Authorization: `Bearer ${token}` };

            const [identifiedRes, teamsRes, playersRes] = await Promise.all([
                apiClient.get<TeamWithPlayers[]>(`/games/${gameId}/identified-entities`, { headers }),
                apiClient.get<Team[]>(`/teams`, { headers }),
                apiClient.get<PlayerTeamHistory[]>(`/players`, { headers })
            ]);

            const tempEntities = identifiedRes.data.filter(t => t.isTemp);
            setIdentifiedEntities(tempEntities);
            setOfficialTeams(teamsRes.data.filter(t => !t.isTemp));
            setOfficialPlayers(playersRes.data.filter(ph => ph.player && !ph.player.isTemp));

            // Initialize mappings with empty values
            const initialTeamMappings: { [key: string]: string } = {};
            tempEntities.forEach(t => {
                if (t.id) initialTeamMappings[t.id] = '';
            });
            setTeamMappings(initialTeamMappings);

            const initialPlayerMappings: { [key: string]: string } = {};
            tempEntities.forEach(t => {
                t.players.forEach(p => {
                    if (p.id) initialPlayerMappings[p.id] = '';
                });
            });
            setPlayerMappings(initialPlayerMappings);

        } catch (error) {
            console.error("Error fetching assignment data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeamMappingChange = (tempId: string, officialId: string) => {
        setTeamMappings(prev => ({ ...prev, [tempId]: officialId }));
        setEditingEntityId(null);
    };

    const handlePlayerMappingChange = (tempId: string, officialId: string) => {
        setPlayerMappings(prev => ({ ...prev, [tempId]: officialId }));
        setEditingEntityId(null);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const data = {
                teamMappings: Object.entries(teamMappings)
                    .filter(([_, officialId]) => officialId !== '')
                    .map(([tempTeamId, officialTeamId]) => ({ tempTeamId, officialTeamId })),
                playerMappings: Object.entries(playerMappings)
                    .filter(([_, officialId]) => officialId !== '')
                    .map(([tempPlayerId, officialPlayerId]) => ({ tempPlayerId, officialPlayerId }))
            };

            await apiClient.post(`/games/${gameId}/assignment`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onAssignmentComplete();
            onClose();
        } catch (error) {
            console.error("Error submitting assignments:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <md-dialog open={isOpen} onclose={onClose} style={{ maxWidth: '800px', width: '95vw' }} className="rounded-md overflow-hidden">
            <div slot="headline" className="font-bold text-lg p-6 border-b border-border-main bg-surface-high text-tx-primary uppercase tracking-tight">
                Personnel & Roster Synchronization
            </div>
            <div slot="content" className="p-8 flex flex-col gap-10 bg-primary-bg overflow-y-auto max-h-[60vh] no-scrollbar">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader /></div>
                ) : identifiedEntities.length === 0 ? (
                    <div className="py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-tx-dim mb-4">person_off</span>
                        <p className="text-tx-secondary font-bold uppercase tracking-widest text-[10px]">No temporary detections requiring assignment</p>
                    </div>
                ) : (
                    identifiedEntities.map(tempTeam => (
                        <div key={tempTeam.id} className="space-y-4">
                            {/* Team Assignment Header (Read-Only first) */}
                            <div className="p-5 border border-border-main rounded-md bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-bold text-sm text-tx-primary uppercase">{tempTeam.name}</h3>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest">TEMPORARY GROUP DETECTION</p>
                                </div>
                                
                                {editingEntityId === tempTeam.id ? (
                                    <md-filled-select
                                        label="Official Team"
                                        value={tempTeam.id ? (teamMappings[tempTeam.id] || '') : ''}
                                        onchange={(e: any) => tempTeam.id && handleTeamMappingChange(tempTeam.id, e.target.value)}
                                        className="min-w-[280px]"
                                    >
                                        <md-select-option value=""><span>Unassigned</span></md-select-option>
                                        {officialTeams.map(team => (
                                            <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                                        ))}
                                    </md-filled-select>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-tx-secondary">
                                            {tempTeam.id && teamMappings[tempTeam.id] 
                                                ? officialTeams.find(t => t.id === teamMappings[tempTeam.id])?.name 
                                                : 'NO OFFICIAL TEAM ASSIGNED'}
                                        </span>
                                        <Button variant="outline" size="sm" icon="edit" onClick={() => setEditingEntityId(tempTeam.id || null)}>
                                            Assign
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Player Assignments */}
                            <div className="flex flex-col gap-2 pl-6 border-l border-border-main">
                                {tempTeam.players.map(tempPlayer => {
                                    const currentTeamId = tempTeam.id ? teamMappings[tempTeam.id] : '';
                                    const isEditing = editingEntityId === tempPlayer.id;
                                    const assignedOfficialPlayer = officialPlayers.find(ph => ph.player.id === playerMappings[tempPlayer.id || '']);

                                    return (
                                        <div key={tempPlayer.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-md bg-surface-high border border-border-main">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-primary-bg border border-border-main flex items-center justify-center text-[10px] font-black text-accent mono-stat">
                                                    {tempPlayer.jerseyNumber || '?'}
                                                </div>
                                                <span className="text-xs font-bold text-tx-primary uppercase tracking-tight">
                                                    {tempPlayer.name || 'Identified Player'}
                                                </span>
                                            </div>

                                            {isEditing ? (
                                                <md-filled-select
                                                    label="Official Roster"
                                                    value={tempPlayer.id ? (playerMappings[tempPlayer.id] || '') : ''}
                                                    onchange={(e: any) => tempPlayer.id && handlePlayerMappingChange(tempPlayer.id, e.target.value)}
                                                    className="min-w-[240px]"
                                                >
                                                    <md-select-option value=""><span>Unassigned</span></md-select-option>
                                                    {officialPlayers
                                                        .filter(ph => !currentTeamId || ph.teamId === currentTeamId)
                                                        .map(ph => (
                                                        <md-select-option key={ph.player.id} value={ph.player.id}>
                                                            <span>{ph.player.name} (#{ph.jerseyNumber})</span>
                                                        </md-select-option>
                                                    ))}
                                                </md-filled-select>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[11px] font-bold text-tx-secondary uppercase">
                                                        {assignedOfficialPlayer 
                                                            ? `${assignedOfficialPlayer.player.name} (#${assignedOfficialPlayer.jerseyNumber})` 
                                                            : 'PENDING ASSIGNMENT'}
                                                    </span>
                                                    <Button variant="ghost" size="sm" icon="edit_square" onClick={() => setEditingEntityId(tempPlayer.id || null)}>
                                                        Assign
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div slot="actions" className="p-6 border-t border-border-main bg-surface-high flex gap-4 w-full">
                <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-[2]" icon="verified">
                    Synchronize Roster
                </Button>
            </div>
        </md-dialog>
    );
};

export default EntityAssignmentModal;
