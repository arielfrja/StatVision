'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Loader from '@/components/Loader';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/icon/icon.js';

function TeamsPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number | ''>('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editedPlayerName, setEditedPlayerName] = useState('');
  const [editedPlayerJersey, setEditedPlayerJersey] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areMdcComponentsReady, setAreMdcComponentsReady] = useState(false);

  useEffect(() => {
    const checkMdcComponents = () => {
      if (customElements.get('md-list') && customElements.get('md-list-item') && customElements.get('md-filled-text-field') && customElements.get('md-filled-button') && customElements.get('md-outlined-button') && customElements.get('md-filled-icon-button') && customElements.get('md-icon')) {
        setAreMdcComponentsReady(true);
      } else {
        setTimeout(checkMdcComponents, 50);
      }
    };
    checkMdcComponents();
  }, []);

  useEffect(() => {
    console.log("TeamsPage: useEffect triggered.");
    fetchTeams();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (selectedTeam) {
      fetchPlayers(selectedTeam.id);
    } else {
      setPlayers([]);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    console.log("TeamsPage: fetchTeams called.");
    setIsLoading(true);
    try {
      console.log("TeamsPage: Attempting to get access token silently.");
      const token = await getAccessTokenSilently();
      console.log("TeamsPage: Successfully fetched token.");

      const response = await fetch('http://localhost:3000/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("TeamsPage: API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TeamsPage: API fetch failed with status", response.status, "and message:", errorText);
        throw new Error(`Failed to fetch teams: ${errorText}`);
      }

      const data = await response.json();
      console.log("TeamsPage: Successfully fetched teams data:", data);
      setTeams(data);
    } catch (error: any) {
      console.error("TeamsPage: An error occurred in fetchTeams:", error);
      setError(error.message);
    } finally {
      console.log("TeamsPage: fetchTeams finished, setting isLoading to false.");
      setIsLoading(false);
    }
  };

  const fetchPlayers = async (teamId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:3000/teams/${teamId}/players`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      setPlayers(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:3000/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTeamName }),
      });
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      setNewTeamName('');
      fetchTeams(); // Refresh the list
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCreatePlayer = async () => {
    if (!selectedTeam || !newPlayerName || !newPlayerJersey) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:3000/teams/${selectedTeam.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newPlayerName, jerseyNumber: newPlayerJersey }),
      });
      if (!response.ok) {
        throw new Error('Failed to create player');
      }
      setNewPlayerName('');
      setNewPlayerJersey('');
      fetchPlayers(selectedTeam.id); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditPlayer = (player: any) => {
    setEditingPlayerId(player.id);
    setEditedPlayerName(player.name);
    setEditedPlayerJersey(player.jerseyNumber);
  };

  const handleSavePlayer = async (playerId: string) => {
    if (!selectedTeam || !editedPlayerName || !editedPlayerJersey) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:3000/teams/${selectedTeam.id}/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editedPlayerName, jerseyNumber: editedPlayerJersey }),
      });
      if (!response.ok) {
        throw new Error('Failed to update player');
      }
      setEditingPlayerId(null);
      fetchPlayers(selectedTeam.id); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditedPlayerName('');
    setEditedPlayerJersey('');
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:3000/teams/${selectedTeam.id}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete player');
      }
      fetchPlayers(selectedTeam.id); // Refresh the player list
    } catch (error: any) {
      setError(error.message);
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
    <main style={{ padding: 'var(--spacing-md)', maxWidth: '1200px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-primary)' }}>Team Management</h1>
      <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-md)' }}>
        <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--spacing-md)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>My Teams</h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <md-filled-text-field
              label="New Team Name"
              value={newTeamName}
              style={{ flexGrow: 1 }}
              onInput={(e: any) => setNewTeamName(e.target.value)}
            ></md-filled-text-field>
            <md-filled-button onClick={handleCreateTeam}>Create</md-filled-button>
          </div>
          <md-list>
            {teams.map(team => (
              <md-list-item
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                selected={selectedTeam?.id === team.id}
                type="button"
                style={{ backgroundColor: selectedTeam?.id === team.id ? 'var(--md-sys-color-primary-container)' : 'transparent' }}
              >
                <div slot="headline" style={{ color: 'var(--md-sys-color-on-surface)' }}>{team.name}</div>
              </md-list-item>
            ))}
          </md-list>
        </div>
        <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--spacing-md)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>Players</h2>
          {selectedTeam ? (
            <div>
              <h3 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>Players for {selectedTeam.name}</h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <md-filled-text-field
                  label="Player Name"
                  value={newPlayerName}
                  style={{ flexGrow: 1 }}
                  onInput={(e: any) => setNewPlayerName(e.target.value)}
                ></md-filled-text-field>
                <md-filled-text-field
                  label="Jersey #"
                  value={newPlayerJersey}
                  type="number"
                  style={{ width: '80px' }}
                  onInput={(e: any) => setNewPlayerJersey(Number(e.target.value))}
                ></md-filled-text-field>
                <md-filled-button onClick={handleCreatePlayer}>Add Player</md-filled-button>
              </div>
              <md-list>
                {players.map(player => (
                  <md-list-item key={player.id}>
                    {editingPlayerId === player.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <md-filled-text-field
                          value={editedPlayerName}
                          onInput={(e: any) => setEditedPlayerName(e.target.value)}
                          style={{ flexGrow: 1, marginRight: 'var(--spacing-sm)' }}
                        ></md-filled-text-field>
                        <md-filled-text-field
                          value={editedPlayerJersey}
                          type="number"
                          onInput={(e: any) => setEditedPlayerJersey(Number(e.target.value))}
                          style={{ width: '60px', marginRight: 'var(--spacing-sm)' }}
                        ></md-filled-text-field>
                        <md-filled-icon-button onClick={() => handleSavePlayer(player.id)}><md-icon filled>save</md-icon></md-filled-icon-button>
                        <md-filled-icon-button onClick={handleCancelEdit}><md-icon filled>cancel</md-icon></md-filled-icon-button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div slot="headline" style={{ color: 'var(--md-sys-color-on-surface)' }}>{player.name} (#{player.jerseyNumber})</div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                          <md-filled-icon-button onClick={() => handleEditPlayer(player)}><md-icon filled>edit</md-icon></md-filled-icon-button>
                          <md-filled-icon-button onClick={() => handleDeletePlayer(player.id)}><md-icon filled>delete</md-icon></md-filled-icon-button>
                        </div>
                      </div>
                    )}
                  </md-list-item>
                ))}
              </md-list>
            </div>
          ) : (
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Select a team to see its players.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default withAuthenticationRequired(TeamsPage, {
  onRedirecting: () => <Loader />,
});
