"use client";

import { useAuth0 } from '@auth0/auth0-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from './Loader';
import SideNav from './SideNav';
import BottomNav from './BottomNav';

const publicPaths = ['/']; // Only the root path is public

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth0();
    const pathname = usePathname();
    const router = useRouter();

    const isPublicPath = publicPaths.includes(pathname);
    const shouldRedirect = !isAuthenticated && !isPublicPath;

    useEffect(() => {
        if (isLoading) return;

        if (shouldRedirect) {
            router.replace('/');
        }
    }, [isAuthenticated, isLoading, router, shouldRedirect]);

    // 1. Show Loader while loading Auth0 state
    if (isLoading) {
        return <Loader />;
    }

    // 2. If a redirect is pending, return null to prevent rendering protected content
    if (shouldRedirect) {
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
