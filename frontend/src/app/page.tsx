'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div style={{
    background: 'var(--md-sys-color-surface-container-high)',
    border: '1px solid var(--md-sys-color-outline-variant)',
    borderRadius: '16px',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  }}>
    <md-icon style={{ fontSize: '40px', color: 'var(--md-sys-color-primary)' }}>{icon}</md-icon>
    <h3 style={{
      fontSize: '16px',
      fontWeight: 700,
      color: 'var(--md-sys-color-on-surface)',
      letterSpacing: '-0.01em',
    }}>{title}</h3>
    <p style={{
      fontSize: '13px',
      color: 'var(--md-sys-color-on-surface-variant)',
      lineHeight: 1.5,
    }}>{description}</p>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth0();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (!mounted) {
    return (
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--md-sys-color-surface)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
          borderTopColor: 'var(--md-sys-color-primary)',
          borderRadius: '50%',
        }} />
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--md-sys-color-surface)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <header style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          maxWidth: '640px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--md-sys-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <md-icon style={{ color: '#0A0A0B', fontSize: '24px', fontWeight: 700 }}>query_stats</md-icon>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--md-sys-color-on-surface)',
            }}>StatVision</h2>
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: 1.05,
          }}>Professional Basketball Analytics</h1>
          <p style={{
            fontSize: 'clamp(14px, 2vw, 16px)',
            color: 'var(--md-sys-color-on-surface-variant)',
            lineHeight: 1.6,
            maxWidth: '480px',
          }}>
            Transform game footage into elite data. High-precision event detection and advanced player insights.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <md-filled-button onClick={() => router.push('/login?screen_hint=signup')}>
              Get Started
            </md-filled-button>
            <md-outlined-button onClick={() => router.push('/login')}>
              Sign In
            </md-outlined-button>
          </div>
        </div>
      </header>

      <section style={{
        padding: '48px 24px 80px',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--md-sys-color-on-surface)',
          textAlign: 'center',
          marginBottom: '48px',
        }}>Precision Intelligence</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          <FeatureCard
            icon="biotech"
            title="Automated Event Detection"
            description="AI-powered tracking of shots, rebounds, and assists with professional accuracy."
          />
          <FeatureCard
            icon="analytics"
            title="Surgical Insights"
            description="Elite efficiency metrics including eFG%, TS%, and interactive court mapping."
          />
          <FeatureCard
            icon="history"
            title="Historical Tracking"
            description="Manage rosters and track player development across multiple seasons and games."
          />
        </div>
      </section>

      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
      }}>
        <p style={{
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: '12px',
          opacity: 0.7,
        }}>&copy; {new Date().getFullYear()} StatVision AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
