'use client';

import React, { useEffect } from 'react';
import { Auth0Provider, AppState } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export default function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;


  useEffect(() => {
    // This empty useEffect ensures these imports are client-side only.
  }, []);


  if (!domain || !clientId || !baseUrl) {
    console.error('Auth0 environment variables are not set.');
    return <>{children}</>;
  }

  const onRedirectCallback = (appState?: AppState) => {
    console.log("UserProviderWrapper: onRedirectCallback triggered.");
    console.log("UserProviderWrapper: appState:", appState);
    console.log("UserProviderWrapper: window.location.pathname:", window.location.pathname);
    router.push(appState?.returnTo || window.location.pathname);
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
      {children}
    </Auth0Provider>
  );
}