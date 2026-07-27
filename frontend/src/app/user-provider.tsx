'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Auth0Provider, useAuth0 as useAuth0Real } from '@auth0/auth0-react';
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
  // During prerendering or initial SSR, context might be null.
  // We return a safe default to prevent crashes.
  if (!context) {
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

  if (!domain || !clientId || !baseUrl) {
    throw new Error(
      'Missing Auth0 configuration. Set NEXT_PUBLIC_AUTH0_DOMAIN, ' +
      'NEXT_PUBLIC_AUTH0_CLIENT_ID, and NEXT_PUBLIC_BASE_URL ' +
      'environment variables.'
    );
  }

  // Real Auth0 — no mock paths
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
