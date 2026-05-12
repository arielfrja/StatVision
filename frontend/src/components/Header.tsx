'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import Button from '@/components/Button';

export default function Header() {
  const { isAuthenticated, logout } = useAuth0();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-stadium/80 backdrop-blur-md border-b border-bd-ghost min-h-[64px] transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger could go here */}
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-white md:hidden animate-in fade-in slide-in-from-left-4">
          Stat<span className="text-electric">Vision</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {mounted && isAuthenticated && (
          <Button
            onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
            variant="outline"
            size="sm"
            icon="logout"
            className="border-bd-ghost hover:border-red-500/50 hover:text-red-500"
          >
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
