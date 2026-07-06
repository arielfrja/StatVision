/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@/app/user-provider';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/outlined-card.js';
import '@material/web/dialog/dialog.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/textfield/filled-text-field.js';
import ClientOnlyWrapper from '@/components/ClientOnlyWrapper';
import { useParams, useRouter } from 'next/navigation';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import apiClient from '@/utils/apiClient';

interface RosterPlayer extends Omit<PlayerTeamHistory, 'player'> {
    player: {
        id: string;
        name: string;
    };
}

function TeamPlayersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const { getAccessTokenSilently } = useAuth0();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number | '' >('');
  const [newPlayerDescription, setNewPlayerDescription] = useState('');

  const addDialogRef = useRef<HTMLElement>(null);
  const deleteDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = addDialogRef.current;
    if (!el) return;
    const handler = () => setShowAddModal(false);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [showAddModal]);

  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    const handler = () => setPlayerToDelete(null);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [playerToDelete]);

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const [teamRes, playersRes] = await Promise.all([
        apiClient.get(`/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get(`/teams/${teamId}/players`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, getAccessTokenSilently]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const handleCreatePlayer = async () => {
    if (!teamId || !newPlayerName) return;
    setIsRecruiting(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.post(`/teams/${teamId}/players`, { 
        name: newPlayerName, 
        jerseyNumber: newPlayerJersey || null,
        description: newPlayerDescription || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setNewPlayerName('');
      setNewPlayerJersey('');
      setNewPlayerDescription('');
      fetchTeamDetails();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsRecruiting(false);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayerToDelete(playerId);
  };

  const confirmDeletePlayer = async () => {
    if (!teamId || !playerToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.delete(`/teams/${teamId}/players/${playerToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayerToDelete(null);
      fetchTeamDetails();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <md-circular-progress indeterminate></md-circular-progress>
    </div>
  );

  if (!team) return <div style={{ padding: '32px', textAlign: 'center', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '-0.05em', fontSize: '24px' }}>Squad Not Found</div>;

  return (
    <main style={{ padding: '16px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '96px' }}>
      {/* Team Header */}
      <md-outlined-card style={{ padding: '24px', marginBottom: '48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={() => router.push('/teams')} style={{ color: 'var(--md-sys-color-primary)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <md-icon style={{ fontSize: '14px' }}>arrow_back</md-icon>
            Back to Squads
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--md-sys-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-sys-color-on-primary)',
            }}>
              <md-icon style={{ fontWeight: 700, fontSize: '24px' }}>shield</md-icon>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>{team.name}</h1>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <md-outlined-button onClick={() => setShowAddModal(true)}>
            <md-icon slot="icon">person_add</md-icon>
            Recruit Player
          </md-outlined-button>
        </div>
      </md-outlined-card>

      {/* Main Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
        {/* Left: Active Roster */}
        <div style={{ flex: '2 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>Active Roster ({players.length})</h2>
          </div>

          {players.length === 0 ? (
            <md-outlined-card style={{ padding: '80px 24px', textAlign: 'center', border: '2px dashed var(--md-sys-color-outline-variant)', background: 'transparent' }}>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>No players recruited yet.</p>
            </md-outlined-card>
          ) : (
            <md-list style={{ background: 'var(--md-sys-color-surface)', borderRadius: '12px' }}>
              {players.map((p) => (
                <md-list-item key={p.id}>
                  <md-icon slot="start">person</md-icon>
                  <div slot="headline">{p.player.name}</div>
                  <div slot="supporting-text">{p.description || 'Active Prospect'}</div>
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: 'var(--md-sys-color-primary)', opacity: 0.6, minWidth: '36px', textAlign: 'center' }}>
                      {p.jerseyNumber ? `#${p.jerseyNumber}` : '--'}
                    </span>
                    <md-text-button onClick={() => handleDeletePlayer(p.playerId)} style={{ color: 'var(--md-sys-color-error)', minWidth: 'unset', width: '40px' }}>
                      <md-icon>delete</md-icon>
                    </md-text-button>
                  </div>
                </md-list-item>
              ))}
            </md-list>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <md-outlined-card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 16px 0', fontStyle: 'italic' }}>Squad Intelligence</h3>
            <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
              &ldquo;AI is currently analyzing the active roster. Team synergy metrics and archetypes will be generated once game data is associated with this squad.&rdquo;
            </p>
          </md-outlined-card>

          <md-outlined-card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 24px 0' }}>Season Performance</h3>
            <div style={{ padding: '32px 0', textAlign: 'center', border: '1px dashed var(--md-sys-color-outline-variant)', borderRadius: '12px' }}>
              <md-icon style={{ fontSize: '32px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.2, marginBottom: '8px' }}>leaderboard</md-icon>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Waiting for Game Records
              </p>
            </div>
          </md-outlined-card>
        </div>
      </div>

      {/* Recruit Modal */}
      <md-dialog ref={addDialogRef} open={showAddModal}>
        <div slot="headline">Recruit Player</div>
        <div slot="content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <md-filled-text-field
              label="Full Name"
              value={newPlayerName}
              onInput={(e: any) => setNewPlayerName(e.target.value)}
              placeholder="e.g. Marcus Smart"
            ></md-filled-text-field>
            <div style={{ display: 'flex', gap: '16px' }}>
              <md-filled-text-field
                label="Jersey #"
                type="number"
                value={newPlayerJersey}
                onInput={(e: any) => setNewPlayerJersey(Number(e.target.value))}
                placeholder="00"
                style={{ width: '120px' }}
              ></md-filled-text-field>
              <md-filled-text-field
                label="Description / Role"
                value={newPlayerDescription}
                onInput={(e: any) => setNewPlayerDescription(e.target.value)}
                placeholder="e.g. Defensive Anchor"
                style={{ flex: 1 }}
              ></md-filled-text-field>
            </div>
          </div>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setShowAddModal(false)} disabled={isRecruiting}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreatePlayer} disabled={isRecruiting || !newPlayerName}>Recruit Player</md-filled-button>
        </div>
      </md-dialog>

      {/* Delete Confirmation Dialog */}
      <md-dialog ref={deleteDialogRef} open={!!playerToDelete}>
        <div slot="headline">Release Player?</div>
        <div slot="content">Are you sure you want to remove this player from the active roster? Career stats will be preserved in the global registry.</div>
        <div slot="actions">
          <md-text-button onClick={() => setPlayerToDelete(null)}>Cancel</md-text-button>
          <md-text-button style="color:var(--md-sys-color-error)" onClick={confirmDeletePlayer} disabled={isDeleting}>Confirm Release</md-text-button>
        </div>
      </md-dialog>
    </main>
  );
}

export default function TeamPlayersPageWrapper() {
  return (
    <ClientOnlyWrapper>
      <TeamPlayersPage />
    </ClientOnlyWrapper>
  );
}
