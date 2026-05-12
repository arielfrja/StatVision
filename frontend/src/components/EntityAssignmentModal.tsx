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

            setIdentifiedEntities(identifiedRes.data.filter(t => t.isTemp));
            setOfficialTeams(teamsRes.data.filter(t => !t.isTemp));
            setOfficialPlayers(playersRes.data.filter(ph => !ph.player.isTemp));

            // Initialize mappings with empty values
            const initialTeamMappings: { [key: string]: string } = {};
            identifiedRes.data.filter(t => t.isTemp).forEach(t => initialTeamMappings[t.id] = '');
            setTeamMappings(initialTeamMappings);

            const initialPlayerMappings: { [key: string]: string } = {};
            identifiedRes.data.filter(t => t.isTemp).forEach(t => {
                t.players.forEach(p => initialPlayerMappings[p.id] = '');
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
    };

    const handlePlayerMappingChange = (tempId: string, officialId: string) => {
        setPlayerMappings(prev => ({ ...prev, [tempId]: officialId }));
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
        <md-dialog open={isOpen} onclose={onClose} style={{ maxWidth: '800px', width: '90vw' }} className="rounded-[32px] overflow-hidden">
            <div slot="headline" className="font-black italic uppercase tracking-tight text-xl p-6 border-b border-bd-ghost bg-container-low text-electric">
                Finalize Roster Assignments
            </div>
            <div slot="content" className="p-8 flex flex-col gap-8 bg-container overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                    <div className="py-12">
                        <Loader size="large" label="Retrieving Entities" />
                    </div>
                ) : identifiedEntities.length === 0 ? (
                    <div className="py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-tx-dim mb-4">person_off</span>
                        <p className="text-tx-dim font-black uppercase tracking-widest text-[10px]">No temporary entities to assign</p>
                    </div>
                ) : (
                    identifiedEntities.map(tempTeam => (
                        <div key={tempTeam.id} className="p-8 border border-bd-ghost rounded-[24px] bg-container-low relative overflow-hidden group">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-electric/20 group-hover:bg-electric transition-colors"></div>
                            
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="font-black italic uppercase text-xl text-white mb-1">{tempTeam.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-tx-dim">Temporary Identification</p>
                                </div>
                                <md-filled-select
                                    label="Assign to Official Team"
                                    value={teamMappings[tempTeam.id] || ''}
                                    onchange={(e: any) => handleTeamMappingChange(tempTeam.id, e.target.value)}
                                    className="min-w-[280px]"
                                >
                                    <md-select-option value=""><span>Select Team...</span></md-select-option>
                                    {officialTeams.map(team => (
                                        <md-select-option key={team.id} value={team.id}>
                                            <span>{team.name}</span>
                                        </md-select-option>
                                    ))}
                                </md-filled-select>
                            </div>

                            <div className="flex flex-col gap-6 pl-8 border-l border-bd-ghost ml-2">
                                {tempTeam.players.map(tempPlayer => (
                                    <div key={tempPlayer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-container-high border border-transparent hover:border-bd-ghost transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-container-highest flex items-center justify-center text-[10px] font-black text-electric border border-bd-ghost">
                                                {tempPlayer.jerseyNumber || '?'}
                                            </div>
                                            <span className="text-sm font-bold text-tx-secondary uppercase tracking-tight group-hover:text-white transition-colors">
                                                {tempPlayer.name}
                                            </span>
                                        </div>
                                        <md-filled-select
                                            label="Assign to Official Player"
                                            value={playerMappings[tempPlayer.id] || ''}
                                            onchange={(e: any) => handlePlayerMappingChange(tempPlayer.id, e.target.value)}
                                            className="min-w-[240px]"
                                        >
                                            <md-select-option value=""><span>Select Player...</span></md-select-option>
                                            {officialPlayers
                                                .filter(ph => !teamMappings[tempTeam.id] || ph.teamId === teamMappings[tempTeam.id])
                                                .map(ph => (
                                                <md-select-option key={ph.player.id} value={ph.player.id}>
                                                    <span>{ph.player.name} (#{ph.jerseyNumber})</span>
                                                </md-select-option>
                                            ))}
                                        </md-filled-select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div slot="actions" className="p-6 border-t border-bd-ghost bg-container-low flex gap-4 w-full">
                <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-[2]" icon="verified">
                    Confirm Assignments
                </Button>
            </div>
        </md-dialog>
    );
};

export default EntityAssignmentModal;
