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
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-surface/80 backdrop-blur-md border-b border-border-main min-h-[56px] transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="material-symbols-outlined text-[#0A0A0B] font-bold text-lg">query_stats</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-tx-primary">StatVision</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {mounted && isAuthenticated && (
          <Button
            onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
            variant="ghost"
            size="sm"
            icon="logout"
            className="hover:!text-error"
          >
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}
