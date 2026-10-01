'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';

// MD3 Components
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/elevated-card.js';
import '@material/web/dialog/dialog.js';

import { Game, GameStatus } from '@/types/game';
import UploadForm from '@/components/UploadForm';

const GamesPage = () => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');

  const { data: games, error: gamesError, isLoading, mutate } = useSWR<Game[]>('/games', {
    refreshInterval: 15000,
  });

  const [isUploadMode, setIsUploadMode] = useState(false);
  const [resumeGameId, setResumeGameId] = useState<string | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' } | null>(null);

  const deleteDialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    const handler = () => setGameToDelete(null);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [gameToDelete]);

  const showToast = (msg: string, kind: 'success' | 'error') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (resumeId) {
      setIsUploadMode(true);
      setResumeGameId(resumeId);
    }
  }, [resumeId]);

  const getStatusDisplay = (status: GameStatus) => {
    switch (status) {
      case GameStatus.COMPLETED:
      case GameStatus.ANALYZED:
        return { icon: 'check_circle', color: 'var(--md-sys-color-success)', label: 'READY' };
      case GameStatus.PROCESSING:
        return { icon: 'sync', color: 'var(--md-sys-color-primary)', label: 'ANALYZING', spin: true };
      case GameStatus.FAILED:
        return { icon: 'error', color: 'var(--md-sys-color-error)', label: 'FAILED' };
      case GameStatus.UPLOADED:
        return { icon: 'cloud_done', color: 'var(--md-sys-color-on-surface-variant)', label: 'UPLOADED' };
      case GameStatus.ASSIGNMENT_PENDING:
        return { icon: 'person_search', color: 'var(--md-sys-color-primary)', label: 'IDENTITY' };
      case GameStatus.PENDING:
        return { icon: 'upload_file', color: 'var(--md-sys-color-primary)', label: 'DRAFT' };
      default:
        return { icon: 'pending', color: 'var(--md-sys-color-on-surface-variant)', label: status };
    }
  };

  if (gamesError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px', textAlign: 'center' }}>
        <md-icon>cloud_off</md-icon>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
          Cannot reach server
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
          The game vault could not be loaded. Check your connection and try again.
        </p>
        <md-filled-button onClick={() => mutate()}>
          <md-icon slot="icon">refresh</md-icon>
          Retry
        </md-filled-button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <md-circular-progress indeterminate />
      </div>
    );
  }

  const handleRetry = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setResumeGameId(gameId);
    setIsUploadMode(true);
    router.replace(`/games?resume=${gameId}`);
  };

  const handleDelete = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setGameToDelete(game);
  };

  const confirmDelete = async () => {
    if (!gameToDelete || isDeleting) return;
    const target = gameToDelete;
    setIsDeleting(true);

    try {
      const token = await getAccessTokenSilently();
      await apiClient.delete(`/games/${target.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activeUploadId = localStorage.getItem('statvision_active_upload_id');
      if (activeUploadId === target.id) {
        localStorage.removeItem('statvision_active_upload_id');
        localStorage.removeItem('statvision_active_upload_filename');
        localStorage.removeItem('statvision_active_upload_filesize');
      }

      setGameToDelete(null);
      mutate();
      showToast(`"${target.name}" deleted.`, 'success');
    } catch (error: any) {
      console.error('Error deleting game:', error);
      showToast(error?.response?.data?.message || 'Failed to delete game. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isUploadMode) {
    return (
      <div style={{ maxWidth: '896px', margin: '0 auto', paddingBottom: '96px' }}>
        <header style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <md-text-button
            onClick={() => {
              setIsUploadMode(false);
              setResumeGameId(null);
              router.replace('/games');
            }}
          >
            <md-icon slot="icon">arrow_back</md-icon>
            Return to Vault
          </md-text-button>
          <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
            {resumeGameId ? 'Recover Upload' : 'Initialize New Analysis'}
          </h1>
        </header>
        {/* Single-card upload surface: UploadForm renders its own card. */}
        <UploadForm
            initialGameId={resumeGameId || undefined}
            onUploadComplete={() => {
              setIsUploadMode(false);
              setResumeGameId(null);
              router.replace('/games');
              mutate();
            }}
            onCancel={() => {
              setIsUploadMode(false);
              setResumeGameId(null);
              router.replace('/games');
            }}
          />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
            Film Room
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Storage & Analysis Hub
          </p>
        </div>
        <md-filled-button onClick={() => setIsUploadMode(true)}>
          <md-icon slot="icon">add_box</md-icon>
          New Upload
        </md-filled-button>
      </header>

      {!games || games.length === 0 ? (
        <section style={{
          padding: '128px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          border: '2px dashed var(--md-sys-color-outline-variant)',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}>
            <md-icon>videocam_off</md-icon>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', margin: '0 0 8px 0' }}>
            The Vault is Empty
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '320px', margin: '0 auto 40px auto' }}>
            Upload your first game to begin automated performance tracking.
          </p>
          <md-outlined-button onClick={() => setIsUploadMode(true)}>
            Start Analysis
          </md-outlined-button>
        </section>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {games.map((game: Game) => {
            const status = getStatusDisplay(game.status);
            const date = new Date(game.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const canRetry = game.status === GameStatus.FAILED || game.status === GameStatus.PENDING;

            return (
              <div key={game.id}>
                <md-elevated-card
                  onClick={() => !canRetry && router.push(`/games/${game.id}`)}
                  tabIndex={canRetry ? -1 : 0}
                  role="link"
                  aria-label={`Open game ${game.name}`}
                  onKeyDown={(e: any) => { if ((e.key === 'Enter' || e.key === ' ') && !canRetry) { e.preventDefault(); router.push(`/games/${game.id}`); } }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: canRetry ? 'default' : 'pointer',
                    opacity: canRetry ? 0.8 : 1,
                  }}
                >
                  {/* Scoreboard-style Header */}
                  <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {date}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '-0.025em', fontStyle: 'italic' }}>
                        {game.gameType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: `color-mix(in srgb, ${status.color} 20%, transparent)`,
                        background: `color-mix(in srgb, ${status.color} 5%, transparent)`,
                        color: status.color,
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}>
                        <md-icon>
                          {status.icon}
                        </md-icon>
                        {status.label}
                      </span>

                      <button
                        onClick={(e) => handleDelete(e, game)}
                        title="Delete Game" aria-label={`Delete game ${game.name}`}
                        style={{
                          color: 'var(--md-sys-color-on-surface-variant)',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <md-icon>delete</md-icon>
                      </button>
                    </div>
                  </div>

                  {/* Matchup Content */}
                  <div style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: '1' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--md-sys-color-primary)',
                          fontSize: '14px',
                          fontWeight: 900,
                        }}>
                          {game.homeTeam?.name?.charAt(0).toUpperCase() || 'H'}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                          {game.homeTeam?.name || 'HOME'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '-0.025em' }}>VS</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: '1' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'color-mix(in srgb, var(--md-sys-color-secondary) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--md-sys-color-secondary) 20%, transparent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--md-sys-color-secondary)',
                          fontSize: '14px',
                          fontWeight: 900,
                        }}>
                          {game.awayTeam?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                          {game.awayTeam?.name || 'AWAY'}
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {game.name}
                    </h3>
                  </div>

                  {/* Footer Stats / Actions */}
                  <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '44px',
                  }}>
                    {canRetry ? (
                      <md-filled-button
                        onClick={(e: React.MouseEvent<HTMLElement>) => handleRetry(e, game.id)}
                      >
                        <md-icon slot="icon">refresh</md-icon>
                        Retry Upload
                      </md-filled-button>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* A2 list counts — never .length (arrays are omitted from list payloads). */}
                            <md-icon>analytics</md-icon>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                              {game.eventCount ?? 0}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <md-icon>person</md-icon>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                              {game.playerCount ?? 0}
                            </span>
                          </div>
                        </div>
                        <md-icon>chevron_right</md-icon>
                      </>
                    )}
                  </div>
                </md-elevated-card>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Named-target delete confirmation (replaces window.confirm). */}
      <md-dialog ref={deleteDialogRef} open={!!gameToDelete}>
        <div slot="headline">Delete “{gameToDelete?.name}”?</div>
        <div slot="content">This permanently removes the game, its video, and all analysis data. This action cannot be undone.</div>
        <div slot="actions">
          <md-text-button onClick={() => setGameToDelete(null)} disabled={isDeleting}>Cancel</md-text-button>
          <md-text-button style={{ color: 'var(--md-sys-color-error)' }} onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete Game'}
          </md-text-button>
        </div>
      </md-dialog>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: toast.kind === 'success' ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
