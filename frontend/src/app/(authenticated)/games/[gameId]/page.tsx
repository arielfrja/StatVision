/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@/app/user-provider';
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
import IdentifiedEntitiesTable from '@/components/IdentifiedEntitiesTable';
import EntityAssignmentModal from '@/components/EntityAssignmentModal';

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
    const [isRetrying, setIsRetrying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [visibleStats, setVisibleStats] = useState<string[]>(['points', 'assists', 'offensiveRebounds', 'defensiveRebounds', 'steals', 'blocks', 'turnovers', 'fouls']);

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

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            await apiClient.delete(`/game-events/${eventId}`);
            mutate();
        } catch (err: any) {
            console.error("Error deleting event:", err);
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
                <h1 className="text-xl font-semibold mb-4">Error Loading Video Intelligence</h1>
                <button onClick={() => router.push('/games')} className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-tx-secondary transition-all">Back to List</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Header Section */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bd-ghost pb-8">
                <div>
                    <button onClick={() => router.push('/games')} className="text-tx-secondary font-semibold text-xs mb-4 flex items-center gap-2 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Video List
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            game.status === 'COMPLETED' ? 'bg-electric/10 border-electric/30 text-electric' : 'bg-container-high border-bd-ghost text-tx-dim'
                        }`}>
                            {game.status}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-tx-dim mt-2">
                        {game.homeTeam?.name || 'Home'} vs {game.awayTeam?.name || 'Away'} • {game.location || 'Unknown Location'} • {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : 'Date Pending'}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    {game.status === 'ANALYZED' && (
                        <button onClick={() => setShowAssignmentModal(true)} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-tx-secondary transition-all">
                            <span className="material-symbols-outlined text-sm">assignment_ind</span>
                            Finalize Roster
                        </button>
                    )}
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 rounded-lg bg-container-high border border-bd-ghost flex items-center justify-center text-tx-dim hover:text-red-400 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </header>

            {/* Main Content: Vertical Stack */}
            <div className="space-y-12">
                
                {/* Section 1: Video Context */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-tx-dim">Contextual Footage</h2>
                    </div>
                    <div className="bg-black border border-bd-ghost rounded-xl overflow-hidden shadow-2xl">
                        <VideoPlayer 
                            videoUrl={game.videoUrl} 
                            playerRef={playerRef} 
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                        />
                        {duration > 0 && (
                            <div className="p-4 border-t border-bd-ghost">
                                <TimelineReview 
                                    events={game.events || []}
                                    duration={duration}
                                    currentTime={currentTime}
                                    onEventClick={handleEventClick}
                                    onTimelineClick={handleSeek}
                                />
                            </div>
                        )}
                    </div>

                    {game.status === 'PROCESSING' && (
                        <div className="bg-container-high border border-electric/20 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined animate-spin text-electric text-sm">sync</span>
                                <span className="text-xs font-semibold text-tx-primary">AI Analysis in Progress...</span>
                            </div>
                            <span className="text-[10px] font-bold text-tx-dim uppercase">Processing tape for events</span>
                        </div>
                    )}
                </section>

                {/* Section 2: Data Intelligence */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Box Score & Entities */}
                    <div className="lg:col-span-7 space-y-10">
                        <BoxScoreTable game={game} visibleStats={visibleStats} />
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold tracking-tight text-tx-secondary uppercase px-1">Detected Personnel</h2>
                            <IdentifiedEntitiesTable gameId={game.id} />
                        </div>
                    </div>

                    {/* Right: Play-by-Play / Editor */}
                    <div className="lg:col-span-5">
                        {selectedEvent ? (
                            <div className="sticky top-8">
                                <EventEditor 
                                    event={selectedEvent}
                                    allTeams={[game.homeTeam, game.awayTeam].filter(Boolean) as Team[]}
                                    allPlayers={allPlayers}
                                    onSave={handleSaveEvent}
                                    onCancel={() => setSelectedEvent(null)}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-sm font-semibold tracking-tight text-tx-secondary uppercase">Play-by-Play</h2>
                                    <span className="text-[10px] font-bold text-tx-dim uppercase">Log</span>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[800px] no-scrollbar">
                                    <PlayByPlayFeed 
                                        events={game.events || []} 
                                        onRowClick={handleSeek} 
                                        allPlayers={allPlayers} 
                                        onAssignPlayer={handleAssignPlayer}
                                        onEditEvent={setSelectedEvent}
                                        onDeleteEvent={handleDeleteEvent}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Modals */}
            <EntityAssignmentModal
                gameId={game.id}
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssignmentComplete={mutate}
            />

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-container border border-bd-ghost max-w-sm w-full p-8 rounded-2xl text-center shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Delete Analysis?</h3>
                        <p className="text-xs text-tx-secondary font-medium mb-8 leading-relaxed uppercase tracking-widest">
                            This will permanently remove all stats and video data for this game.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-container-high rounded-lg text-xs font-bold hover:bg-container-highest transition-all">Cancel</button>
                            <button onClick={handleDeleteGame} disabled={isDeleting} className="flex-1 py-3 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all">
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalysisPage;
