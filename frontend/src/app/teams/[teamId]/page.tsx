'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Loader from '@/components/Loader';
import ResponsiveFab from '@/components/ResponsiveFab';
import ClientOnlyWrapper from '@/components/ClientOnlyWrapper';
import { useParams } from 'next/navigation';
import { PlayerTeamHistory } from '@/types/player'; // New Import
import { Team } from '@/types/team'; // New Import

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';

import axios from 'axios';

// Define the combined type for the roster display
interface RosterPlayer extends PlayerTeamHistory {
    player: { // Nested Player details from the relation
        id: string;
        name: string;
    }
}

function TeamPlayersPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const addPlayerDialogRef = useRef<any>(null);

  // --- State Declarations ---
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  
  // New Player State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number | '' >('');
  const [newPlayerDescription, setNewPlayerDescription] = useState('');

  // Edit Player State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editedPlayerJersey, setEditedPlayerJersey] = useState<number | '' >('');
  const [editedPlayerDescription, setEditedPlayerDescription] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areMdcComponentsReady, setAreMdcComponentsReady] = useState(false);

  useEffect(() => {
    const checkMdcComponents = () => {
      if (customElements.get('md-dialog') && customElements.get('md-list') && customElements.get('md-list-item') && customElements.get('md-filled-text-field') && customElements.get('md-filled-button') && customElements.get('md-filled-icon-button') && customElements.get('md-icon') && customElements.get('md-text-button')) {
        setAreMdcComponentsReady(true);
      } else {
        setTimeout(checkMdcComponents, 50);
      }
    };
    checkMdcComponents();
  }, []);

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      
      // 1. Fetch Team Details
      const teamResponse = await axios.get(`http://localhost:3000/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(teamResponse.data);
      
      // 2. Fetch Roster (PlayerTeamHistory records)
      const playersResponse = await axios.get(`http://localhost:3000/teams/${teamId}/players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayers(playersResponse.data);

    } catch (error: any) {
      console.error("An error occurred in fetchTeamDetails:", error);
      setError(error.message);
      if (error.error === 'login_required' || error.error === 'consent_required' || error.error === 'unauthorized') {
        loginWithRedirect();
      }
    } finally {
      setIsLoading(false);
    }
  }, [teamId, getAccessTokenSilently, loginWithRedirect]);

  useEffect(() => {
    if (areMdcComponentsReady) {
        fetchTeamDetails();
    }
  }, [fetchTeamDetails, areMdcComponentsReady]);

  const handleCreatePlayer = async () => {
    if (!teamId || !newPlayerName) {
        setError('Player name is required.');
        return;
    }
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`http://localhost:3000/teams/${teamId}/players`, { 
        name: newPlayerName, 
        jerseyNumber: newPlayerJersey || null,
        description: newPlayerDescription || null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      setNewPlayerName('');
      setNewPlayerJersey('');
      setNewPlayerDescription('');
      addPlayerDialogRef.current?.close();
      fetchTeamDetails(); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
      if (error.error === 'login_required' || error.error === 'consent_required' || error.error === 'unauthorized') {
        loginWithRedirect();
      }
    }
  };

  const handleEditPlayer = (player: RosterPlayer) => {
    setEditingPlayerId(player.playerId); // Use playerId for the timeless Player
    setEditedPlayerJersey(player.jerseyNumber || '');
    setEditedPlayerDescription(player.description || '');
  };

  const handleSavePlayer = async (playerId: string) => {
    if (!teamId) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`http://localhost:3000/teams/${teamId}/players/${playerId}`, { 
        jerseyNumber: editedPlayerJersey || null,
        description: editedPlayerDescription || null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setEditingPlayerId(null);
      fetchTeamDetails(); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
      if (error.error === 'login_required' || error.error === 'consent_required' || error.error === 'unauthorized') {
        loginWithRedirect();
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditedPlayerJersey('');
    setEditedPlayerDescription('');
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!teamId) return;
    if (!confirm('Are you sure you want to remove this player from the roster?')) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`http://localhost:3000/teams/${teamId}/players/${playerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTeamDetails(); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
      if (error.error === 'login_required' || error.error === 'consent_required' || error.error === 'unauthorized') {
        loginWithRedirect();
      }
    }
  };

  const handleShowAddPlayerDialog = () => {
    if (addPlayerDialogRef.current && typeof addPlayerDialogRef.current.show === 'function') {
      addPlayerDialogRef.current.show();
    } else {
      console.error("Dialog ref is not ready or does not have a show() method.");
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

  if (!team) {
    return (
        <main style={{ padding: 'var(--spacing-md)' }}>
            <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Team Not Found</h1>
            <p>The team with ID {teamId} could not be loaded.</p>
        </main>
    );
  }

  return (
    <main className="main-content-container">
      <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)', color: 'var(--md-sys-color-primary)' }}>
        {team.name} Roster Management
      </h1>
      
      {/* Add Player Dialog */}
      <md-dialog ref={addPlayerDialogRef}>        
        <div slot="headline">Add Player to {team.name}</div>
        <div slot="content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <md-filled-text-field
              label="Player Name (Required)"
              value={newPlayerName}
              onInput={(e: any) => setNewPlayerName(e.target.value)}
            ></md-filled-text-field>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <md-filled-text-field
                    label="Jersey # (Optional)"
                    value={newPlayerJersey}
                    type="number"
                    style={{ width: '120px' }}
                    onInput={(e: any) => setNewPlayerJersey(Number(e.target.value))}
                ></md-filled-text-field>
                <md-filled-text-field
                    label="Description (e.g., 'Tall Guy', 'Captain')"
                    value={newPlayerDescription}
                    style={{ flexGrow: 1 }}
                    onInput={(e: any) => setNewPlayerDescription(e.target.value)}
                ></md-filled-text-field>
            </div>
          </div>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => addPlayerDialogRef.current?.close()}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreatePlayer} disabled={!newPlayerName}>
            <md-icon slot="icon">person_add</md-icon>
            Create Player
          </md-filled-button>
        </div>
      </md-dialog>
      
      {/* Current Roster Section */}
      <div style={{ 
        padding: 'var(--spacing-md)', 
        backgroundColor: 'var(--md-sys-color-surface-container-low)', 
        borderRadius: 'var(--border-radius-md)', 
        boxShadow: 'var(--shadow-elevation-1)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ color: 'var(--md-sys-color-on-surface)' }}>Current Roster ({players.length})</h2>
        </div>

        {/* Player List Header (Desktop Only) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '0 var(--spacing-md)', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }} className="player-list-header hidden-on-mobile">
          <span>Name</span>
          <span style={{ textAlign: 'center' }}>Jersey #</span>
          <span style={{ textAlign: 'center' }}>Description</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        <md-list style={{ padding: '0' }}>
          {players.map(playerHistory => (
            <md-list-item 
              key={playerHistory.id} 
              style={{ 
                borderRadius: 'var(--border-radius-md)', 
                marginBottom: 'var(--spacing-sm)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                boxShadow: 'var(--shadow-elevation-1)',
                padding: 'var(--spacing-md)',
                height: 'auto',
                '--md-list-item-container-color': 'transparent',
              }}
            >
              {editingPlayerId === playerHistory.playerId ? (
                // Edit State: Structured layout for inputs
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', alignItems: 'center', width: '100%', gap: 'var(--spacing-sm)' }}>
                  <div style={{ fontWeight: 'bold' }}>{playerHistory.player.name}</div>
                  <md-filled-text-field
                    value={editedPlayerJersey}
                    type="number"
                    onInput={(e: any) => setEditedPlayerJersey(Number(e.target.value))}
                    style={{ width: '100%', textAlign: 'center' }}
                  ></md-filled-text-field>
                  <md-filled-text-field
                    value={editedPlayerDescription}
                    onInput={(e: any) => setEditedPlayerDescription(e.target.value)}
                    style={{ width: '100%' }}
                  ></md-filled-text-field>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                    <md-filled-icon-button onClick={() => handleSavePlayer(playerHistory.playerId)}><md-icon filled>save</md-icon></md-filled-icon-button>
                    <md-filled-icon-button onClick={handleCancelEdit}><md-icon filled>cancel</md-icon></md-filled-icon-button>
                  </div>
                </div>
              ) : (
                // Display State: Structured layout for display
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', alignItems: 'center', width: '100%' }}>
                  <div style={{ fontWeight: 'bold' }}>{playerHistory.player.name}</div>
                  <div style={{ textAlign: 'center', color: 'var(--md-sys-color-primary)' }}>{playerHistory.jerseyNumber ? `#${playerHistory.jerseyNumber}` : 'N/A'}</div>
                  <div style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playerHistory.description || '-'}</div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                    <md-filled-icon-button onClick={() => handleEditPlayer(playerHistory)}><md-icon filled>edit</md-icon></md-filled-icon-button>
                    <md-filled-icon-button onClick={() => handleDeletePlayer(playerHistory.playerId)}><md-icon filled>delete</md-icon></md-filled-icon-button>
                  </div>
                </div>
              )}
            </md-list-item>
          ))}
        </md-list>
      </div>

      {/* Floating Action Button (FAB) */} 
      <ResponsiveFab 
        label="Add Player" 
        icon="person_add" 
        onClick={handleShowAddPlayerDialog}
      />
    </main>
  );
}

const TeamPlayersPageWithAuth = withAuthenticationRequired(TeamPlayersPage, {
  onRedirecting: () => {
    return <Loader />;
  },
});

export default function TeamPlayersPageWrapper() {
  return (
    <ClientOnlyWrapper>
      <TeamPlayersPageWithAuth />
    </ClientOnlyWrapper>
  );
}
