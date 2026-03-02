'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useSWR, { useSWRConfig } from 'swr';
import Loader from '@/components/Loader';
import { Game, GameStatus } from '@/types/game';
import { useRouter } from 'next/navigation';
import ResponsiveFab from '@/components/ResponsiveFab';
import UploadForm from '@/components/UploadForm';

import '@material/web/button/filled-button.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

function GamesPage() {
  const { loginWithRedirect } = useAuth0();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: games, error, isLoading: isDataLoading } = useSWR<Game[]>('/games', {
    refreshInterval: 5000,
  });
  const [areMdcComponentsReady, setAreMdcComponentsReady] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);

  useEffect(() => {
    const checkMdcComponents = () => {
      if (customElements.get('md-list') && customElements.get('md-list-item') && customElements.get('md-filled-button') && customElements.get('md-icon') && customElements.get('md-icon-button')) {
        setAreMdcComponentsReady(true);
      } else {
        setTimeout(checkMdcComponents, 50);
      }
    };
    checkMdcComponents();
  }, []);

  const getStatusIcon = (status: GameStatus) => {
    switch (status) {
      case GameStatus.ANALYZED:
      case GameStatus.COMPLETED:
        return { icon: 'check_circle', color: 'var(--md-sys-color-success)' };
      case GameStatus.PROCESSING:
        return { icon: 'hourglass_empty', color: 'var(--md-sys-color-primary)' };
      case GameStatus.FAILED:
        return { icon: 'error', color: 'var(--md-sys-color-error)' };
      case GameStatus.UPLOADED:
      case GameStatus.ASSIGNMENT_PENDING:
      default:
        return { icon: 'pending', color: 'var(--md-sys-color-on-surface-variant)' };
    }
  };

  if (isDataLoading || !areMdcComponentsReady) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 'var(--spacing-md)', color: 'var(--md-sys-color-error)' }}>
        <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Error</h1>
        <p>{error.message || 'An unexpected error occurred.'}</p>
        <md-filled-button onClick={() => loginWithRedirect()}>Login</md-filled-button>
      </main>
    );
  }

  return (
    <main className="main-content-container">
      <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-primary)' }}>Game Management Dashboard</h1>
      
      {isUploadMode ? (
        <UploadForm 
          onUploadComplete={() => {
            setIsUploadMode(false);
            mutate('/games'); // Refresh the list of games
          }}
          onCancel={() => setIsUploadMode(false)}
        />
      ) : (
        <>
          {!games || games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
              <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>sports_basketball</md-icon>
              <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No games found. Upload a video to start analyzing!</p>
            </div>
          ) : (
            // Universal Card View
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
              {games.map(game => {
                const statusInfo = getStatusIcon(game.status);
                const uploadedDate = new Date(game.uploadedAt).toLocaleDateString();
                const teamA = game.assignedTeamA?.name || 'Team A (Unassigned)';
                const teamB = game.assignedTeamB?.name || 'Team B (Unassigned)';

                return (
                  <div 
                    key={game.id} 
                    onClick={() => router.push(`/games/${game.id}`)}
                    style={{ 
                      padding: 'var(--spacing-md)', 
                      backgroundColor: 'var(--md-sys-color-surface-container-low)', 
                      borderRadius: 'var(--border-radius-md)', 
                      boxShadow: 'var(--shadow-elevation-1)',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${statusInfo.color}`,
                      transition: 'transform 0.1s ease-in-out',
                    }}
                    // @ts-ignore
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    // @ts-ignore
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>{teamA} vs {teamB}</h3>
                      <md-icon style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>chevron_right</md-icon>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--md-sys-typescale-body-small-size)' }}>
                      <p>
                        <span style={{ color: statusInfo.color, display: 'flex', alignItems: 'center' }}>
                          <md-icon style={{ fontSize: '16px', marginRight: '4px' }}>{statusInfo.icon}</md-icon>
                          {game.status}
                        </span>
                      </p>
                      <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{uploadedDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Responsive FAB for Analyze New Game (Mobile) */}
      {!isUploadMode && (
        <ResponsiveFab
          label="Analyze New Game"
          icon="upload"
          onClick={() => setIsUploadMode(true)}
        />
      )}
    </main>
  );
}

export default GamesPage;