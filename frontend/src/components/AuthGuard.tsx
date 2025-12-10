"use client";

import { useAuth0 } from '@auth0/auth0-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from './Loader';
import SideNav from './SideNav';
import BottomNav from './BottomNav';

const publicPaths = ['/', '/login']; // Root and login path are public

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
        return <Loader />;
    }

    // 2. If an authentication error exists and we are not on a public path, or if not authenticated and on a protected path,
    //    we are in the process of redirecting, so return null to prevent rendering protected content.
    if ((error || !isAuthenticated) && !isPublicPath) {
        return null;
    }

    // 3. If authenticated, render the full layout with navigation.
    // If unauthenticated but on the public path, render only the children (the unauthenticated home page).
    if (isAuthenticated) {
        return (
            <>
                <SideNav />
                <div className="main-content-wrapper">
                    {children}
                </div>
                <BottomNav />
            </>
        );
    }

    // 4. If unauthenticated AND on the public path ('/'), render only the children (the unauthenticated home page)
    return <>{children}</>;
};

export default AuthGuard;
