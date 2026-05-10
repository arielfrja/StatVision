'use client';

import React, { useEffect, createContext, useContext } from 'react';
import { Auth0Provider, AppState, useAuth0 as useAuth0Real } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import SWRProvider from './swr-provider';

// Define a common interface for the auth state
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: any;
  error?: Error;
  logout: (options?: any) => void;
  loginWithRedirect: (options?: any) => Promise<void>;
  getAccessTokenSilently: (options?: any) => Promise<string>;
}

const MockAuthContext = createContext<AuthState | null>(null);

export const useAuth0 = () => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true') {
    const context = useContext(MockAuthContext);
    if (!context) {
        // Fallback mock if context is not yet available
        return {
            isAuthenticated: true,
            isLoading: false,
            user: { sub: "test-user-123", email: "test@statvision.ai", name: "Test User" },
            logout: () => console.log("Mock Logout"),
            loginWithRedirect: () => Promise.resolve(),
            getAccessTokenSilently: () => Promise.resolve("mock-token"),
        } as AuthState;
    }
    return context;
  }
  return useAuth0Real();
};

export default function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

  if (isMock) {
    const mockValue: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { sub: "test-user-123", email: "test@statvision.ai", name: "Test User" },
        logout: (options?: any) => {
            console.log("Mock Logout", options);
            router.push('/');
        },
        loginWithRedirect: (options?: any) => {
            console.log("Mock Login Redirect", options);
            return Promise.resolve();
        },
        getAccessTokenSilently: (options?: any) => Promise.resolve("mock-token"),
    };

    return (
      <MockAuthContext.Provider value={mockValue}>
        <SWRProvider>
          {children}
        </SWRProvider>
      </MockAuthContext.Provider>
    );
  }

  if (!domain || !clientId || !baseUrl) {
    console.error('Auth0 environment variables are not set.');
    return <SWRProvider>{children}</SWRProvider>;
  }

  const onRedirectCallback = (appState?: AppState) => {
    router.push(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: baseUrl,
        audience: audience,
        scope: "openid profile email offline_access",
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <SWRProvider>
        {children}
      </SWRProvider>
    </Auth0Provider>
  );
}
