'use client';

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '@material/web/button/outlined-button.js';

export default function Header() {
  const { isAuthenticated, logout } = useAuth0();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--spacing-sm) var(--spacing-md)',
      backgroundColor: 'var(--md-sys-color-primary)',
      color: 'var(--md-sys-color-on-primary)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minHeight: '64px',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>StatVision</h1>
      {isAuthenticated && (
        <md-outlined-button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ '--md-sys-color-primary': 'var(--md-sys-color-on-primary)' } as React.CSSProperties}
        >
          Logout
        </md-outlined-button>
      )}
    </header>
  );
}
