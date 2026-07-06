/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';
import { Player, PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
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
        <md-dialog open={isOpen} onclose={onClose} style={{ maxWidth: '800px', width: '95vw' }}>
            <div
                slot="headline"
                style={{
                    fontWeight: 'bold',
                    fontSize: '18px',
                    padding: '24px',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.025em',
                }}
            >
                Personnel & Roster Synchronization
            </div>
            <div
                slot="content"
                style={{
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    overflowY: 'auto',
                    maxHeight: '60vh',
                }}
            >
                {isLoading ? (
                    <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
                        <md-circular-progress indeterminate></md-circular-progress>
                    </div>
                ) : identifiedEntities.length === 0 ? (
                    <div style={{ padding: '64px 0', textAlign: 'center' }}>
                        <md-icon style={{ fontSize: '36px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', opacity: 0.6 }}>person_off</md-icon>
                        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>
                            No temporary detections requiring assignment
                        </p>
                    </div>
                ) : (
                    identifiedEntities.map(tempTeam => (
                        <div key={tempTeam.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Team Assignment Header (Read-Only first) */}
                            <div
                                style={{
                                    padding: '20px',
                                    border: '1px solid var(--md-sys-color-outline-variant)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--md-sys-color-surface)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--md-sys-color-on-surface)', textTransform: 'uppercase' }}>
                                        {tempTeam.name}
                                    </h3>
                                    <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        TEMPORARY GROUP DETECTION
                                    </p>
                                </div>
                                
                                {editingEntityId === tempTeam.id ? (
                                    <md-filled-select
                                        label="Official Team"
                                        value={tempTeam.id ? (teamMappings[tempTeam.id] || '') : ''}
                                        onchange={(e: any) => tempTeam.id && handleTeamMappingChange(tempTeam.id, e.target.value)}
                                        style={{ minWidth: '280px' }}
                                    >
                                        <md-select-option value=""><span>Unassigned</span></md-select-option>
                                        {officialTeams.map(team => (
                                            <md-select-option key={team.id} value={team.id}><span>{team.name}</span></md-select-option>
                                        ))}
                                    </md-filled-select>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {tempTeam.id && teamMappings[tempTeam.id] 
                                                ? officialTeams.find(t => t.id === teamMappings[tempTeam.id])?.name 
                                                : 'NO OFFICIAL TEAM ASSIGNED'}
                                        </span>
                                        <md-outlined-button onClick={() => setEditingEntityId(tempTeam.id || null)}>
                                            <md-icon slot="icon">edit</md-icon>
                                            Assign
                                        </md-outlined-button>
                                    </div>
                                )}
                            </div>

                            {/* Player Assignments */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '24px', borderLeft: '1px solid var(--md-sys-color-outline-variant)' }}>
                                {tempTeam.players.map(tempPlayer => {
                                    const currentTeamId = tempTeam.id ? teamMappings[tempTeam.id] : '';
                                    const isEditing = editingEntityId === tempPlayer.id;
                                    const assignedOfficialPlayer = officialPlayers.find(ph => ph.player.id === playerMappings[tempPlayer.id || '']);

                                    return (
                                        <div
                                            key={tempPlayer.id}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px',
                                                justifyContent: 'space-between',
                                                padding: '16px',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                                border: '1px solid var(--md-sys-color-outline-variant)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                                        border: '1px solid var(--md-sys-color-outline-variant)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        color: 'var(--md-sys-color-primary)',
                                                    }}
                                                >
                                                    {tempPlayer.jerseyNumber || '?'}
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', textTransform: 'uppercase', letterSpacing: '-0.025em' }}>
                                                    {tempPlayer.name || 'Identified Player'}
                                                </span>
                                            </div>

                                            {isEditing ? (
                                                <md-filled-select
                                                    label="Official Roster"
                                                    value={tempPlayer.id ? (playerMappings[tempPlayer.id] || '') : ''}
                                                    onchange={(e: any) => tempPlayer.id && handlePlayerMappingChange(tempPlayer.id, e.target.value)}
                                                    style={{ minWidth: '240px' }}
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                                                        {assignedOfficialPlayer 
                                                            ? `${assignedOfficialPlayer.player.name} (#${assignedOfficialPlayer.jerseyNumber})` 
                                                            : 'PENDING ASSIGNMENT'}
                                                    </span>
                                                    <md-text-button onClick={() => setEditingEntityId(tempPlayer.id || null)}>
                                                        <md-icon slot="icon">edit_square</md-icon>
                                                        Assign
                                                    </md-text-button>
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
            <div
                slot="actions"
                style={{
                    padding: '24px',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    display: 'flex',
                    gap: '16px',
                    width: '100%',
                }}
            >
                <md-text-button onClick={onClose} disabled={isSubmitting} style={{flex: 1}}>Cancel</md-text-button>
                <md-filled-button onClick={handleSubmit} disabled={isSubmitting} style={{flex: 2}}>
                    <md-icon slot="icon">verified</md-icon>
                    Synchronize Roster
                </md-filled-button>
            </div>
        </md-dialog>
    );
};

export default EntityAssignmentModal;
