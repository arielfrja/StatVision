'use client';

import React from 'react';
import Header from '@/components/Header';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';

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
