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
      <Header />
      <SideNav />
      <div className="main-content-wrapper">
        <div className="main-content-container">
          {children}
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
