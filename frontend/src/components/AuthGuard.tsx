"use client";

import { useAuth0 } from '../app/user-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@material/web/progress/circular-progress.js';

const publicPaths = ['/', '/login'];

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, error } = useAuth0();
    const pathname = usePathname();
    const router = useRouter();

    const isPublicPath = publicPaths.includes(pathname);

    useEffect(() => {
        if (isLoading) return;
        if ((error || !isAuthenticated) && !isPublicPath) {
            console.log("AuthGuard: Redirecting to /login due to error or unauthenticated state.");
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, error, isPublicPath, router, pathname]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--md-sys-color-surface)',
            }}>
                <md-circular-progress indeterminate></md-circular-progress>
            </div>
        );
    }

    if ((error || !isAuthenticated) && !isPublicPath) {
        return null;
    }

    return <>{children}</>;
};

export default AuthGuard;
