'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Live', icon: 'dashboard', path: '/dashboard' },
    { label: 'Games', icon: 'sports_basketball', path: '/games' },
    { label: 'Teams', icon: 'groups', path: '/teams' },
    { label: 'Stats', icon: 'leaderboard', path: '/stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-t border-border-main flex items-center justify-around px-2 z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-150 ${
              isActive 
                ? 'text-accent' 
                : 'text-tx-dim hover:text-tx-secondary'
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
