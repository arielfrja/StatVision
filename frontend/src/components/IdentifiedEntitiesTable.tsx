import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Player } from '@/types/player';
import { Team } from '@/types/team';
import Loader from './Loader';

// Add a 'players' property to the Team type and enrich the Player type for this component
type EnrichedPlayer = Player & { jerseyNumber?: number | null; description?: string | null };
type TeamWithPlayers = Team & { players: EnrichedPlayer[] };

interface IdentifiedEntitiesTableProps {
    gameId: string;
}

const IdentifiedEntitiesTable: React.FC<IdentifiedEntitiesTableProps> = ({ gameId }) => {
    const [teamsWithPlayers, setTeamsWithPlayers] = useState<TeamWithPlayers[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchIdentifiedEntities = async () => {
            if (!gameId) return;

            setIsLoading(true);
            setError(null);
            try {
                const token = await getAccessTokenSilently();
                const response = await axios.get<TeamWithPlayers[]>(`http://localhost:3000/games/${gameId}/identified-entities`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTeamsWithPlayers(response.data);
            } catch (err: any) {
                setError(err.message || "Failed to fetch identified entities.");
                console.error("Error fetching identified entities:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIdentifiedEntities();
    }, [gameId, getAccessTokenSilently]);

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <p style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>;
    }

    if (!teamsWithPlayers || teamsWithPlayers.length === 0) {
        return <p>No teams or players identified in game events.</p>;
    }

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Identified Teams & Players</h2>
            
            {teamsWithPlayers.map(team => (
                <div key={team.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
                    {/* Display Team Info Data */}
                    <div style={{ padding: 'var(--spacing-md)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--border-radius-md)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>{team.name}</h3>
                        <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>Created: {new Date(team.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Display Player Info Data for the Team */}
                    {team.players.length > 0 ? (
                        <div className="md-scrollable-table-container">
                            <table className="md-table md-player-stats-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Jersey #</th>
                                        <th>Position</th>
                                        <th>Height (cm)</th>
                                        <th>Weight (kg)</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.players.map((player) => (
                                        <tr key={player.id}>
                                            <td>{player.name}</td>
                                            <td>{player.jerseyNumber ?? '-'}</td>
                                            <td>{player.position ?? '-'}</td>
                                            <td>{player.height ?? '-'}</td>
                                            <td>{player.weight ?? '-'}</td>
                                            <td>{player.description ?? '-'}</td>
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