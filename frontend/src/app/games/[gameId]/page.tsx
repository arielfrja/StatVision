'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Game } from '@/types/game';
import { PlayerTeamHistory } from '@/types/player';
import Loader from '@/components/Loader';
import axios from 'axios';

// Import the new CSS file
import '../../analysis-table.css';

// Import Material Web Components
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

// Dynamically import ReactPlayer to avoid SSR issues
const ClientVideoPlayer = dynamic(() => import('react-player'), { ssr: false });

const VideoPlayer = ({ videoUrl, playerRef }: { videoUrl: string | null, playerRef: React.RefObject<any> }) => {
    if (!videoUrl) {
        return (
            <div style={{ height: '100%', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
                <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>videocam_off</md-icon>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No video linked to this game.</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-elevation-2)' }}>
            <ClientVideoPlayer
                ref={playerRef}
                url={videoUrl}
                width='100%'
                height='100%'
                controls={true}
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'anonymous'
                        }
                    }
                }}
            />
        </div>
    );
};

interface PlayByPlayFeedProps {
    events: any[];
    onRowClick: (time: number) => void;
    allPlayers: PlayerTeamHistory[];
    onAssignPlayer: (gameEventId: string, playerId: string | null) => void;
}

const PlayByPlayFeed = ({ events, onRowClick, allPlayers, onAssignPlayer }: PlayByPlayFeedProps) => {
    if (!events || events.length === 0) return <p style={{padding: 'var(--spacing-md)'}}>No events found.</p>;

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
                    {events.map((event) => (
                        <tr
                            key={event.id}
                            className="interactive"
                            onClick={() => onRowClick(event.absoluteTimestamp)}
                        >
                            <td>{event.absoluteTimestamp.toFixed(1)}s</td>
                            <td>{event.eventType}</td>
                            <td>
                                <md-filled-select
                                    label="Assign Player"
                                    value={event.assignedPlayerId || ''}
                                    onchange={(e: any) => onAssignPlayer(event.id, e.target.value || null)}
                                    style={{ width: '100%' }}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent row click when changing player
                                >
                                    <md-select-option value=""><span>Unassigned</span></md-select-option>
                                    {allPlayers.map(playerHistory => (
                                        <md-select-option key={playerHistory.playerId} value={playerHistory.playerId}>
                                            <span>{playerHistory.player.name} {playerHistory.jerseyNumber ? `(#${playerHistory.jerseyNumber})` : ''}</span>
                                        </md-select-option>
                                    ))}
                                </md-filled-select>
                            </td>
                            <td>{JSON.stringify(event.eventDetails)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BoxScoreTable = ({ game }: { game: Game }) => {
    const teamAStats = game.teamStats.find(s => s.teamId === game.homeTeamId);
    const teamBStats = game.teamStats.find(s => s.teamId === game.awayTeamId);

    const statsHeaders = ['Team', 'PTS', 'REB', 'AST'];
    const teamStats = [
        { name: game.homeTeam?.name || 'Home Team', stats: teamAStats },
        { name: game.awayTeam?.name || 'Away Team', stats: teamBStats },
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
        </div>
    );
};

function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
    const router = useRouter();
    const [game, setGame] = useState<Game | null>(null);
    const playerRef = useRef(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState<'boxscore' | 'pbp'>('boxscore');
    const [isRetrying, setIsRetrying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [allPlayers, setAllPlayers] = useState<PlayerTeamHistory[]>([]);

    const handleSeek = (time: number) => {
        if (playerRef.current && typeof (playerRef.current as any).seekTo === 'function') {
            (playerRef.current as any).seekTo(time, 'seconds');
        }
    };

    const fetchGameDetails = useCallback(async () => {
        if (!gameId) {
            setError("Game ID is missing.");
            setIsDataLoading(false);
            return;
        }
        setIsDataLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const gameResponse = await axios.get(`http://localhost:3000/games/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const fetchedGame = gameResponse.data;
            setGame(fetchedGame);

            let players: PlayerTeamHistory[] = [];
            if (fetchedGame.homeTeamId) {
                const homeTeamPlayersResponse = await axios.get(`http://localhost:3000/teams/${fetchedGame.homeTeamId}/players`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                players = [...players, ...homeTeamPlayersResponse.data];
            }
            if (fetchedGame.awayTeamId) {
                const awayTeamPlayersResponse = await axios.get(`http://localhost:3000/teams/${fetchedGame.awayTeamId}/players`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                players = [...players, ...awayTeamPlayersResponse.data];
            }
            setAllPlayers(players);
        } catch (err: any) {
            console.error("An error occurred in fetchGameDetails:", err);
            setError(err.message || "Failed to fetch game details.");
        } finally {
            setIsDataLoading(false);
        }
    }, [gameId, getAccessTokenSilently]);

    const handleAssignPlayer = useCallback(async (gameEventId: string, playerId: string | null) => {
        try {
            const token = await getAccessTokenSilently();
            await axios.put(`http://localhost:3000/game-events/${gameEventId}/assign-player`, { playerId }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            setGame(prevGame => {
                if (!prevGame) return null;
                const updatedEvents = prevGame.events.map(event =>
                    event.id === gameEventId ? { ...event, assignedPlayerId: playerId, assignedPlayer: allPlayers.find(p => p.playerId === playerId)?.player || null } : event
                );
                return { ...prevGame, events: updatedEvents };
            });
        } catch (err: any) {
            console.error("Error assigning player:", err);
            setError(err.message || "Failed to assign player.");
            fetchGameDetails(); // Re-fetch to revert optimistic update
        }
    }, [getAccessTokenSilently, allPlayers, fetchGameDetails]);

    const handleRetryAnalysis = async () => {
        setIsRetrying(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            await axios.post(`http://localhost:3000/games/${gameId}/retry-analysis`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Re-fetch game data to get the updated status
            await fetchGameDetails();
        } catch (err: any) {
            console.error("Failed to retry analysis:", err);
            setError(err.message || "Could not retry analysis.");
        } finally {
            setIsRetrying(false);
        }
    };

    const handleDeleteGame = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            await axios.delete(`http://localhost:3000/games/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // On successful deletion, navigate away from the page
            router.push('/games');
        } catch (err: any) {
            console.error("Failed to delete game:", err);
            setError(err.message || "Could not delete the game.");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Effect for fetching data
    useEffect(() => {
        if (isAuthenticated && gameId) {
            fetchGameDetails();
        }
    }, [isAuthenticated, gameId, fetchGameDetails]);

    // Effect for handling window resize for mobile view
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const TabButton = ({ tabId, label }: { tabId: 'boxscore' | 'pbp', label: string }) => (
        <md-filled-button
            onClick={() => setActiveTab(tabId)}
            style={{
                flexGrow: 1,
                opacity: activeTab === tabId ? 1 : 0.6,
                '--md-filled-button-container-color': activeTab === tabId ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                '--md-filled-button-label-text-color': activeTab === tabId ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
            }}
        >
            {label}
        </md-filled-button>
    );

    if (isLoading || (isDataLoading && !game)) {
        return <Loader />;
    }

    if (!game) {
        return (
            <main style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Error Loading Game</h1>
                <p style={{ color: 'var(--md-sys-color-error)' }}>{error || "Game data could not be loaded or does not exist."}</p>
            </main>
        );
    }

    return (
        <main style={{ padding: 'var(--spacing-md)' }}>
            <h1 style={{ marginBottom: 'var(--spacing-md)' }}>{game.name || 'Untitled Game'}</h1>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {game.homeTeam?.name || 'Home Team'} vs {game.awayTeam?.name || 'Away Team'}
            </p>

            {game.status === 'ANALYSIS_FAILED_RETRYABLE' && (
                <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <md-filled-button onClick={handleRetryAnalysis} disabled={isRetrying}>
                        {isRetrying ? 'Retrying...' : 'Retry Analysis'}
                    </md-filled-button>
                </div>
            )}
            
            {/* Display general errors here */}
            {error && <p style={{ color: 'var(--md-sys-color-error)', marginBottom: 'var(--spacing-lg)' }}>Error: {error}</p>}

            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <md-filled-button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}>
                    <md-icon slot="icon">delete</md-icon>
                    Delete Game
                </md-filled-button>
            </div>

            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-3)', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Confirm Deletion</h3>
                        <p style={{ marginBottom: 'var(--spacing-lg)' }}>Are you sure you want to delete this game? This action cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
                            <md-filled-button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</md-filled-button>
                            <md-filled-button onClick={handleDeleteGame} disabled={isDeleting} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </md-filled-button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Layout */}
            {!isMobile && (
                <div className="analysis-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <div style={{ flexGrow: 1, minHeight: '300px' }}>
                            <VideoPlayer videoUrl={game.videoUrl} playerRef={playerRef} />
                        </div>
                        <div style={{ height: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
                            <BoxScoreTable game={game} />
                        </div>
                    </div>
                    <div style={{ overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
                        <PlayByPlayFeed events={game.events || []} onRowClick={handleSeek} allPlayers={allPlayers} onAssignPlayer={handleAssignPlayer} />
                    </div>
                </div>
            )}

            {/* Mobile Layout */}
            {isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ minHeight: '200px' }}>
                        <VideoPlayer videoUrl={game.videoUrl} playerRef={playerRef} />
                    </div>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)', padding: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            <TabButton tabId="boxscore" label="Box Score" />
                            <TabButton tabId="pbp" label="Play-by-Play" />
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {activeTab === 'boxscore' && <BoxScoreTable game={game} />}
                            {activeTab === 'pbp' && <PlayByPlayFeed events={game.events || []} onRowClick={handleSeek} allPlayers={allPlayers} onAssignPlayer={handleAssignPlayer} />}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AnalysisPage;
