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
      <main style={{ padding: 'var(--spacing-md)', color: 'var(--md-sys-color-error)' }}>
        <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Authentication Error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: 'var(--spacing-md)' }}>
      {isAuthenticated && user ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-variant)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>Welcome, {user.name || user.email}!</h1>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--spacing-lg)' }}>You are logged in. You can now access the application features.</p>
          <a href="/teams" style={{ textDecoration: 'none' }}>
            <md-filled-button>
              Manage Teams
            </md-filled-button>
          </a>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-variant)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <h1 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>Welcome to StatVision</h1>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--spacing-lg)' }}>Please log in or sign up to continue.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
            <md-filled-button onClick={() => loginWithRedirect()}>
              Login
            </md-filled-button>
            <md-outlined-button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
              Sign Up
            </md-outlined-button>
          </div>
        </div>
      )}
    </main>
  );
}