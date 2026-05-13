'use client';

import React, { createContext, useContext, useMemo } from 'react';
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

const AuthContext = createContext<AuthState | null>(null);

/**
 * Internal hook that returns the mock auth state.
 */
const useMockAuth = (router: any): AuthState => {
  return useMemo(() => ({
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
    getAccessTokenSilently: () => Promise.resolve("mock-token"),
  }), [router]);
};

/**
 * Component that bridges real Auth0 state to our unified AuthContext.
 */
const Auth0Bridge = ({ children }: { children: React.ReactNode }) => {
    const realAuth0 = useAuth0Real();
    return (
        <AuthContext.Provider value={realAuth0}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Component that bridges Mock state to our unified AuthContext.
 */
const MockBridge = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const mockAuth = useMockAuth(router);
    return (
        <AuthContext.Provider value={mockAuth}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth0 = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // During build/prerendering, we might not have a provider yet.
    // Return a dummy state instead of throwing to avoid breaking the build.
    return {
        isAuthenticated: false,
        isLoading: true,
        logout: () => {},
        loginWithRedirect: () => Promise.resolve(),
        getAccessTokenSilently: () => Promise.resolve(""),
    } as AuthState;
  }
  return context;
};

export default function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();

  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

  const onRedirectCallback = (appState?: AppState) => {
    router.push(appState?.returnTo || '/dashboard');
  };

  // If mock mode is forced OR if we are in a build environment without Auth0 config
  if (isMock || (!domain && typeof window === 'undefined')) {
    return (
      <MockBridge>
        <SWRProvider>
          {children}
        </SWRProvider>
      </MockBridge>
    );
  }

  if (!domain || !clientId || !baseUrl) {
    // Fallback to MockBridge if configuration is missing, to ensure children always have a context
    return (
        <MockBridge>
          <SWRProvider>
            {children}
          </SWRProvider>
        </MockBridge>
      );
  }

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
      <Auth0Bridge>
        <SWRProvider>
          {children}
        </SWRProvider>
      </Auth0Bridge>
    </Auth0Provider>
  );
}
