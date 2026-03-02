import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Player, PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import Loader from './Loader';

// Import Material Web Components
import '@material/web/button/filled-button.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';

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
                axios.get<TeamWithPlayers[]>(`http://localhost:3000/games/${gameId}/identified-entities`, { headers }),
                axios.get<Team[]>(`http://localhost:3000/teams`, { headers }),
                axios.get<PlayerTeamHistory[]>(`http://localhost:3000/players`, { headers })
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
        setIsLoading(true);
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

            await axios.post(`http://localhost:3000/games/${gameId}/assignment`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onAssignmentComplete();
            onClose();
        } catch (error) {
            console.error("Error submitting assignments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <md-dialog open={isOpen} onclose={onClose} style={{ maxWidth: '800px', width: '90vw' }}>
            <div slot="headline">Finalize Roster Assignments</div>
            <div slot="content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {isLoading ? (
                    <Loader />
                ) : identifiedEntities.length === 0 ? (
                    <p>No temporary entities to assign.</p>
                ) : (
                    identifiedEntities.map(tempTeam => (
                        <div key={tempTeam.id} style={{ padding: 'var(--spacing-md)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--border-radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                <h3 style={{ margin: 0 }}>{tempTeam.name}</h3>
                                <md-filled-select
                                    label="Assign to Official Team"
                                    value={teamMappings[tempTeam.id] || ''}
                                    onchange={(e: any) => handleTeamMappingChange(tempTeam.id, e.target.value)}
                                    style={{ minWidth: '200px' }}
                                >
                                    <md-select-option value=""><span>Select Team...</span></md-select-option>
                                    {officialTeams.map(team => (
                                        <md-select-option key={team.id} value={team.id}>
                                            <span>{team.name}</span>
                                        </md-select-option>
                                    ))}
                                </md-filled-select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)' }}>
                                {tempTeam.players.map(tempPlayer => (
                                    <div key={tempPlayer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>{tempPlayer.name} {tempPlayer.jerseyNumber ? `(#${tempPlayer.jerseyNumber})` : ''}</span>
                                        <md-filled-select
                                            label="Assign to Official Player"
                                            value={playerMappings[tempPlayer.id] || ''}
                                            onchange={(e: any) => handlePlayerMappingChange(tempPlayer.id, e.target.value)}
                                            style={{ minWidth: '200px' }}
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
            <div slot="actions">
                <md-text-button onClick={onClose}>Cancel</md-text-button>
                <md-filled-button onClick={handleSubmit} disabled={isLoading}>
                    Confirm Assignments
                </md-filled-button>
            </div>
        </md-dialog>
    );
};

export default EntityAssignmentModal;