"use client";

import { useAuth0 } from '../app/user-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';

const publicPaths = ['/', '/login'];
const RETURN_TO_KEY = 'statvision_return_to';

function getFullPath(pathname: string): string {
  if (typeof window === 'undefined') return pathname;
  return pathname + window.location.search;
}

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();
    const pathname = usePathname();
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const isPublicPath = publicPaths.includes(pathname);

    // Preserve deep link (e.g. F5 on /games/:id) via appState.returnTo +
    // localStorage fallback, then start Auth0 login. Restored in
    // user-provider onRedirectCallback + the restore effect below.
    useEffect(() => {
        if (isLoading) return;
        if (isPublicPath) return;
        if (error || !isAuthenticated) {
            const fullPath = getFullPath(pathname);
            try {
              window.localStorage.setItem(RETURN_TO_KEY, fullPath);
            } catch {
              /* ignore */
            }
            setRedirecting(true);
            console.log("AuthGuard: unauthenticated, preserving returnTo:", fullPath);
            loginWithRedirect({ appState: { returnTo: fullPath } }).catch(() => {
              router.push('/login');
            });
        }
    }, [isAuthenticated, isLoading, error, isPublicPath, router, pathname, loginWithRedirect, retryCount]);

    // Restore saved returnTo after Auth0 callback lands on base URL.
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;
        try {
          const saved = window.localStorage.getItem(RETURN_TO_KEY);
          if (saved && saved.startsWith('/') && saved !== getFullPath(pathname)) {
            window.localStorage.removeItem(RETURN_TO_KEY);
            router.replace(saved);
          } else if (saved) {
            window.localStorage.removeItem(RETURN_TO_KEY);
          }
        } catch {
          /* ignore */
        }
    }, [isLoading, isAuthenticated, pathname, router]);

    if (isLoading || redirecting) {
        // Loading skeleton matching app shell (280px sidenav + header + cards)
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--md-sys-color-surface)' }}>
                <div className="md-side-nav" style={{ width: '280px', flexShrink: 0, padding: '16px 12px', borderRight: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <div className="skeleton-pulse" style={{ height: '32px', borderRadius: '8px', marginBottom: '16px' }} />
                  {[0,1,2,3].map(i => (
                    <div key={i} className="skeleton-pulse" style={{ height: '40px', borderRadius: '8px', marginBottom: '8px' }} />
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="skeleton-pulse" style={{ height: '56px', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }} />
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                    <div className="skeleton-pulse" style={{ height: '28px', width: '40%', borderRadius: '6px' }} />
                    <div className="skeleton-pulse" style={{ height: '120px', borderRadius: '12px' }} />
                    <div className="skeleton-pulse" style={{ height: '120px', borderRadius: '12px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <md-circular-progress indeterminate></md-circular-progress>
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {redirecting ? 'Redirecting to sign-in…' : 'Restoring session…'}
                      </span>
                    </div>
                  </div>
                </div>
                <style>{`
                  .skeleton-pulse { background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 80%, transparent); animation: skeleton-pulse 1.5s ease-in-out infinite; }
                  @keyframes skeleton-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    if (error && !isPublicPath) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'var(--md-sys-color-surface)' }}>
              <div style={{ maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Session check failed</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {(error as Error)?.message || 'Could not verify authentication. Please retry.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <md-filled-button onClick={() => { setRetryCount(c => c + 1); window.location.reload(); }}>
                    Retry
                  </md-filled-button>
                  <md-outlined-button onClick={() => loginWithRedirect({ appState: { returnTo: getFullPath(pathname) } })}>
                    Sign in again
                  </md-outlined-button>
                </div>
              </div>
            </div>
        );
    }

    if ((!isAuthenticated) && !isPublicPath) {
        return null;
    }

    return <>{children}</>;
};

export default AuthGuard;
