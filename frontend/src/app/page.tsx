'use client';

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import Loader from '@/components/Loader';

export default function Home() {
  const { user, isAuthenticated, loginWithRedirect, isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '1rem', color: 'red' }}>
        <h1>Authentication Error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '1rem', textAlign: 'center' }}>
      {isAuthenticated && user ? (
        <div>
          <h1>Welcome, {user.name || user.email}!</h1>
          <p>You are logged in. You can now access the application features.</p>
          <a href="/teams">
            <md-filled-button>Manage Teams</md-filled-button>
          </a>
        </div>
      ) : (
        <div style={{ maxWidth: '400px', margin: 'auto', paddingTop: '50px' }}>
          <h1>Welcome to StatVision</h1>
          <p style={{ marginBottom: '2rem' }}>Please log in to continue.</p>
          <md-filled-button onClick={() => loginWithRedirect()}>
            Login
          </md-filled-button>
          <md-outlined-button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })} style={{ marginLeft: '8px' }}>
            Sign Up
          </md-outlined-button>
        </div>
      )}
    </main>
  );
}