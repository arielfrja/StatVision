'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import '@material/web/button/outlined-button.js';
import Link from 'next/link';

export default function Header() {
  const { isAuthenticated, logout } = useAuth0();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-stadium/80 backdrop-blur-md border-b border-bd-ghost min-h-[64px]">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger could go here */}
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-white md:hidden">StatVision</h1>
      </div>

      <div className="flex items-center gap-4">
        {mounted && isAuthenticated && (
          <button
            onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
            className="px-4 py-2 rounded-lg border border-electric text-electric text-xs font-bold uppercase tracking-widest hover:bg-electric/10 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
