'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import Loader from '@/components/Loader';
import { Game, GameStatus } from '@/types/game'; // Import Game type and status
import axios from 'axios';
import { useRouter } from 'next/navigation'; // New Import
import UploadForm from '@/components/UploadForm'; // New Import

import '@material/web/button/filled-button.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

function GamesPage() {
  const { getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areMdcComponentsReady, setAreMdcComponentsReady] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false); // New state for upload mode

  // Utility to check if Material Web Components are ready (copied from teams/page.tsx)
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

  useEffect(() => {
    if (!areMdcComponentsReady) return;
    fetchGames();
  }, [getAccessTokenSilently, areMdcComponentsReady]);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();

      const response = await axios.get('http://localhost:3000/games', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGames(response.data);
    } catch (error: any) {
      console.error("An error occurred in fetchGames:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading || !areMdcComponentsReady) {
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
        <p>{error}</p>
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
            fetchGames(); // Refresh the list of games
          }}
          onCancel={() => setIsUploadMode(false)}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
            <md-filled-button onClick={() => setIsUploadMode(true)}>
              <md-icon slot="icon">upload</md-icon>
              Analyze New Game
            </md-filled-button>
          </div>

          {games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--spacing-md)' }}>
              <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>sports_basketball</md-icon>
              <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No games found. Upload a video to start analyzing!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 'var(--spacing-md)', border: '1px solid var(--md-sys-color-outline)' }}>
              <table className="md-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Teams</th>
                    <th>Status</th>
                    <th>ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => {
                    const statusInfo = getStatusIcon(game.status);
                    const uploadedDate = new Date(game.uploadedAt).toLocaleDateString();
                    const teamA = game.assignedTeamA?.name || 'Team A (Unassigned)';
                    const teamB = game.assignedTeamB?.name || 'Team B (Unassigned)';

                    return (
                      <tr 
                        key={game.id} 
                        className="interactive" 
                        onClick={() => router.push(`/games/${game.id}`)}
                      >
                        <td>{uploadedDate}</td>
                        <td style={{ fontWeight: 'bold' }}>{teamA} vs {teamB}</td>
                        <td style={{ color: statusInfo.color, display: 'flex', alignItems: 'center' }}>
                          <md-icon style={{ fontSize: '16px', marginRight: '4px' }}>{statusInfo.icon}</md-icon>
                          {game.status}
                        </td>
                        <td style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{game.id.substring(0, 8)}...</td>
                        <td>
                          <md-icon-button>
                            <md-icon>chevron_right</md-icon>
                          </md-icon-button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default withAuthenticationRequired(GamesPage, {
  onRedirecting: () => {
    return <Loader />;
  },
});