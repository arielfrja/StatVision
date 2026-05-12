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
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--bg-container-low)] border-t border-[var(--border-ghost)] flex items-center justify-around px-2 z-50 md:hidden frosted-glass">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-100 active:scale-90 active:bg-container-highest click-flash ${
              isActive 
                ? 'text-[var(--primary-electric)]' 
                : 'text-[var(--text-dim)]'
            }`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
              isActive ? 'bg-[var(--bg-container-highest)] shadow-[0_0_10px_rgba(0,209,255,0.1)]' : ''
            }`}>
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
