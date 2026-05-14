'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Auth0Provider, useAuth0 as useAuth0Real } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import SWRProvider from './swr-provider';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: any;
  error?: Error;
  logout: (options?: any) => void;
  loginWithRedirect: (options?: any) => Promise<void>;
  getAccessTokenSilently: (options?: any) => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth0 = () => {
  const context = useContext(AuthContext);
  return context || ({
    isAuthenticated: false,
    isLoading: true,
    logout: () => {},
    loginWithRedirect: () => Promise.resolve(),
    getAccessTokenSilently: () => Promise.resolve(""),
  } as AuthState);
};

export default function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticatedMock, setIsAuthenticatedMock] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem('mock_is_authenticated');
    if (stored === 'false') setIsAuthenticatedMock(false);
  }, []);

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

  const shouldUseMock = isMock || !domain || !clientId || !baseUrl;

  const mockValue = useMemo(() => ({
    isAuthenticated: isAuthenticatedMock,
    isLoading: false,
    user: isAuthenticatedMock ? { sub: "test-user-123", email: "test@statvision.ai", name: "Test User" } : null,
    logout: () => {
      sessionStorage.setItem('mock_is_authenticated', 'false');
      setIsAuthenticatedMock(false);
      router.push('/');
    },
    loginWithRedirect: () => {
      sessionStorage.setItem('mock_is_authenticated', 'true');
      setIsAuthenticatedMock(true);
      router.push('/dashboard');
      return Promise.resolve();
    },
    getAccessTokenSilently: () => Promise.resolve("mock-token"),
  }), [isAuthenticatedMock, router]);

  // SSR: Minimal shell
  if (!mounted) {
    return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
  }

  if (shouldUseMock) {
    return (
      <AuthContext.Provider value={mockValue}>
        <SWRProvider>{children}</SWRProvider>
      </AuthContext.Provider>
    );
  }

  // Real Auth0 wrapper (rendered on client only)
  return (
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      authorizationParams={{ redirect_uri: baseUrl, audience, scope: "openid profile email offline_access" }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <Auth0RealBridge>{children}</Auth0RealBridge>
    </Auth0Provider>
  );
}

const Auth0RealBridge = ({ children }: { children: React.ReactNode }) => {
    const realAuth0 = useAuth0Real();
    return (
        <AuthContext.Provider value={realAuth0}>
            <SWRProvider>{children}</SWRProvider>
        </AuthContext.Provider>
    );
}
