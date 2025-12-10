'use client';

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation'; // Import useRouter
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';
import Loader from '@/components/Loader';
import Link from 'next/link';

const DashboardCard = ({ href, icon, title, description }: { href: string, icon: string, title: string, description: string }) => (
  <Link href={href} passHref legacyBehavior>
    <div style={{
      padding: 'var(--spacing-lg)',
      borderRadius: 'var(--spacing-md)',
      backgroundColor: 'var(--md-sys-color-surface-container-low)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      textDecoration: 'none',
      color: 'var(--md-sys-color-on-surface)',
    }}
    // @ts-ignore
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    // @ts-ignore
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <md-icon style={{
        fontSize: '48px',
        width: '48px',
        height: '48px',
        color: 'var(--md-sys-color-primary)',
        marginBottom: 'var(--spacing-md)'
      }}>{icon}</md-icon>
      <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-size)', marginBottom: 'var(--spacing-sm)' }}>{title}</h2>
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{description}</p>
    </div>
  </Link>
);

export default function Home() {
  const { user, isAuthenticated, isLoading, error } = useAuth0();
  const router = useRouter(); // Initialize useRouter

  if (isLoading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 'var(--spacing-md)', color: 'var(--md-sys-color-error)' }}>
        <h1 style={{ color: 'var(--md-sys-color-on-surface)' }}>Authentication Error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-variant)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <h1 style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--spacing-md)' }}>Welcome to StatVision</h1>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--spacing-lg)' }}>Please log in or sign up to continue.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
            <md-filled-button onClick={() => router.push('/login')}>
              Login
            </md-filled-button>
            <md-outlined-button onClick={() => router.push('/login?screen_hint=signup')}>
              Sign Up
            </md-outlined-button>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated Dashboard View
  return (

    <main style={{ padding: 'var(--spacing-md)', maxWidth: '1200px', margin: 'auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface)' }}>
        Welcome back, {user?.name || user?.email || 'Analyst'}!
      </h1>
      <p style={{ marginBottom: 'var(--spacing-xl)', color: 'var(--md-sys-color-on-surface-variant)' }}>
        Your central hub for managing teams, analyzing games, and tracking progress.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <DashboardCard 
          href="/games" 
          icon="sports_basketball" 
          title="Game Analysis" 
          description="View all analyzed games and start new video processing sessions." 
        />
        <DashboardCard 
          href="/teams" 
          icon="group" 
          title="Team Management" 
          description="Create, edit, and manage your team rosters and player details." 
        />
        <DashboardCard 
          href="/settings" 
          icon="settings" 
          title="Settings" 
          description="Manage account preferences and application settings." 
        />
      </div>
    </main>
  );
}