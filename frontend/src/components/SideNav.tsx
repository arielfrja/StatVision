'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';

const SideNav = () => {
  const pathname = usePathname();
  const { logout } = useAuth0();

  const navItems = [
    { label: 'Performance', icon: 'dashboard', path: '/dashboard' },
    { label: 'Games', icon: 'sports_basketball', path: '/games' },
    { label: 'Teams', icon: 'groups', path: '/teams' },
    { label: 'Players', icon: 'person', path: '/players' },
    { label: 'Analytics', icon: 'leaderboard', path: '/stats' },
    { label: 'Usage', icon: 'data_usage', path: '/usage' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border-main flex flex-col p-5 z-50 hidden md:flex">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
          <span className="material-symbols-outlined text-[#0A0A0B] font-bold text-xl">query_stats</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-tx-primary">StatVision</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
                isActive 
                  ? 'bg-surface-high text-accent border border-border-main' 
                  : 'text-tx-secondary hover:bg-surface-high hover:text-tx-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border-main">
        <button
          onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
          className="flex items-center gap-3 px-3 py-2 w-full text-tx-dim hover:text-tx-primary transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
