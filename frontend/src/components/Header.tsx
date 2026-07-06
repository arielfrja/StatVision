'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';

export default function Header() {
  const { isAuthenticated, logout } = useAuth0();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      minHeight: '56px',
      backgroundColor: 'var(--md-sys-color-surface-container, #1e1e1e)',
      borderBottom: '1px solid var(--md-sys-color-outline-variant, #444)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="md-header-brand">
          <md-icon style={{ fontSize: '24px', color: 'var(--md-sys-color-primary)' }}>query_stats</md-icon>
          <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>StatVision</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {mounted && isAuthenticated && (
          <md-text-button onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}>
            <md-icon slot="icon">logout</md-icon>
            Sign Out
          </md-text-button>
        )}
      </div>
    </header>
  );
}
