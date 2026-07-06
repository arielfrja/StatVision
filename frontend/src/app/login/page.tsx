'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import { useRouter } from 'next/navigation';
import '@material/web/progress/circular-progress.js';
import '@material/web/icon/icon.js';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    loginWithRedirect();
  }, [isLoading, isAuthenticated, loginWithRedirect, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Atmosphere */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            background: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)',
            filter: 'blur(120px)',
            borderRadius: '9999px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-160px',
            width: '384px',
            height: '384px',
            border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)',
            borderRadius: '9999px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-160px',
            left: '-160px',
            width: '384px',
            height: '384px',
            border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)',
            borderRadius: '9999px',
          }}
        />
      </div>

      <div
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            background: 'var(--md-sys-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <md-icon style={{ fontSize: '2.25rem', color: '#00373a', fontWeight: 700 }}>
            query_stats
          </md-icon>
        </div>

        <h1
          style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.05em',
            marginBottom: '16px',
            textTransform: 'uppercase',
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          STATVISION
        </h1>
        <p
          style={{
            color: 'var(--md-sys-color-primary)',
            fontWeight: 700,
            fontSize: '0.75rem',
            lineHeight: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            marginBottom: '48px',
          }}
        >
          Elite Basketball Intelligence
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <md-circular-progress indeterminate></md-circular-progress>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <p
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 700,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {isAuthenticated ? 'Finalizing Sync' : 'Accessing Stadium Gates'}
            </p>
            <p
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 500,
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontStyle: 'italic',
                opacity: 0.7,
              }}
            >
              Preparing Player Vaults &#x2022; AI Warmup
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background:
            'linear-gradient(to right, transparent, color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent), transparent)',
        }}
      />
    </main>
  );
}
