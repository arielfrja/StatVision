/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/elevated-card.js';
import '@material/web/labs/card/outlined-card.js';
import '@material/web/dialog/dialog.js';
import '@material/web/textfield/filled-text-field.js';
import { Team } from '@/types/team';
import apiClient from '@/utils/apiClient';

const TeamsPage = () => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>('/teams');
  
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => setShowModal(false);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [showModal]);

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    setIsCreating(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.post('/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTeamName('');
      setShowModal(false);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <md-circular-progress indeterminate></md-circular-progress>
    </div>
  );

  return (
    <div style={{ paddingBottom: '64px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
        <div>
          <p style={{ color: 'var(--md-sys-color-primary)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 4px 0' }}>Organization</p>
          <h1 style={{ fontSize: '36px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>Squad Management</h1>
        </div>
        <md-filled-button onClick={() => setShowModal(true)}>
          <md-icon slot="icon">add</md-icon>
          Create New Squad
        </md-filled-button>
      </header>

      {!teams || teams.length === 0 ? (
        <md-outlined-card style={{ padding: '96px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px dashed var(--md-sys-color-outline-variant)', background: 'transparent' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--md-sys-color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <md-icon style={{ fontSize: '36px', color: 'var(--md-sys-color-on-surface-variant)' }}>groups</md-icon>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>The Roster is Empty</h2>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, maxWidth: '400px', margin: '0 auto 40px' }}>Create your first team to begin building elite rosters and tracking performance.</p>
          <md-outlined-button onClick={() => setShowModal(true)}>Create Team</md-outlined-button>
        </md-outlined-card>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {teams.map((team: Team) => (
            <md-elevated-card 
              key={team.id}
              style={{ flex: '1 1 300px', cursor: 'pointer' }}
              onClick={() => router.push(`/teams/${team.id}`)}
            >
              <div style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                {/* Background decoration */}
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.1 }}>
                  <md-icon style={{ fontSize: '96px' }}>sports_basketball</md-icon>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
                    background: team.isTemp ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-primary)',
                    border: team.isTemp ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
                    color: team.isTemp ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-primary)',
                  }}>
                    <md-icon style={{ fontWeight: 700 }}>{team.isTemp ? 'bolt' : 'shield'}</md-icon>
                  </div>
                  {team.isTemp && (
                    <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--md-sys-color-surface)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--md-sys-color-outline-variant)' }}>Park Mode</span>
                  )}
                </div>

                <h3 style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: '0 0 8px 0' }}>{team.name}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <md-icon style={{ fontSize: '14px' }}>person</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{team.players?.length || 0} Roster</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--md-sys-color-outline-variant)', paddingLeft: '24px' }}>
                    <md-icon style={{ fontSize: '14px' }}>event</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Manage Roster
                    <md-icon style={{ fontSize: '14px' }}>arrow_forward</md-icon>
                  </span>
                  {!team.isTemp && <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>Official Club</span>}
                </div>
              </div>
            </md-elevated-card>
          ))}
        </div>
      )}

      <md-dialog ref={dialogRef} open={showModal}>
        <div slot="headline">Create New Squad</div>
        <div slot="content">
          <md-filled-text-field
            label="Team Name"
            value={newTeamName}
            onInput={(e: any) => setNewTeamName(e.target.value)}
            placeholder="e.g. Gotham City Knights"
            style={{ width: '100%' }}
          ></md-filled-text-field>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setShowModal(false)} disabled={isCreating}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreateTeam} disabled={isCreating || !newTeamName}>Confirm Squad</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};

export default TeamsPage;
