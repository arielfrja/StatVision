'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { Game } from '@/types/game';
import Loader from '@/components/Loader';
import axios from 'axios';
import { useParams } from 'next/navigation';

// Import the new CSS file
import '../analysis-table.css';

// Import Material Web Components
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/tab.js';

// Placeholder Components (FE-502, FE-503, FE-504)
const VideoPlayer = () => <div style={{ height: '100%', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Video Player (FE-502)</div>;
const PlayByPlayFeed = ({ events }: { events: any[] }) => {
    if (events.length === 0) return <p>No events found.</p>;
    
    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Play-by-Play</h2>
            <table className="md-table interactive">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Player</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event, index) => (
                        <tr key={index} className="interactive" onClick={() => console.log(`Jump to ${event.absoluteTimestamp}s`)}>
                            <td>{event.absoluteTimestamp.toFixed(1)}s</td>
                            <td>{event.eventType}</td>
                            <td>{event.assignedPlayer?.name || 'Unassigned'}</td>
                            <td>{JSON.stringify(event.eventDetails)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
const BoxScoreTable = () => <div style={{ padding: 'var(--spacing-md)' }}>Box Score (FE-504)</div>;


function AnalysisPage() {
    const { gameId } = useParams();
    const { getAccessTokenSilently } = useAuth0();
    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGameDetails();
    }, [gameId, getAccessTokenSilently]);

    const fetchGameDetails = async () => {
        if (!gameId) {
            setError("Game ID is missing.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();

            const response = await axios.get(`http://localhost:3000/games/${gameId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setGame(response.data);
        } catch (error: any) {
            console.error("An error occurred in fetchGameDetails:", error);
            setError(error.message || "Failed to fetch game details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader />
            </main>
        );
    }

    if (error || !game) {
        return (
            <main style={{ padding: 'var(--spacing-md)', color: 'var(--md-sys-color-error)' }}>
                <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Error Loading Game</h1>
                <p>{error || "Game not found or access denied."}</p>
            </main>
        );
    }

    const teamA = game.assignedTeamA?.name || 'Team A';
    const teamB = game.assignedTeamB?.name || 'Team B';

    return (
        <main style={{ padding: 'var(--spacing-md)' }}>
            <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Game Analysis: {teamA} vs {teamB}</h1>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-on-surface-variant)' }}>Status: {game.status}</p>

            {/* Multi-Panel Layout (FE-501) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)', height: 'calc(100vh - 200px)' }}>
                
                {/* Left Panel: Video Player */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div style={{ flexGrow: 1, minHeight: '300px' }}>
                        <VideoPlayer />
                    </div>
                    
                    {/* Box Score (Bottom Left) */}
                    <div style={{ height: '200px', overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--spacing-md)' }}>
                        <BoxScoreTable />
                    </div>
                </div>

                {/* Right Panel: Play-by-Play Feed */}
                <div style={{ overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--spacing-md)' }}>
                    <PlayByPlayFeed events={game.events || []} />
                </div>
            </div>
        </main>
    );
}

export default withAuthenticationRequired(AnalysisPage, {
    onRedirecting: () => {
        return <Loader />;
    },
});
