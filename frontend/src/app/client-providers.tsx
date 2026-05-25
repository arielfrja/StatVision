'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ErudaInit from './eruda-init';
import { initGlobalErrorLogging } from '@/utils/logToBackend';

const UserProviderWrapper = dynamic(() => import('./user-provider'), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Initialize global error capture for the client
    // Wrap in try-catch to ensure we don't break hydration even if logging init fails
    try {
        initGlobalErrorLogging();
    } catch (e) {
        console.error('Failed to init global logging:', e);
    }
  }, []);

  if (!mounted) {
    return <div className="bg-primary-bg min-h-screen">{children}</div>;
  }

  return (
    <UserProviderWrapper>
      <ErudaInit />
      {children}
    </UserProviderWrapper>
  );
}
