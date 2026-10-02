'use client';

import React from 'react';
import Header from '@/components/Header';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';

// Authenticated shell: AuthGuard provides loading skeleton, error retry,
// and appState.returnTo preserve/restore (see components/AuthGuard.tsx +
// user-provider onRedirectCallback). F5 on deep links (e.g. /games/:id)
// preserves URL via refresh-token session + returnTo restore.
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SideNav />
      <div className="main-content-wrapper">
        <Header />
        <main className="main-content-container">
          {children}
        </main>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
