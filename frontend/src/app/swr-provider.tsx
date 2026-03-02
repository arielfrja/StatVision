'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import { useAuth0 } from '@auth0/auth0-react';
import apiClient from '@/utils/apiClient';

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  const { getAccessTokenSilently } = useAuth0();

  return (
    <SWRConfig
      value={{
        fetcher: async (url: string) => {
          const token = await getAccessTokenSilently();
          const response = await apiClient.get(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return response.data;
        },
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
