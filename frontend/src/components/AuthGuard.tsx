"use client";

import { useAuth0 } from '../app/user-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from './Loader';

const publicPaths = ['/', '/login']; // Only the new landing page and login are public

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, error } = useAuth0();
    const pathname = usePathname();
    const router = useRouter();

    const isPublicPath = publicPaths.includes(pathname);

    useEffect(() => {
        if (isLoading) return;

        // If there's an authentication error or not authenticated and on a protected path, redirect to login page
        if ((error || !isAuthenticated) && !isPublicPath) {
            console.log("AuthGuard: Redirecting to /login due to error or unauthenticated state.");
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, error, isPublicPath, router, pathname]);

    // 1. Show Loader while loading Auth0 state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-stadium">
                <Loader />
            </div>
        );
    }

    // 2. If an authentication error exists and we are not on a public path, or if not authenticated and on a protected path,
    //    we are in the process of redirecting, so return null to prevent rendering protected content.
    if ((error || !isAuthenticated) && !isPublicPath) {
        return null;
    }

    // 3. Just return children. The layout should be handled by the layout.tsx files.
    return <>{children}</>;
};

export default AuthGuard;
