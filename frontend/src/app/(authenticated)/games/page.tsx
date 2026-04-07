'use client';

import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { Game, GameStatus } from '@/types/game';
import ResponsiveFab from '@/components/ResponsiveFab';
import UploadForm from '@/components/UploadForm';

import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

export default function GamesPage() {
  const router = useRouter();
  const { data: games, error, isLoading, mutate } = useSWR<Game[]>('/games', {
    refreshInterval: 5000, // Refresh every 5 seconds for status updates
  });
  const [isUploadMode, setIsUploadMode] = useState(false);

  const getStatusDisplay = (status: GameStatus) => {
    switch (status) {
      case GameStatus.COMPLETED:
      case GameStatus.ANALYZED:
        return { icon: 'check_circle', color: 'var(--md-sys-color-success)', label: 'Ready' };
      case GameStatus.PROCESSING:
        return { icon: 'sync', color: 'var(--md-sys-color-primary)', label: 'Analyzing', spin: true };
      case GameStatus.FAILED:
        return { icon: 'error', color: 'var(--md-sys-color-error)', label: 'Failed' };
      case GameStatus.UPLOADED:
        return { icon: 'cloud_done', color: 'var(--md-sys-color-secondary)', label: 'Uploaded' };
      case GameStatus.ASSIGNMENT_PENDING:
        return { icon: 'person_search', color: 'var(--md-sys-color-tertiary)', label: 'Needs Assignment' };
      default:
        return { icon: 'pending', color: 'var(--md-sys-color-on-surface-variant)', label: status };
    }
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader /></div>;

  if (error) return <div style={{ padding: '24px', color: 'var(--md-sys-color-error)' }}>Error loading games: {error.message}</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--md-sys-typescale-headline-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>My Games</h1>
      </div>

      {isUploadMode ? (
        <UploadForm 
          onUploadComplete={() => {
            setIsUploadMode(false);
            mutate();
          }}
          onCancel={() => setIsUploadMode(false)}
        />
      ) : (
        <>
          {!games || games.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '64px',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderRadius: '24px',
              textAlign: 'center'
            }}>
              <md-icon style={{ fontSize: '64px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>sports_basketball</md-icon>
              <h2 style={{ marginBottom: '8px' }}>No games yet</h2>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px' }}>Upload your first game to start seeing AI analytics.</p>
              <md-filled-button onClick={() => setIsUploadMode(true)}>
                <md-icon slot="icon">add</md-icon>
                Analyze New Game
              </md-filled-button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {games.map(game => {
                const status = getStatusDisplay(game.status);
                const date = new Date(game.uploadedAt).toLocaleDateString();
                
                return (
                  <div 
                    key={game.id}
                    onClick={() => router.push(`/games/${game.id}`)}
                    style={{ 
                      padding: '20px',
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      transition: 'transform 0.2s, background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: status.color,
                        padding: '4px 8px',
                        backgroundColor: `${status.color}15`,
                        borderRadius: '8px'
                      }}>
                        <md-icon style={{ fontSize: '14px' }}>{status.icon}</md-icon>
                        {status.label}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>{date}</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{game.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {game.homeTeam?.name || 'Home'} vs {game.awayTeam?.name || 'Away'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          
          <ResponsiveFab
            label="New Analysis"
            icon="add"
            onClick={() => setIsUploadMode(true)}
          />
        </>
      )}
    </div>
  );
}
