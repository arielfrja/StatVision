'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';

const SideNav = () => {
  const pathname = usePathname();
  const { logout } = useAuth0();

  const navItems = [
    { label: 'Command Center', icon: 'dashboard', path: '/dashboard' },
    { label: 'Games', icon: 'sports_basketball', path: '/games' },
    { label: 'Teams', icon: 'groups', path: '/teams' },
    { label: 'Players', icon: 'person', path: '/players' },
    { label: 'Analytics', icon: 'leaderboard', path: '/stats' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-container-low border-r border-bd-ghost flex flex-col p-6 z-50 hidden md:flex">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-electric flex items-center justify-center shadow-[0_0_15px_var(--primary-glow)]">
          <span className="material-symbols-outlined text-[#00373a] font-bold">query_stats</span>
        </div>
        <h1 className="text-xl font-bold tracking-tighter italic">STATVISION</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-container-highest text-electric border border-bd-active shadow-[0_0_10px_rgba(0,209,255,0.1)]' 
                  : 'text-tx-secondary hover:bg-container hover:text-tx-primary'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill-1' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-bd-ghost">
        <button
          onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
          className="flex items-center gap-4 px-4 py-3 w-full text-tx-dim hover:text-action transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
