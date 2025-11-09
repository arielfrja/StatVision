'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import Loader from '@/components/Loader';
import { Team } from '@/types/team';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ResponsiveFab from '@/components/ResponsiveFab';
import ClientOnlyWrapper from '@/components/ClientOnlyWrapper';

// Import Material Web Components
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';


function TeamsPage() {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areMdcComponentsReady, setAreMdcComponentsReady] = useState(false);
  
  const [newTeamName, setNewTeamName] = useState('');
  const addTeamDialogRef = useRef<any>(null);


  // Utility to check if Material Web Components are ready
  useEffect(() => {
    const checkMdcComponents = () => {
      if (customElements.get('md-list') && customElements.get('md-list-item') && customElements.get('md-filled-button') && customElements.get('md-icon') && customElements.get('md-dialog') && customElements.get('md-text-button') && customElements.get('md-filled-text-field')) {
        setAreMdcComponentsReady(true);
      } else {
        setTimeout(checkMdcComponents, 50);
      }
    };
    checkMdcComponents();
  }, []);

  useEffect(() => {
    if (areMdcComponentsReady) {
        fetchTeams();
    }
  }, [getAccessTokenSilently, areMdcComponentsReady]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();

      const response = await axios.get('http://localhost:3000/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTeams(response.data);
    } catch (error: any) {
      console.error("An error occurred in fetchTeams:", error);
      setError(error.message);
      // If there's an authentication error, redirect to login
      if (error.error === 'login_required' || error.error === 'consent_required' || error.error === 'unauthorized') {
        loginWithRedirect();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) {
        setError('Team name is required.');
        return;
    }
    try {
      const token = await getAccessTokenSilently();
      await axios.post('http://localhost:3000/teams', { name: newTeamName }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setNewTeamName('');
      addTeamDialogRef.current?.close();
      fetchTeams(); // Refresh the list
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  const handleShowAddTeamDialog = () => {
    if (addTeamDialogRef.current && typeof addTeamDialogRef.current.show === 'function') {
      addTeamDialogRef.current.show();
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

  return (
    <main className="main-content-container">
      <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', color: 'var(--md-sys-color-primary)' }}>Team Management</h1>
      
      {/* Add Team Dialog */}
      <md-dialog ref={addTeamDialogRef}>        
        <div slot="headline">Create a New Team</div>
        <div slot="content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <md-filled-text-field
              label="Team Name (Required)"
              value={newTeamName}
              onInput={(e: any) => setNewTeamName(e.target.value)}
            ></md-filled-text-field>
          </div>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => addTeamDialogRef.current?.close()}>Cancel</md-text-button>
          <md-filled-button onClick={handleCreateTeam} disabled={!newTeamName}>
            <md-icon slot="icon">add</md-icon>
            Create Team
          </md-filled-button>
        </div>
      </md-dialog>

      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
          <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>group</md-icon>
          <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No teams found. Create a team to get started!</p>
        </div>
      ) : (
        // Universal Card View from games/page.tsx
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
          {teams.map(team => {
            // @ts-ignore
            const createdDate = new Date(team.createdAt).toLocaleDateString();

            return (
              <div 
                key={team.id} 
                onClick={() => router.push(`/teams/${team.id}`)}
                style={{ 
                  padding: 'var(--spacing-md)', 
                  backgroundColor: 'var(--md-sys-color-surface-container-low)', 
                  borderRadius: 'var(--border-radius-md)', 
                  boxShadow: 'var(--shadow-elevation-1)',
                  cursor: 'pointer',
                  borderLeft: `4px solid var(--md-sys-color-primary)`,
                  transition: 'transform 0.1s ease-in-out',
                }}
                // @ts-ignore
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                // @ts-ignore
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>{team.name}</h3>
                  <md-icon style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>chevron_right</md-icon>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--md-sys-typescale-body-small-size)' }}>
                  <p>
                    <span style={{ color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center' }}>
                      <md-icon style={{ fontSize: '16px', marginRight: '4px' }}>group</md-icon>
                      {/* Could show player count here if available */}
                      Team
                    </span>
                  </p>
                  <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Created: {createdDate}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Responsive FAB for creating a new team */}
      <ResponsiveFab
        label="Create Team"
        icon="add"
        onClick={handleShowAddTeamDialog}
      />
    </main>
  );
}

const TeamsPageWithAuth = withAuthenticationRequired(TeamsPage, {
    onRedirecting: () => {
      return <Loader />;
    },
});

export default function TeamsPageWrapper() {
    return (
      <ClientOnlyWrapper>
        <TeamsPageWithAuth />
      </ClientOnlyWrapper>
    );
}