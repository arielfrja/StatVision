/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@/app/user-provider';
import { useRouter, useParams } from 'next/navigation';
import { Game } from '@/types/game';
import { Team } from '@/types/team';
import { PlayerTeamHistory } from '@/types/player';
import { GameEvent } from '@/types/gameEvent';
import { GameTeamStats } from '@/types/stats';
import '@material/web/progress/circular-progress.js';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';

// Components
import VideoPlayer from '@/components/analysis/VideoPlayer';
import TimelineReview from '@/components/analysis/TimelineReview';
import EventEditor from '@/components/analysis/EventEditor';
import BoxScoreTable from '@/components/analysis/BoxScoreTable';
import PlayByPlayFeed from '@/components/analysis/PlayByPlayFeed';
import IdentifiedEntitiesTable from '@/components/IdentifiedEntitiesTable';
import { CoachReport } from './CoachReport';
import EntityAssignmentModal from '@/components/EntityAssignmentModal';
import { JobProgressBar } from '@/components/JobProgressBar';
import '@material/web/dialog/dialog.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';

function AnalysisPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const playerRef = useRef(null);

    // Responsive breakpoint
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Data Fetching
    const { data: game, error, isLoading: isDataLoading, mutate } = useSWR<Game>(gameId ? `/games/${gameId}` : null, {
        refreshInterval: (data: Game | undefined) => (data && (data.status === 'PROCESSING' || data.status === 'UPLOADED')) ? 3000 : 0,
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

    if (isDataLoading && !game) return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
        }}>
            <md-circular-progress indeterminate></md-circular-progress>
        </div>
    );

    if (error || !game) {
        return (
            <div style={{
                padding: '48px',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: '16px',
                    color: 'var(--md-sys-color-on-surface)',
                }}>Error Loading Video Intelligence</h1>
                <md-filled-button onClick={() => router.push('/games')}>Back to List</md-filled-button>
            </div>
        );
    }

    const homeStats = game.teamStats.find((ts: GameTeamStats) => ts.teamId === game.homeTeamId);
    const awayStats = game.teamStats.find((ts: GameTeamStats) => ts.teamId === game.awayTeamId);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingBottom: '80px',
        }}>
            
            {/* Professional Scoreboard Header */}
            <header style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '6px',
                overflow: 'hidden',
            }}>
                <div data-scoreboard-inner style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                }}>
                    {/* Teams & Score */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '32px',
                        paddingTop: '32px',
                        paddingBottom: '32px',
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container) 50%, transparent)',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--md-sys-color-primary)',
                                fontSize: '24px',
                                fontWeight: 900,
                            }}>
                                {game.homeTeam?.name?.charAt(0).toUpperCase() || 'H'}
                            </div>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}>{game.homeTeam?.name || 'HOME'}</span>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                        }}>
                            <span style={{
                                fontSize: '48px',
                                fontWeight: 900,
                                color: 'var(--md-sys-color-on-surface)',
                                fontFamily: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace",
                            }}>{homeStats?.points || 0}</span>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '-0.05em',
                                }}>FINAL</span>
                                <div style={{
                                    height: '1px',
                                    width: '32px',
                                    backgroundColor: 'var(--md-sys-color-outline-variant)',
                                    marginTop: '4px',
                                    marginBottom: '4px',
                                }}></div>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--md-sys-color-primary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    fontStyle: 'italic',
                                }}>{game.gameType.replace(/_/g, ' ')}</span>
                            </div>
                            <span style={{
                                fontSize: '48px',
                                fontWeight: 900,
                                color: 'var(--md-sys-color-on-surface)',
                                fontFamily: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace",
                            }}>{awayStats?.points || 0}</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: 'color-mix(in srgb, var(--md-sys-color-secondary) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--md-sys-color-secondary) 20%, transparent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--md-sys-color-secondary)',
                                fontSize: '24px',
                                fontWeight: 900,
                            }}>
                                {game.awayTeam?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--md-sys-color-on-surface-variant)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}>{game.awayTeam?.name || 'AWAY'}</span>
                        </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        gap: '24px',
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'var(--md-sys-color-on-surface)',
                                margin: 0,
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '-0.025em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>{game.name}</h1>
                            <p style={{
                                fontSize: '11px',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: 0,
                            }}>
                                <md-icon style={{fontSize: '14px'}}>location_on</md-icon>
                                {game.location || 'Stadium Vision Arena'}
                            </p>
                            <p style={{
                                fontSize: '11px',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '4px',
                            }}>
                                <md-icon style={{fontSize: '14px'}}>calendar_today</md-icon>
                                {game.gameDate ? new Date(game.gameDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown Date'}
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                        }}>
                            <md-outlined-button onClick={() => setShowAssignmentModal(true)} style={{width: '100%'}}>
                                <md-icon slot="icon">assignment_ind</md-icon>
                                Roster
                            </md-outlined-button>
                            <md-text-button onClick={() => setShowDeleteConfirm(true)}>
                                <md-icon slot="icon">delete</md-icon>
                            </md-text-button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Analysis Workspace */}
            <main style={{
                display: 'flex',
                flexDirection: isDesktop ? 'row' : 'column',
                gap: '24px',
                alignItems: 'flex-start',
            }}>
                
                {/* Video & Controls (Primary Column) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    flex: isDesktop ? '8' : '0 0 100%',
                    width: isDesktop ? 'auto' : '100%',
                }}>
                    <div style={{
                        backgroundColor: '#000',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        aspectRatio: '16 / 9',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}>
                        <VideoPlayer 
                            videoUrl={game.videoUrl} 
                            playerRef={playerRef} 
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            zIndex: 20,
                        }}>
                             <div style={{
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                backgroundColor: 'color-mix(in srgb, #000 60%, transparent)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                borderRadius: '4px',
                                border: '1px solid color-mix(in srgb, #fff 10%, transparent)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                             }}>
                                <div data-live-dot style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--md-sys-color-error)',
                                }}></div>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}>Live Analysis Feed</span>
                             </div>
                        </div>
                    </div>

                    {duration > 0 && (
                        <div style={{
                            backgroundColor: 'var(--md-sys-color-surface)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            borderRadius: '6px',
                            padding: '8px',
                        }}>
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
                    {isDesktop && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}>
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
                                {/* @ts-ignore */}
                                <md-primary-tab>
                                    <md-icon slot="icon">smart_toy</md-icon>
                                    <span>Coach Report</span>
                                </md-primary-tab>
                            </md-tabs>

                            <div style={{marginTop: '8px'}}>
                                {activeTab === 0 && <BoxScoreTable game={game} visibleStats={visibleStats} onEditPlayer={(id) => console.log('Edit player', id)} />}
                                {activeTab === 1 && <IdentifiedEntitiesTable gameId={game.id} />}
                                {activeTab === 2 && <CoachReport game={game} />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Play-by-Play (Secondary Column) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: isDesktop ? 'calc(100vh - 160px)' : 'auto',
                    position: isDesktop ? 'sticky' : 'static',
                    top: isDesktop ? '24px' : 'auto',
                    flex: isDesktop ? '4' : '0 0 100%',
                    width: isDesktop ? 'auto' : '100%',
                }}>
                    {selectedEvent ? (
                        <div style={{flex: 1}}>
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
                {!isDesktop && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        width: '100%',
                    }}>
                         <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                         }}>
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
                )}
            </main>

            {/* Modals */}
            <EntityAssignmentModal
                gameId={game.id}
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssignmentComplete={mutate}
            />

            <md-dialog open={showDeleteConfirm} @close={() => setShowDeleteConfirm(false)}>
              <div slot="headline">Delete Analysis?</div>
              <div slot="content">This will permanently remove all stats and video data for this game. This action cannot be undone.</div>
              <div slot="actions">
                <md-text-button @click={() => setShowDeleteConfirm(false)}>Cancel</md-text-button>
                <md-text-button style="color:var(--md-sys-color-error)" @click={handleDeleteGame} disabled={isDeleting}>Confirm Deletion</md-text-button>
              </div>
            </md-dialog>

            <md-dialog open={!!eventToDelete} @close={() => setEventToDelete(null)}>
              <div slot="headline">Delete Event?</div>
              <div slot="content">Are you sure you want to remove this log entry from the play-by-play feed?</div>
              <div slot="actions">
                <md-text-button @click={() => setEventToDelete(null)}>Keep It</md-text-button>
                <md-text-button style="color:var(--md-sys-color-error)" @click={confirmDeleteEvent}>Delete Entry</md-text-button>
              </div>
            </md-dialog>

            <style>{`
                @media (min-width: 768px) {
                    [data-scoreboard-inner] {
                        flex-direction: row !important;
                    }
                    [data-scoreboard-inner] > div:first-child {
                        border-bottom: none !important;
                        border-right: 1px solid var(--md-sys-color-outline-variant) !important;
                    }
                    [data-scoreboard-inner] > div:last-child {
                        width: 320px !important;
                    }
                }
                @keyframes live-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                [data-live-dot] {
                    animation: live-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}

export default AnalysisPage;
