'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ErudaInit from './eruda-init';

const UserProviderWrapper = dynamic(() => import('./user-provider'), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UserProviderWrapper>
      <ErudaInit />
      {children}
    </UserProviderWrapper>
  );
}
