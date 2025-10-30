'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactPlayer from 'react-player';
import { Game } from '@/types/game';
import { GameTeamStats } from '@/types/stats';
import Loader from '@/components/Loader';
import axios from 'axios';

// Import the new CSS file
import '../../analysis-table.css';

// Import Material Web Components
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';

// Implemented Components (FE-502, FE-503, FE-504)
const ClientVideoPlayer = dynamic(() => import('react-player'), { ssr: false });

const VideoPlayer = ({ videoUrl, playerRef }: { videoUrl: string | null, playerRef: React.RefObject<any> }) => {
    if (!videoUrl) {
        return (
            <div style={{ height: '100%', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--spacing-md)' }}>
                <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>videocam_off</md-icon>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No video linked to this game (MVP Scope).</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', paddingTop: '56.25%', height: 0 }}>
            <ClientVideoPlayer
                ref={playerRef}
                url={videoUrl}
                width='100%'
                height='100%'
                style={{ position: 'absolute', top: 0, left: 0 }}
                controls={true}
                config={{
                    file: {
                        attributes: {
                            // Allows playing local files (e.g., from /tmp/dummy_video.mp4)
                            crossOrigin: 'anonymous' 
                        }
                    }
                }}
            />
        </div>
    );
};

const PlayByPlayFeed = ({ events, onRowClick }: { events: any[], onRowClick: (time: number) => void }) => {
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
                        <tr 
                            key={index} 
                            className="interactive" 
                            onClick={() => onRowClick(event.absoluteTimestamp)}
                        >
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

const BoxScoreTable = ({ game }: { game: Game }) => {
    // Filter stats for the two assigned teams
    const teamAStats = game.teamStats.find(s => s.teamId === game.assignedTeamAId);
    const teamBStats = game.teamStats.find(s => s.teamId === game.assignedTeamBId);

    const statsHeaders = ['Team', 'PTS', 'REB', 'AST'];
    const teamStats = [
        { name: game.assignedTeamA?.name || 'Team A', stats: teamAStats },
        { name: game.assignedTeamB?.name || 'Team B', stats: teamBStats },
    ];

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Box Score (Team Totals)</h2>
            <table className="md-table md-box-score-table">
                <thead>
                    <tr>
                        {statsHeaders.map(header => <th key={header}>{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {teamStats.map((team, index) => (
                        <tr key={index}>
                            <td style={{ fontWeight: 'bold' }}>{team.name}</td>
                            <td>{team.stats?.points ?? 0}</td>
                            <td>{team.stats?.rebounds ?? 0}</td>
                            <td>{team.stats?.assists ?? 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Player stats table would go here */}
        </div>
    );
};


function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
    const router = useRouter();
    const [game, setGame] = useState<Game | null>(null);
    const playerRef = useRef(null); // Ref for the ReactPlayer instance
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Manual Authentication Check
    if (isLoading) {
        return (
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader />
            </main>
        );
    }

    if (!isAuthenticated) {
        router.push('/'); // Redirect to home/login page
        return null;
    }

    const handleSeek = (time: number) => {
        if (playerRef.current) {
            (playerRef.current as any).seekTo(time, 'seconds');
        }
    };

    const fetchGameDetails = async () => {
        if (!gameId) {
            setError("Game ID is missing.");
            setIsDataLoading(false);
            return;
        }

        setIsDataLoading(true);
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
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        fetchGameDetails();
    }, [gameId, getAccessTokenSilently]);

    useEffect(() => {
        fetchGameDetails();
    }, [gameId, getAccessTokenSilently]);

    if (isDataLoading) {
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
                        <VideoPlayer videoUrl={game.videoUrl} playerRef={playerRef} />
                    </div>
                    
                    {/* Box Score (Bottom Left) */}
                    <div style={{ height: '200px', overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--spacing-md)' }}>
                        <BoxScoreTable game={game} />
                    </div>
                </div>

                {/* Right Panel: Play-by-Play Feed */}
                <div style={{ overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--spacing-md)' }}>
                    <PlayByPlayFeed events={game.events || []} onRowClick={handleSeek} />
                </div>
            </div>
        </main>
    );
}

export default AnalysisPage;