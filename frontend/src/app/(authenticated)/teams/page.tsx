'use client';

import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { Team } from '@/types/team';
import apiClient from '@/utils/apiClient';
import ResponsiveFab from '@/components/ResponsiveFab';

import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/textfield/filled-text-field.js';

export default function TeamsPage() {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>('/teams');
  const [isCreating, setIsUploading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const dialogRef = useRef<any>(null);

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    setIsUploading(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.post('/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTeamName('');
      dialogRef.current?.close();
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--md-sys-typescale-headline-medium-size)' }}>My Teams</h1>
      </div>

      {!teams || teams.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: '24px' }}>
          <md-icon style={{ fontSize: '64px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>group</md-icon>
          <h2>No teams yet</h2>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px' }}>Create your first team to start tracking player stats.</p>
          <md-filled-button onClick={() => dialogRef.current?.show()}>
            <md-icon slot="icon">add</md-icon>
            Create Team
          </md-filled-button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {teams.map(team => (
            <div 
              key={team.id}
              onClick={() => router.push(`/teams/${team.id}`)}
              style={{ 
                padding: '24px', 
                backgroundColor: 'var(--md-sys-color-surface-container-low)', 
                borderRadius: '16px',
                cursor: 'pointer',
                border: '1px solid var(--md-sys-color-outline-variant)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{team.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>
                <md-icon style={{ fontSize: '18px' }}>person</md-icon>
                <span>{team.players?.length || 0} Players</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <md-dialog ref={dialogRef}>
        <div slot="headline">Create New Team</div>
        <div slot="content">
          <md-filled-text-field
            label="Team Name"
            value={newTeamName}
            onInput={(e: any) => setNewTeamName(e.target.value)}
            style={{ width: '100%' }}
          ></md-filled-text-field>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreateTeam} disabled={isCreating || !newTeamName}>
            {isCreating ? 'Creating...' : 'Create'}
          </md-filled-button>
        </div>
      </md-dialog>

      <ResponsiveFab
        label="Add Team"
        icon="add"
        onClick={() => dialogRef.current?.show()}
      />
    </div>
  );
}
