import React from 'react';
import { Player } from '@/types/player';
import { Team } from '@/types/team';
import Loader from './Loader';
import useSWR from 'swr';

// Add a 'players' property to the Team type and enrich the Player type for this component
type EnrichedPlayer = Player & { 
    jerseyNumber?: number | null; 
    description?: string | null;
    teamAssignmentConfidence?: number;
};
type TeamWithPlayers = Team & { players: EnrichedPlayer[] };

interface IdentifiedEntitiesTableProps {
    gameId: string;
}

const IdentifiedEntitiesTable: React.FC<IdentifiedEntitiesTableProps> = ({ gameId }) => {
    const { data: teamsWithPlayers, error, isLoading, mutate } = useSWR<TeamWithPlayers[]>(gameId ? `/games/${gameId}/identified-entities` : null);

    const handleSwitchTeam = async (playerId: string) => {
        try {
            await apiClient.put(`/players/${playerId}/switch-team`, { gameId });
            mutate();
        } catch (err) {
            console.error("Failed to switch team:", err);
            alert("Failed to switch team.");
        }
    };

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <p style={{ color: 'var(--md-sys-color-error)' }}>{error.message || "Failed to fetch identified entities."}</p>;
    }

    if (!teamsWithPlayers || teamsWithPlayers.length === 0) {
        return <p style={{ padding: 'var(--spacing-md)' }}>No teams or players identified in game events yet.</p>;
    }

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Identified Teams & Players</h2>
            
            {teamsWithPlayers.map(team => (
                <div key={team.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
                    {/* Display Team Info Data */}
                    <div style={{ padding: 'var(--spacing-md)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--border-radius-md)', marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>{team.name}</h3>
                            <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>Type: {team.isTemp ? 'Auto-Detected Group' : 'Official Team'}</p>
                        </div>
                    </div>

                    {/* Display Player Info Data for the Team */}
                    {team.players.length > 0 ? (
                        <div className="md-scrollable-table-container">
                            <table className="md-table md-player-stats-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Jersey #</th>
                                        <th>Description</th>
                                        <th>Confidence</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.players.map((player) => (
                                        <tr key={player.id}>
                                            <td>{player.name}</td>
                                            <td>{player.jerseyNumber ?? '-'}</td>
                                            <td>{player.description ?? '-'}</td>
                                            <td>
                                                {player.teamAssignmentConfidence ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <md-linear-progress value={player.teamAssignmentConfidence} style={{ width: '60px' }}></md-linear-progress>
                                                        <span style={{ fontSize: '12px' }}>{Math.round(player.teamAssignmentConfidence * 100)}%</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <md-outlined-button onClick={() => handleSwitchTeam(player.id)} style={{ '--md-outlined-button-label-text-size': '12px' }}>
                                                    Switch Team
                                                </md-outlined-button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ paddingLeft: 'var(--spacing-md)' }}>No players identified for this team in game events.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default IdentifiedEntitiesTable;