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
import { JobProgressBar } from '@/components/JobProgressBar';
import ConfirmationModal from '@/components/ConfirmationModal';
import Button from '@/components/Button';

import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';

function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const playerRef = useRef(null);

    // Data Fetching
    const { data: game, error, isLoading: isDataLoading, mutate } = useSWR<Game>(gameId ? `/games/${gameId}` : null, {
        refreshInterval: (data) => (data && (data.status === 'PROCESSING' || data.status === 'UPLOADED')) ? 3000 : 0,
    });

    // UI State
    const [activeTab, setActiveTab] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [visibleStats, setVisibleStats] = useState<string[]>(['fieldGoalsMade', 'threePointersMade', 'freeThrowsMade', 'offensiveRebounds', 'defensiveRebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls', 'points', 'plusMinus']);

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

    const handleDeleteEvent = (eventId: string) => {
        setEventToDelete(eventId);
    };

    const confirmDeleteEvent = async () => {
        if (!eventToDelete) return;
        try {
            await apiClient.delete(`/game-events/${eventToDelete}`);
            mutate();
        } catch (err: any) {
            console.error("Error deleting event:", err);
        } finally {
            setEventToDelete(null);
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
            const token = await getAccessTokenSilently();
            await apiClient.delete(`/games/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
                <Button onClick={() => router.push('/games')}>Back to List</Button>
            </div>
        );
    }

    const homeStats = game.teamStats.find(ts => ts.teamId === game.homeTeamId);
    const awayStats = game.teamStats.find(ts => ts.teamId === game.awayTeamId);

    return (
        <div className="flex flex-col gap-6 pb-20">
            
            {/* Professional Scoreboard Header */}
            <header className="bg-surface border border-border-main rounded-md overflow-hidden">
                <div className="flex flex-col md:flex-row items-stretch">
                    {/* Teams & Score */}
                    <div className="flex-1 flex items-center justify-center gap-8 py-8 px-10 border-b md:border-b-0 md:border-r border-border-main bg-primary-bg/50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl font-black">
                                {game.homeTeam?.name?.charAt(0).toUpperCase() || 'H'}
                            </div>
                            <span className="text-xs font-bold text-tx-secondary uppercase tracking-widest">{game.homeTeam?.name || 'HOME'}</span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <span className="text-5xl font-black text-tx-primary mono-stat">{homeStats?.points || 0}</span>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-tx-dim uppercase tracking-tighter">FINAL</span>
                                <div className="h-px w-8 bg-border-main my-1"></div>
                                <span className="text-[10px] font-bold text-accent uppercase tracking-widest italic">{game.gameType.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-5xl font-black text-tx-primary mono-stat">{awayStats?.points || 0}</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning text-2xl font-black">
                                {game.awayTeam?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span className="text-xs font-bold text-tx-secondary uppercase tracking-widest">{game.awayTeam?.name || 'AWAY'}</span>
                        </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-surface gap-6">
                        <div>
                            <h1 className="text-sm font-bold text-tx-primary mb-1 uppercase tracking-tight truncate">{game.name}</h1>
                            <p className="text-[11px] text-tx-dim font-medium uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {game.location || 'Stadium Vision Arena'}
                            </p>
                            <p className="text-[11px] text-tx-dim font-medium uppercase tracking-wider flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {game.gameDate ? new Date(game.gameDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown Date'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" icon="assignment_ind" fullWidth onClick={() => setShowAssignmentModal(true)}>
                                Roster
                            </Button>
                            <Button variant="ghost" size="sm" icon="delete" onClick={() => setShowDeleteConfirm(true)} className="!text-error hover:!bg-error/10" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Analysis Workspace */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Video & Controls (Primary Column) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-black border border-border-main rounded-md overflow-hidden aspect-video relative group shadow-2xl">
                        <VideoPlayer 
                            videoUrl={game.videoUrl} 
                            playerRef={playerRef} 
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                        />
                        <div className="absolute top-4 left-4 z-20">
                             <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Analysis Feed</span>
                             </div>
                        </div>
                    </div>

                    {duration > 0 && (
                        <div className="bg-surface border border-border-main rounded-md p-2">
                            <TimelineReview 
                                events={game.events || []}
                                duration={duration}
                                currentTime={currentTime}
                                onEventClick={handleEventClick}
                                onTimelineClick={handleSeek}
                            />
                        </div>
                    )}

                    {game.status === 'PROCESSING' && (
                        <JobProgressBar gameId={game.id} />
                    )}

                    {/* Desktop Content Tabs */}
                    <div className="hidden lg:flex flex-col gap-4">
                        {/* @ts-ignore */}
                        <md-tabs 
                            onchange={(e: any) => setActiveTab(e.target.activeTabIndex)}
                            active-tab-index={activeTab}
                        >
                            {/* @ts-ignore */}
                            <md-primary-tab>
                                <md-icon slot="icon">analytics</md-icon>
                                <span>Box Score</span>
                            </md-primary-tab>
                            {/* @ts-ignore */}
                            <md-primary-tab>
                                <md-icon slot="icon">group</md-icon>
                                <span>Identified Personnel</span>
                            </md-primary-tab>
                        </md-tabs>

                        <div className="mt-2">
                            {activeTab === 0 && <BoxScoreTable game={game} visibleStats={visibleStats} onEditPlayer={(id) => console.log('Edit player', id)} />}
                            {activeTab === 1 && <IdentifiedEntitiesTable gameId={game.id} />}
                        </div>
                    </div>
                </div>

                {/* Play-by-Play (Secondary Column) */}
                <div className="lg:col-span-4 flex flex-col h-[calc(100vh-160px)] lg:sticky lg:top-6">
                    {selectedEvent ? (
                        <div className="flex-1">
                            <EventEditor 
                                event={selectedEvent}
                                allTeams={[game.homeTeam, game.awayTeam].filter(Boolean) as Team[]}
                                allPlayers={allPlayers}
                                onSave={handleSaveEvent}
                                onCancel={() => setSelectedEvent(null)}
                            />
                        </div>
                    ) : (
                        <PlayByPlayFeed 
                            events={game.events || []} 
                            onRowClick={handleSeek} 
                            allPlayers={allPlayers} 
                            _onAssignPlayer={handleAssignPlayer}
                            onEditEvent={setSelectedEvent}
                            _onDeleteEvent={handleDeleteEvent}
                            homeTeamId={game.homeTeamId}
                        />
                    )}
                </div>

                {/* Mobile Tabs (Fallback) */}
                <div className="lg:hidden col-span-1 space-y-6">
                     <div className="flex flex-col gap-4">
                        {/* @ts-ignore */}
                        <md-tabs onchange={(e: any) => setActiveTab(e.target.activeTabIndex)}>
                            {/* @ts-ignore */}
                            <md-primary-tab>Box Score</md-primary-tab>
                            {/* @ts-ignore */}
                            <md-primary-tab>Personnel</md-primary-tab>
                        </md-tabs>
                        <div>
                            {activeTab === 0 && <BoxScoreTable game={game} visibleStats={visibleStats} />}
                            {activeTab === 1 && <IdentifiedEntitiesTable gameId={game.id} />}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <EntityAssignmentModal
                gameId={game.id}
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssignmentComplete={mutate}
            />

            <ConfirmationModal 
                isOpen={showDeleteConfirm}
                header="Delete Analysis?"
                message="This will permanently remove all stats and video data for this game. This action cannot be undone."
                okButtonText="Confirm Deletion"
                cancelButtonText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDeleteGame}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmationModal 
                isOpen={!!eventToDelete}
                header="Delete Event?"
                message="Are you sure you want to remove this log entry from the play-by-play feed?"
                okButtonText="Delete Entry"
                cancelButtonText="Keep It"
                variant="danger"
                onConfirm={confirmDeleteEvent}
                onCancel={() => setEventToDelete(null)}
            />
        </div>
    );
}

export default AnalysisPage;
