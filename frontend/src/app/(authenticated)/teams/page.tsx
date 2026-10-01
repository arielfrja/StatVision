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
import '@material/web/textfield/outlined-text-field.js';
import { Team } from '@/types/team';
import apiClient from '@/utils/apiClient';

const TeamsPage = () => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>('/teams');
  
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'players'>('name-asc');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' } | null>(null);

  const dialogRef = useRef<HTMLElement>(null);
  const renameDialogRef = useRef<HTMLElement>(null);
  const deleteDialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => setShowModal(false);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [showModal]);
  useEffect(() => {
    const el = renameDialogRef.current;
    if (!el) return;
    const handler = () => setEditingTeam(null);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [editingTeam]);
  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    const handler = () => setTeamToDelete(null);
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [teamToDelete]);

  const showToast = (msg: string, kind: 'success' | 'error') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const visibleTeams = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (teams || []).filter((t) => !q || t.name.toLowerCase().includes(q));
    const sorted = [...filtered];
    if (sort === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === 'players') sorted.sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0));
    return sorted;
  }, [teams, search, sort]);

  const handleCreateTeam = async () => {
    // Double-submit guard: ignore re-entry while creating; trim whitespace
    // so "   " can never create a blank squad.
    const trimmed = newTeamName.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.post('/teams', { name: trimmed }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTeamName('');
      setShowModal(false);
      mutate();
      showToast(`Squad "${trimmed}" created.`, 'success');
    } catch (err: any) {
      console.error(err);
      setCreateError(err?.response?.data?.message || 'Failed to create squad. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const openRename = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setRenameValue(team.name);
    setEditingTeam(team);
  };

  const confirmRename = async () => {
    const trimmed = renameValue.trim();
    if (!editingTeam || !trimmed || isRenaming) return;
    setIsRenaming(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.put(`/teams/${editingTeam.id}`, { name: trimmed }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingTeam(null);
      mutate();
      showToast(`Squad renamed to "${trimmed}".`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Failed to rename squad.', 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const openDelete = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setTeamToDelete(team);
  };

  const confirmDelete = async () => {
    if (!teamToDelete || isDeleting) return;
    const target = teamToDelete;
    setIsDeleting(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.delete(`/teams/${target.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamToDelete(null);
      mutate();
      showToast(`Squad "${target.name}" deleted.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Failed to delete squad.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px', textAlign: 'center' }}>
        <md-icon>cloud_off</md-icon>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
          Cannot reach server
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
          Squads could not be loaded. Check your connection and try again.
        </p>
        <md-filled-button onClick={() => mutate()}>
          <md-icon slot="icon">refresh</md-icon>
          Retry
        </md-filled-button>
      </div>
    );
  }

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <md-filled-button onClick={() => setShowModal(true)}>
            <md-icon slot="icon">add</md-icon>
            Create New Squad
          </md-filled-button>
        </div>
        {(teams && teams.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <md-outlined-text-field
              label="Search squads"
              value={search}
              onInput={(e: any) => setSearch(e.target.value)}
              placeholder="e.g. Knights"
              style={{ flex: '1 1 220px', maxWidth: '320px' }}
            ></md-outlined-text-field>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Sort squads"
                style={{
                  padding: '10px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '13px',
                }}
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="players">Most players</option>
              </select>
            </label>
          </div>
        )}
      </header>

      {!teams || teams.length === 0 ? (
        <md-outlined-card>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--md-sys-color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <md-icon>groups</md-icon>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>The Roster is Empty</h2>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, maxWidth: '400px', margin: '0 auto 40px' }}>Create your first team to begin building elite rosters and tracking performance.</p>
          <md-outlined-button onClick={() => setShowModal(true)}>Recruit Your First Squad</md-outlined-button>
        </md-outlined-card>
      ) : visibleTeams.length === 0 ? (
        <md-outlined-card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>No squads match “{search.trim()}”</h2>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, margin: '0 auto 24px' }}>Try a different search or create a new squad.</p>
            <md-outlined-button onClick={() => setSearch('')}>Clear Search</md-outlined-button>
          </div>
        </md-outlined-card>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {visibleTeams.map((team: Team) => (
            <md-elevated-card 
              key={team.id}
              onClick={() => router.push(`/teams/${team.id}`)}
              tabIndex={0}
              role="link"
              aria-label={`Open team ${team.name}`}
              onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/teams/${team.id}`); } }}
            >
              <div style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                {/* Background decoration */}
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.1 }}>
                  <md-icon>sports_basketball</md-icon>
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
                    <md-icon>{team.isTemp ? 'bolt' : 'shield'}</md-icon>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {team.isTemp && (
                      <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--md-sys-color-surface)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--md-sys-color-outline-variant)' }}>Park Mode</span>
                    )}
                    <button
                      onClick={(e) => openRename(e, team)}
                      title="Rename squad"
                      aria-label={`Rename squad ${team.name}`}
                      style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <md-icon>edit</md-icon>
                    </button>
                    <button
                      onClick={(e) => openDelete(e, team)}
                      title="Delete squad"
                      aria-label={`Delete squad ${team.name}`}
                      style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <md-icon>delete</md-icon>
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: '0 0 8px 0' }}>{team.name}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <md-icon>person</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{team.players?.length || 0} Roster</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--md-sys-color-outline-variant)', paddingLeft: '24px' }}>
                    <md-icon>event</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Manage Roster
                    <md-icon>arrow_forward</md-icon>
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
          <md-outlined-text-field
            label="Team Name"
            value={newTeamName}
            onInput={(e: any) => setNewTeamName(e.target.value)}
            placeholder="e.g. Gotham City Knights"
            style={{ width: '100%' }}
          ></md-outlined-text-field>
          {createError && (
            <p role="alert" style={{ fontSize: '12px', color: 'var(--md-sys-color-error)', margin: '8px 0 0 0' }}>{createError}</p>
          )}
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setShowModal(false)} disabled={isCreating}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreateTeam} disabled={isCreating || !newTeamName.trim()}>Confirm Squad</md-filled-button>
        </div>
      </md-dialog>

      <md-dialog ref={renameDialogRef} open={!!editingTeam}>
        <div slot="headline">Rename “{editingTeam?.name}”</div>
        <div slot="content">
          <md-outlined-text-field
            label="Squad Name"
            value={renameValue}
            onInput={(e: any) => setRenameValue(e.target.value)}
            style={{ width: '100%' }}
          ></md-outlined-text-field>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => setEditingTeam(null)} disabled={isRenaming}>Cancel</md-text-button>
          <md-filled-button onClick={confirmRename} disabled={isRenaming || !renameValue.trim()}>Save Name</md-filled-button>
        </div>
      </md-dialog>

      <md-dialog ref={deleteDialogRef} open={!!teamToDelete}>
        <div slot="headline">Delete “{teamToDelete?.name}”?</div>
        <div slot="content">This removes the squad and its roster links. Games that used this squad keep working with the team cleared. This action cannot be undone.</div>
        <div slot="actions">
          <md-text-button onClick={() => setTeamToDelete(null)} disabled={isDeleting}>Cancel</md-text-button>
          <md-text-button style={{ color: 'var(--md-sys-color-error)' }} onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete Squad'}
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

export default TeamsPage;
