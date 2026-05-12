'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { isAuthenticated } = useAuth0();
    const router = useRouter();
    const playerRef = useRef(null);

    // Data Fetching
    const { data: game, error, isLoading: isDataLoading, mutate } = useSWR<Game>(gameId ? `/games/${gameId}` : null, {
        refreshInterval: (data) => (data && (data.status === 'PROCESSING' || data.status === 'UPLOADED')) ? 3000 : 0,
    });

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
            mutate();
            setSelectedEvent(null);
        } catch (err: any) {
            console.error("Error saving event:", err);
        }
    };

    const handleAssignPlayer = useCallback(async (gameEventId: string, playerId: string | null) => {
        try {
            await apiClient.put(`/game-events/${gameEventId}/assign-player`, { playerId });
            mutate();
        } catch (err: any) {
            console.error("Error assigning player:", err);
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
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
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

    if (isDataLoading && !game) return <div className="flex items-center justify-center h-[80vh]"><Loader /></div>;

    if (error || !game) {
        return (
            <div className="p-12 text-center">
                <h1 className="text-2xl font-black italic uppercase mb-4">Error Loading Intelligence</h1>
                <button onClick={() => router.push('/games')} className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-electric transition-all">Back to Gallery</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto pb-16">
            {/* Header Section */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button onClick={() => router.push('/games')} className="text-electric font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 group">
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Gallery
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">{game.name}</h1>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border ${
                            game.status === 'COMPLETED' ? 'bg-electric/10 border-electric/30 text-electric' : 'bg-container-low border-bd-ghost text-tx-dim'
                        }`}>
                            {game.status}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-tx-dim uppercase tracking-widest mt-2">
                        {game.homeTeam?.name || 'Home'} VS {game.awayTeam?.name || 'Away'} • {game.location || 'Stadium'} • {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : 'Analysis Pending'}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    {game.status === 'ANALYZED' && (
                        <button onClick={() => setShowAssignmentModal(true)} className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-electric transition-all flex items-center gap-2 shadow-lg">
                            <span className="material-symbols-outlined text-sm">assignment_ind</span>
                            Finalize Roster
                        </button>
                    )}
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-12 h-12 rounded-xl bg-container-low border border-bd-ghost flex items-center justify-center text-tx-dim hover:text-red-400 transition-all">
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </header>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left: Video & Global Stats */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-8 lg:sticky lg:top-8">
                    <section className="stadium-card p-2 bg-black border border-bd-ghost overflow-hidden">
                        <div className="rounded-lg overflow-hidden aspect-video">
                            <VideoPlayer 
                                videoUrl={game.videoUrl} 
                                playerRef={playerRef} 
                                onProgress={handleProgress}
                                onDuration={handleDuration}
                            />
                        </div>
                        {duration > 0 && (
                            <div className="mt-2 px-2">
                                <TimelineReview 
                                    events={game.events || []}
                                    duration={duration}
                                    currentTime={currentTime}
                                    onEventClick={handleEventClick}
                                    onTimelineClick={handleSeek}
                                />
                            </div>
                        )}
                    </section>

                    {game.status === 'PROCESSING' && (
                        <div className="stadium-card bg-gradient-to-r from-electric/10 to-transparent border-electric/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-electric flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                    AI Brain Analysis in Progress
                                </h3>
                                <span className="text-[10px] font-black text-electric/60">Live Event Extraction Active</span>
                            </div>
                            <div className="h-1 w-full bg-container-low rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-electric animate-pulse shadow-[0_0_10px_var(--primary-glow)]" />
                            </div>
                        </div>
                    )}

                    {!isMobile && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between border-b border-bd-ghost pb-4">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-tx-dim">Strategic Pulse</h2>
                                <StatSelectionControl onPreferencesChanged={setVisibleStats} />
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <BoxScoreTable game={game} visibleStats={visibleStats} />
                                <IdentifiedEntitiesTable gameId={game.id} />
                            </div>
                            <TeamAndPlayerTables game={game} visibleStats={visibleStats} />
                        </div>
                    )}
                </div>

                {/* Right: Intelligence Feed / Editor */}
                <div className="lg:col-span-5 xl:col-span-4 h-full">
                    {selectedEvent ? (
                        <div className="lg:sticky lg:top-8">
                            <EventEditor 
                                event={selectedEvent}
                                allTeams={[game.homeTeam, game.awayTeam].filter(Boolean) as Team[]}
                                allPlayers={allPlayers}
                                onSave={handleSaveEvent}
                                onCancel={() => setSelectedEvent(null)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full lg:max-h-[calc(100vh-160px)]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-tx-dim">Play-by-Play</h2>
                                <span className="text-[10px] font-bold text-electric uppercase px-3 py-1 bg-electric/10 rounded-full">Live Feed</span>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                                <PlayByPlayFeed 
                                    events={game.events || []} 
                                    onRowClick={handleSeek} 
                                    allPlayers={allPlayers} 
                                    onAssignPlayer={handleAssignPlayer} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Overlays */}
            <EntityAssignmentModal
                gameId={game.id}
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssignmentComplete={mutate}
            />

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="stadium-card max-w-sm w-full text-center border border-red-500/20 shadow-2xl">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4 text-white">Purge Tape?</h3>
                        <p className="text-xs text-tx-secondary font-medium mb-10 leading-relaxed uppercase tracking-widest">
                            This action will permanently delete this analysis and all associated video data.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-container-low rounded-xl text-xs font-black uppercase tracking-widest hover:bg-container-highest transition-all">Cancel</button>
                            <button onClick={handleDeleteGame} disabled={isDeleting} className="flex-1 py-4 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all">
                                {isDeleting ? 'Purging...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalysisPage;
