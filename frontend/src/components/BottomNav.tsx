'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@material/web/labs/navigationbar/navigation-bar.js';
import '@material/web/labs/navigationtab/navigation-tab.js';

const navItems = [
  { label: 'Live', icon: 'dashboard', path: '/dashboard' },
  { label: 'Games', icon: 'sports_basketball', path: '/games' },
  { label: 'Teams', icon: 'groups', path: '/teams' },
  { label: 'Stats', icon: 'leaderboard', path: '/stats' },
  { label: 'Usage', icon: 'data_usage', path: '/usage' },
];

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = navItems.findIndex(item => item.path === pathname);

  return (
    <md-navigation-bar
      activeIndex={activeIndex >= 0 ? activeIndex : 0}
      @navigation-bar-activated={(e: any) => router.push(navItems[e.detail.activeIndex].path)}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      {navItems.map((item) => (
        <md-navigation-tab
          key={item.path}
          label={item.label}
          active={pathname === item.path}
        >
          <md-icon slot="inactive-icon">{item.icon}</md-icon>
          <md-icon slot="active-icon">{item.icon}</md-icon>
        </md-navigation-tab>
      ))}
    </md-navigation-bar>
  );
};

export default BottomNav;
