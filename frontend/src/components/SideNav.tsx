'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';

const navItems = [
  { label: 'Performance', icon: 'dashboard', path: '/dashboard' },
  { label: 'Games', icon: 'sports_basketball', path: '/games' },
  { label: 'Teams', icon: 'groups', path: '/teams' },
  { label: 'Players', icon: 'person', path: '/players' },
  { label: 'Analytics', icon: 'leaderboard', path: '/stats' },
  { label: 'Usage', icon: 'data_usage', path: '/usage' },
];

const SideNav = () => {
  const pathname = usePathname();
  const { logout } = useAuth0();

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100%',
      width: '360px',
      display: 'none',
      flexDirection: 'column',
      padding: '16px 12px',
      zIndex: 50,
      backgroundColor: 'var(--md-sys-color-surface, #1e1e1e)',
      borderRight: '1px solid var(--md-sys-color-outline-variant, #444)',
    }} className="md-side-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', marginBottom: '16px' }}>
        <md-icon style={{ fontSize: '28px', color: 'var(--md-sys-color-primary)' }}>query_stats</md-icon>
        <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>StatVision</span>
      </div>

      <md-list style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <md-list-item
                type="button"
                {...(isActive ? { selected: '' } : {})}
              >
                <md-icon slot="start">{item.icon}</md-icon>
                <span slot="headline">{item.label}</span>
              </md-list-item>
            </Link>
          );
        })}
      </md-list>

      <md-list>
        <md-list-item
          type="button"
          onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
        >
          <md-icon slot="start">logout</md-icon>
          <span slot="headline">Sign Out</span>
        </md-list-item>
      </md-list>
    </nav>
  );
};

export default SideNav;
