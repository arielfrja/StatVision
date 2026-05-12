/* eslint-disable */
'use client';

import React, { createContext, useContext } from 'react';
import SWRProvider from './swr-provider';

const MockAuth0Context = createContext<any>(null);

export const useAuth0 = () => {
    // If we are in mock mode, we want components to use THIS hook instead of the real one.
    // This is tricky because we can't easily override the library's export.
    // For testing purposes, we'll keep it simple.
    return {
        isAuthenticated: true,
        isLoading: false,
        user: {
            sub: "test-user-123",
            email: "test@statvision.ai",
            name: "Test User"
        },
        logout: () => console.log("Mock Logout"),
        loginWithRedirect: () => console.log("Mock Login Redirect"),
        getAccessTokenSilently: () => Promise.resolve("mock-token"),
    };
};

export default function MockUserProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
        {children}
    </SWRProvider>
  );
}
