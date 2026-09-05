/* eslint-disable */
'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import { GameTeamStats } from '@/types/stats';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/outlined-card.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import Link from 'next/link';
import { JobProgressBar } from '@/components/JobProgressBar';

const PerformanceDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');

  const pendingUpload = useMemo(() => {
    if (!games) return null;
    return games.find((g: Game) => g.status === GameStatus.PENDING && g.uploadUrl);
  }, [games]);

  const activeGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games.find((g: Game) => g.status === GameStatus.PROCESSING) || games[0];
  }, [games]);

  const recentEvents = useMemo(() => {
    if (!activeGame || !activeGame.events) return [];
    return [...activeGame.events]
      .sort((a, b) => (b as any).timestamp - (a as any).timestamp)
      .slice(0, 8);
  }, [activeGame]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <md-circular-progress indeterminate></md-circular-progress>
    </div>
  );

  if (!games || games.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '8px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <md-icon>
            upload_file
          </md-icon>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>
          No Active Records
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--md-sys-color-on-surface-variant)',
          marginBottom: '32px',
          maxWidth: '320px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}>
          Upload game footage to activate the performance analytics dashboard.
        </p>
        <Link href="/games" passHref>
          <md-filled-button>Upload Game</md-filled-button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Professional System Alert for Pending Uploads */}
      {pendingUpload && (
        <md-outlined-card>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--md-sys-color-primary)',
              }}>
                <md-icon>restart_alt</md-icon>
              </div>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Unfinished Upload Detected
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 500,
                  margin: 0,
                }}>
                  Process for "<span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 700 }}>{pendingUpload.name}</span>" was interrupted. System is ready to resume.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Link href={`/games?resume=${pendingUpload.id}`} passHref>
                <md-filled-button>Resume Stream</md-filled-button>
              </Link>
            </div>
          </div>
        </md-outlined-card>
      )}

      {/* Header Section */}
      <header style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: activeGame?.status === GameStatus.PROCESSING
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-tertiary)',
              animation: activeGame?.status === GameStatus.PROCESSING
                ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                : 'none',
            }} />
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--md-sys-color-on-surface-variant)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {activeGame?.status === GameStatus.PROCESSING ? 'ENGINE: ANALYZING' : 'ENGINE: STANDBY'}
            </span>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--md-sys-color-on-surface)',
            margin: 0,
          }}>
            Performance Dashboard
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: 0,
          }}>
            {activeGame?.name || 'Session Ready'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '12px',
          width: '100%',
        }}>
          {activeGame?.status === GameStatus.PROCESSING && (
            <div style={{ width: '100%' }}>
              <JobProgressBar gameId={activeGame.id} />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/games" passHref>
              <md-outlined-button><md-icon slot="icon">grid_view</md-icon>Gallery View</md-outlined-button>
            </Link>
          </div>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* Main Column: Activity & Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Professional Video Placeholder/Preview */}
          <section style={{
            position: 'relative',
            aspectRatio: '16 / 9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <md-outlined-card className="fill-area">
              {activeGame?.videoUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <md-icon>
                    analytics
                  </md-icon>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}>
                    Analytics Feed Ready
                  </p>
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontFamily: 'monospace',
                    opacity: '0.3',
                  }}>
                    STREAM_ID: {activeGame.id.slice(0, 12)}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '0 24px' }}>
                  <md-icon>
                    videocam_off
                  </md-icon>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}>
                    No Active Video Stream
                  </p>
                </div>
              )}
              <div style={{
                position: 'absolute',
                inset: '0',
                background: 'linear-gradient(to top, color-mix(in srgb, var(--md-sys-color-surface) 50%, transparent), transparent)',
                pointerEvents: 'none',
              }} />
            </md-outlined-card>
          </section>

          {/* Activity Stream */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: 0,
              }}>
                Recent System Detections
              </h3>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: 'var(--md-sys-color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Live Log
              </span>
            </div>
            <md-outlined-card>
              {recentEvents.length > 0 ? (
                <md-list>
                  {recentEvents.map((event, i) => (
                    <md-list-item
                      key={event.id || i}
                      type="text-icon"
                      headline={event.eventType.replace(/_/g, ' ')}
                      supportingText={event.assignedPlayerId ? 'Verified Target' : 'Detection Pending Assignment'}
                    >
                      <md-icon slot="start">
                        {event.eventType.toLowerCase().includes('shot') || event.eventType.toLowerCase().includes('3pt') ? 'sports_basketball' :
                         event.eventType.toLowerCase().includes('steal') || event.eventType.toLowerCase().includes('block') ? 'pan_tool' : 'pending_actions'}
                      </md-icon>
                      <div slot="end" style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontFamily: 'monospace',
                      }}>
                        {Math.floor(event.absoluteTimestamp / 60)}:{(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}
                      </div>
                    </md-list-item>
                  ))}
                </md-list>
              ) : (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}>
                    Awaiting Engine Synchronization...
                  </p>
                </div>
              )}
            </md-outlined-card>
          </section>
        </div>

        {/* Sidebar Column: Metrics & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <md-outlined-card>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: 0,
              }}>
                Session Scoring
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {activeGame?.teamStats?.length ? (
                  activeGame.teamStats.slice(0, 2).map((ts: GameTeamStats, idx: number) => (
                    <div key={ts.teamId}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: '8px',
                      }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--md-sys-color-on-surface-variant)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {idx === 0 ? 'Home' : 'Away'}
                        </span>
                        <span style={{
                          fontSize: '30px',
                          fontWeight: 900,
                          color: 'var(--md-sys-color-on-surface)',
                          fontFamily: 'monospace',
                          lineHeight: '1',
                        }}>
                          {ts.points || 0}
                        </span>
                      </div>
                      <div style={{
                        height: '4px',
                        width: '100%',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(ts.points, 100)}%`,
                          backgroundColor: idx === 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)',
                          borderRadius: '9999px',
                        }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--md-sys-color-on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: 0,
                    }}>
                      Syncing Scoreboard...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </md-outlined-card>

          <md-outlined-card>
            <div style={{
              padding: '24px',
              borderLeft: '4px solid var(--md-sys-color-primary)',
            }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--md-sys-color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '24px',
                margin: '0 0 24px 0',
              }}>
                Engine Diagnostics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Inference', val: 'Operational', color: 'var(--md-sys-color-tertiary)' },
                  { label: 'Cloud Storage', val: 'Synchronized', color: 'var(--md-sys-color-on-surface-variant)' },
                  { label: 'Metadata API', val: 'Active', color: 'var(--md-sys-color-on-surface-variant)' }
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      letterSpacing: '-0.01em',
                    }}>
                      [{log.label}]
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em',
                      color: log.color,
                    }}>
                      {log.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </md-outlined-card>

          <Link href="/games" passHref style={{ textDecoration: 'none', display: 'block' }}>
            <md-outlined-card className="fill-width pointer">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  Access Game Archive
                </span>
                <md-icon>
                  chevron_right
                </md-icon>
              </div>
            </md-outlined-card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboardPage;
