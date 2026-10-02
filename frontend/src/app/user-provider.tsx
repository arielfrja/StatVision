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

  // Real Auth0 — no mock paths.
  // - useRefreshTokens + localstorage persists session across F5 (no re-login).
  // - offline_access scope (above) enables refresh tokens.
  // - onRedirectCallback restores appState.returnTo saved by AuthGuard/login,
  //   so F5 on /games/:id or deep links survive the Auth0 round-trip.
  return (
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      authorizationParams={{ redirect_uri: baseUrl, audience, scope: "openid profile email offline_access" }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState: any) => {
        const to = appState?.returnTo;
        if (typeof window !== 'undefined') {
          try {
            const saved = window.localStorage.getItem('statvision_return_to');
            const target = to || saved;
            window.localStorage.removeItem('statvision_return_to');
            if (target && typeof target === 'string' && target.startsWith('/') && target !== window.location.pathname) {
              window.location.replace(target);
              return;
            }
          } catch {
            /* ignore storage errors */
          }
          if (to && typeof to === 'string' && to.startsWith('/')) {
            window.location.replace(to);
          }
        }
      }}
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
