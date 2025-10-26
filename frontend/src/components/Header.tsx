'use client';

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '@material/web/button/outlined-button.js';

export default function Header() {
  const { isAuthenticated, logout } = useAuth0();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f5f5f5' }}>
      <h1>StatVision</h1>
      {isAuthenticated && (
        <md-outlined-button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          Logout
        </md-outlined-button>
      )}
    </header>
  );
}
