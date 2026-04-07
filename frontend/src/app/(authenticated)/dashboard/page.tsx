'use client';

import React from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import { Team } from '@/types/team';
import Loader from '@/components/Loader';
import { useRouter } from 'next/navigation';

import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';

export default function DashboardPage() {
  const router = useRouter();
  const { data: games, isLoading: gamesLoading } = useSWR<Game[]>('/games');
  const { data: teams, isLoading: teamsLoading } = useSWR<Team[]>('/teams');

  if (gamesLoading || teamsLoading) return <Loader />;

  const recentGames = games?.slice(0, 3) || [];
  const processingGames = games?.filter(g => g.status === GameStatus.PROCESSING) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: 'var(--md-sys-typescale-headline-large-size)', marginBottom: '8px' }}>Welcome to StatVision</h1>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>AI-powered sports analytics for everyone.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600' }}>Total Games</span>
            <md-icon>analytics</md-icon>
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{games?.length || 0}</div>
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600' }}>Active Teams</span>
            <md-icon>group</md-icon>
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{teams?.length || 0}</div>
        </div>

        {processingGames.length > 0 && (
          <div style={{ padding: '24px', backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: '600' }}>Currently Analyzing</span>
              <md-icon className="spin">sync</md-icon>
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{processingGames.length}</div>
          </div>
        )}
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-size)' }}>Recent Analysis</h2>
          <md-text-button onClick={() => router.push('/games')}>View all</md-text-button>
        </div>
        
        {recentGames.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: '24px' }}>
            <p>No games analyzed yet.</p>
            <md-filled-button style={{ marginTop: '16px' }} onClick={() => router.push('/games')}>
              Start First Analysis
            </md-filled-button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentGames.map(game => (
              <div 
                key={game.id}
                onClick={() => router.push(`/games/${game.id}`)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 24px', 
                  backgroundColor: 'var(--md-sys-color-surface-container-low)', 
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{game.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>{new Date(game.uploadedAt).toLocaleDateString()}</div>
                </div>
                <md-icon>chevron_right</md-icon>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
