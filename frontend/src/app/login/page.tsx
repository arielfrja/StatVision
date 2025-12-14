'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until the SDK is initialized
    }

    if (isAuthenticated) {
      router.push('/'); // If user is already logged in, redirect to home
      return;
    }

    // If not loading and not authenticated, trigger the login flow
    loginWithRedirect();
    
  }, [isLoading, isAuthenticated, loginWithRedirect, router]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <Loader />
      <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>
        {isAuthenticated ? 'Redirecting...' : 'Redirecting to login...'}
      </p>
    </main>
  );
}
