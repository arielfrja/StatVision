/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Player, PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import Toast from '@/components/Toast';
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

interface AssignmentDiff {
    movedEvents: number;
    newHomeAway: { homeTeamId: string | null; awayTeamId: string | null };
    newStatus: string;
}

type ModalStep = 'edit' | 'review' | 'done';

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

    // Review / result / feedback state
    const [step, setStep] = useState<ModalStep>('edit');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [appliedDiffs, setAppliedDiffs] = useState<AssignmentDiff[]>([]);
    const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (isOpen && gameId) {
            setStep('edit');
            setSubmitError(null);
            setAppliedDiffs([]);
            fetchInitialData();
        }
    }, [isOpen, gameId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        setLoadError(null);
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

        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to load assignment data. Please try again.';
            logger.error('Error fetching assignment data', { gameId, message: error?.message });
            setLoadError(message);
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

    // Planned before → after rows for the review step.
    const plannedTeamMoves = Object.entries(teamMappings)
        .filter(([_, officialId]) => officialId !== '')
        .map(([tempTeamId, officialTeamId]) => ({
            tempTeamId,
            officialTeamId,
            before: identifiedEntities.find(t => t.id === tempTeamId)?.name || 'Temporary group',
            after: officialTeams.find(t => t.id === officialTeamId)?.name || 'Official team',
        }));
    const plannedPlayerMoves = Object.entries(playerMappings)
        .filter(([_, officialId]) => officialId !== '')
        .map(([tempPlayerId, officialPlayerId]) => {
            const tempName = identifiedEntities.flatMap(t => t.players).find(p => p.id === tempPlayerId)?.name || 'Identified player';
            const official = officialPlayers.find(ph => ph.player.id === officialPlayerId);
            return {
                tempPlayerId,
                officialPlayerId,
                before: tempName,
                after: official ? `${official.player.name} (#${official.jerseyNumber ?? '?'})` : 'Official roster',
            };
        });
    const hasPlannedMoves = plannedTeamMoves.length > 0 || plannedPlayerMoves.length > 0;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = {
                teamMappings: plannedTeamMoves.map(({ tempTeamId, officialTeamId }) => ({ tempTeamId, officialTeamId })),
                playerMappings: plannedPlayerMoves.map(({ tempPlayerId, officialPlayerId }) => ({ tempPlayerId, officialPlayerId }))
            };

            const response = await apiClient.post(`/games/${gameId}/assignment`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const diffs: AssignmentDiff[] = response.data?.diffs ?? [];
            setAppliedDiffs(diffs);
            setStep('done');
            const movedTotal = diffs.reduce((sum, d) => sum + (d?.movedEvents ?? 0), 0);
            setToast({ message: `Roster synchronized — ${movedTotal} event${movedTotal === 1 ? '' : 's'} reassigned.`, kind: 'success' });
            logger.info('Entity assignment completed', { gameId, moves: data.teamMappings.length + data.playerMappings.length, movedTotal });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to synchronize roster. Please try again.';
            logger.error('Error submitting assignments', { gameId, message: error?.message });
            setSubmitError(message);
            setStep('edit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDone = () => {
        onAssignmentComplete();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
        <md-dialog open={isOpen} onclose={onClose}>
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
                    gap: '24px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    overflowY: 'auto',
                    maxHeight: '60vh',
                }}
            >
                {loadError && (
                    <div role="alert" style={{
                        padding: '12px 16px',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
                        borderRadius: '6px',
                        color: 'var(--md-sys-color-error)',
                        fontSize: '12px',
                        fontWeight: 600,
                    }}>
                        {loadError}
                        <div style={{ marginTop: '8px' }}>
                            <md-text-button onClick={fetchInitialData}>Retry</md-text-button>
                        </div>
                    </div>
                )}
                {submitError && (
                    <div role="alert" style={{
                        padding: '12px 16px',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
                        borderRadius: '6px',
                        color: 'var(--md-sys-color-error)',
                        fontSize: '12px',
                        fontWeight: 600,
                    }}>
                        {submitError}
                    </div>
                )}
                {isLoading ? (
                    <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
                        <md-circular-progress indeterminate></md-circular-progress>
                    </div>
                ) : step === 'done' ? (
                    <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface)' }}>
                            Applied changes
                        </h3>
                        {appliedDiffs.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                Assignments saved. No per-mapping diffs were returned.
                            </p>
                        ) : (
                            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {appliedDiffs.map((d, i) => (
                                    <li key={i}>
                                        {d.movedEvents} event{d.movedEvents === 1 ? '' : 's'} reassigned
                                        {' '}· status {d.newStatus}
                                        {(d.newHomeAway?.homeTeamId || d.newHomeAway?.awayTeamId) && (
                                            <> · home {d.newHomeAway.homeTeamId ? d.newHomeAway.homeTeamId.slice(0, 8) : '—'} / away {d.newHomeAway.awayTeamId ? d.newHomeAway.awayTeamId.slice(0, 8) : '—'}</>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : step === 'review' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-live="polite">
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface)' }}>
                            Review before → after
                        </h3>
                        {plannedTeamMoves.map(m => (
                            <div key={m.tempTeamId} style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <md-icon>group</md-icon>
                                <span><strong>{m.before}</strong> → <strong>{m.after}</strong> (team)</span>
                            </div>
                        ))}
                        {plannedPlayerMoves.map(m => (
                            <div key={m.tempPlayerId} style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <md-icon>person</md-icon>
                                <span><strong>{m.before}</strong> → <strong>{m.after}</strong> (player)</span>
                            </div>
                        ))}
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Confirm to reassign events and recalculate stats.
                        </p>
                    </div>
                ) : identifiedEntities.length === 0 ? (
                    <div style={{ padding: '64px 0', textAlign: 'center' }}>
                        <md-icon>person_off</md-icon>
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
                {step === 'done' ? (
                    <md-filled-button onClick={handleDone}>
                        <md-icon slot="icon">check</md-icon>
                        Done
                    </md-filled-button>
                ) : step === 'review' ? (
                    <>
                        <md-text-button onClick={() => setStep('edit')} disabled={isSubmitting}>Back</md-text-button>
                        <md-filled-button onClick={handleSubmit} disabled={isSubmitting}>
                            <md-icon slot="icon">verified</md-icon>
                            {isSubmitting ? 'Synchronizing…' : 'Confirm & Synchronize'}
                        </md-filled-button>
                    </>
                ) : (
                    <>
                        <md-text-button onClick={onClose} disabled={isSubmitting}>Cancel</md-text-button>
                        <md-filled-button onClick={() => setStep('review')} disabled={isSubmitting || !hasPlannedMoves}>
                            <md-icon slot="icon">preview</md-icon>
                            Review Changes
                        </md-filled-button>
                    </>
                )}
            </div>
        </md-dialog>
        {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
        </>
    );
};

export default EntityAssignmentModal;
