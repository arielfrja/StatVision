'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, useParams } from 'next/navigation';
import { Game } from '@/types/game';
import { Team } from '@/types/team';
import { PlayerTeamHistory } from '@/types/player';
import { GameEvent } from '@/types/gameEvent';
import Loader from '@/components/Loader';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';

// Components
import VideoPlayer from '@/components/analysis/VideoPlayer';
import TimelineReview from '@/components/analysis/TimelineReview';
import EventEditor from '@/components/analysis/EventEditor';
import BoxScoreTable from '@/components/analysis/BoxScoreTable';
import PlayByPlayFeed from '@/components/analysis/PlayByPlayFeed';
import TeamAndPlayerTables from '@/components/TeamAndPlayerTables';
import IdentifiedEntitiesTable from '@/components/IdentifiedEntitiesTable';
import EntityAssignmentModal from '@/components/EntityAssignmentModal';
import StatSelectionControl from '@/components/StatSelectionControl';

// CSS and Material
import '../../analysis-table.css';
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/progress/linear-progress.js';

function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const playerRef = useRef(null);

    // Data Fetching
    const { data: game, error, isLoading: isDataLoading, mutate } = useSWR<Game>(gameId ? `/games/${gameId}` : null, {
        refreshInterval: (data) => (data && (data.status === 'PROCESSING' || data.status === 'UPLOADED')) ? 3000 : 0,
    });
    const { data: allTeamsData } = useSWR<Team[]>('/teams');
    const { data: allPlayersData } = useSWR<PlayerTeamHistory[]>('/players');

    // UI State
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState<'boxscore' | 'pbp' | 'playerstats' | 'identified_player'>('boxscore');
    const [isRetrying, setIsRetrying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [visibleStats, setVisibleStats] = useState<string[]>([]);

    // Timeline & Editor State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

    // Handlers
    const handleSeek = (time: number) => {
        if (playerRef.current && typeof (playerRef.current as any).seekTo === 'function') {
            (playerRef.current as any).seekTo(time, 'seconds');
            setCurrentTime(time);
        }
    };

    const handleProgress = (state: { playedSeconds: number }) => {
        setCurrentTime(state.playedSeconds);
    };

    const handleDuration = (dur: number) => {
        setDuration(dur);
    };

    const handleEventClick = (event: GameEvent) => {
        handleSeek(event.absoluteTimestamp);
        setSelectedEvent(event);
    };

    const handleSaveEvent = async (updatedEvent: Partial<GameEvent>) => {
        try {
            await apiClient.put(`/game-events/${updatedEvent.id}`, updatedEvent);
            mutate(); // Refresh data
            setSelectedEvent(null);
        } catch (err: any) {
            console.error("Error saving event:", err);
            alert("Failed to save changes.");
        }
    };

    const handleAssignPlayer = useCallback(async (gameEventId: string, playerId: string | null) => {
        try {
            await apiClient.put(`/game-events/${gameEventId}/assign-player`, { playerId });
            mutate();
        } catch (err: any) {
            console.error("Error assigning player:", err);
            alert("Failed to assign player.");
        }
    }, [mutate]);

    const handleRetryAnalysis = async () => {
        setIsRetrying(true);
        try {
            await apiClient.post(`/games/${gameId}/retry`);
            mutate();
        } catch (err: any) {
            console.error("Failed to retry analysis:", err);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleDeleteGame = async () => {
        setIsDeleting(true);
        try {
            await apiClient.delete(`/games/${gameId}`);
            router.push('/games');
        } catch (err: any) {
            console.error("Failed to delete game:", err);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const allPlayers: PlayerTeamHistory[] = React.useMemo(() => {
        if (!game || !game.playerStats) return [];
        return game.playerStats
            .filter((ps: any) => ps.player)
            .map((ps: any) => ({
                playerId: ps.playerId,
                jerseyNumber: ps.jerseyNumber,
                description: ps.description,
                player: ps.player,
                teamId: ps.teamId,
            }));
    }, [game]);

    if (isAuthLoading || (isDataLoading && !game)) return <Loader />;

    if (error || !game) {
        return (
            <main style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Error Loading Game</h1>
                <p style={{ color: 'var(--md-sys-color-error)' }}>{error?.message || "Game data could not be loaded."}</p>
                <md-filled-button onClick={() => router.push('/games')}>Back to Dashboard</md-filled-button>
            </main>
        );
    }

    return (
        <main style={{ padding: 'var(--spacing-md)' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h1 style={{ margin: 0 }}>{game.name || 'Untitled Game'}</h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '14px', backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-primary)' }}>
                        {game.status}
                    </span>
                    <md-filled-button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}>
                        <md-icon slot="icon">delete</md-icon>
                        Delete
                    </md-filled-button>
                </div>
            </div>

            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {game.homeTeam?.name || 'Home Team'} vs {game.awayTeam?.name || 'Away Team'} | {game.location || 'Unknown Location'} | {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : 'No Date'}
            </p>

            {/* Analysis Controls */}
            {(game.status === 'ANALYSIS_FAILED_RETRYABLE' || game.status === 'FAILED') && (
                <div style={{ marginBottom: 'var(--spacing-lg)', padding: '16px', backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', borderRadius: '12px' }}>
                    <p style={{ marginBottom: '12px' }}><strong>Analysis Failed:</strong> {game.failureReason || 'An unknown error occurred.'}</p>
                    <md-filled-button onClick={handleRetryAnalysis} disabled={isRetrying}>
                        {isRetrying ? 'Retrying...' : 'Retry Analysis'}
                    </md-filled-button>
                </div>
            )}

            {game.status === 'ANALYZED' && (
                <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <md-filled-button onClick={() => setShowAssignmentModal(true)}>
                        <md-icon slot="icon">assignment_ind</md-icon>
                        Finalize Roster Assignments
                    </md-filled-button>
                </div>
            )}

            {game.status === 'PROCESSING' && (
                <div style={{ marginBottom: 'var(--spacing-lg)', padding: '16px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '12px' }}>Game is currently being analyzed by AI. This usually takes 5-10 minutes.</p>
                    <md-linear-progress indeterminate></md-linear-progress>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Video and Timeline */}
                    <div style={{ position: 'sticky', top: '16px', zIndex: 50, backgroundColor: 'var(--md-sys-color-surface)', padding: '8px', borderRadius: '16px' }}>
                        <VideoPlayer 
                            videoUrl={game.videoUrl} 
                            playerRef={playerRef} 
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                        />
                        {duration > 0 && (
                            <TimelineReview 
                                events={game.events || []}
                                duration={duration}
                                currentTime={currentTime}
                                onEventClick={handleEventClick}
                                onTimelineClick={handleSeek}
                            />
                        )}
                    </div>

                    {/* Stats and Tables */}
                    {!isMobile && (
                        <>
                            <StatSelectionControl onPreferencesChanged={setVisibleStats} />
                            <BoxScoreTable game={game} visibleStats={visibleStats} />
                            <TeamAndPlayerTables game={game} visibleStats={visibleStats} />
                            <IdentifiedEntitiesTable gameId={game.id} />
                        </>
                    )}
                </div>

                {/* Side Panel: Editor or PBP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedEvent ? (
                        <EventEditor 
                            event={selectedEvent}
                            allTeams={[game.homeTeam, game.awayTeam].filter(Boolean) as Team[]}
                            allPlayers={allPlayers}
                            onSave={handleSaveEvent}
                            onCancel={() => setSelectedEvent(null)}
                        />
                    ) : (
                        <div style={{ maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: '16px' }}>
                            <PlayByPlayFeed 
                                events={game.events || []} 
                                onRowClick={handleSeek} 
                                allPlayers={allPlayers} 
                                onAssignPlayer={handleAssignPlayer} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <EntityAssignmentModal
                gameId={game.id}
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssignmentComplete={mutate}
            />

            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-3)', textAlign: 'center', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Confirm Deletion</h3>
                        <p style={{ marginBottom: 'var(--spacing-lg)' }}>Are you sure you want to delete this game?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
                            <md-outlined-button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</md-outlined-button>
                            <md-filled-button onClick={handleDeleteGame} disabled={isDeleting} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}>
                                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </md-filled-button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AnalysisPage;
