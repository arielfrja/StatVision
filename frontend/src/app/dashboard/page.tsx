'use client';

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';
import Loader from '@/components/Loader';
import Link from 'next/link';
import styles from './dashboard.module.css';

const DashboardCard = ({ href, icon, title, description }: { href: string, icon: string, title: string, description: string }) => (
  <Link href={href} passHref legacyBehavior>
    <div className={styles.card}>
      <md-icon className={styles.cardIcon}>{icon}</md-icon>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardDescription}>{description}</p>
    </div>
  </Link>
);

export default function Home() {
  const { user, isAuthenticated, isLoading, error } = useAuth0();
  const router = useRouter(); // Initialize useRouter

  if (isLoading) {
    return (
      <main className={styles.main}>
        <Loader />
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <h1 className={styles.header}>Authentication Error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  // This check should technically be handled by AuthGuard, but it's good practice to have a fallback.
  if (!isAuthenticated) {
    // router.push('/login'); // Redirect to login
    return (
      <main className={styles.main}>
        <h1 className={styles.header}>Redirecting to login...</h1>
        <Loader />
      </main>
    );
  }

  // Authenticated Dashboard View
  return (
    <main className={styles.main}>
      <h1 className={styles.header}>
        Welcome back, {user?.name || user?.email || 'Analyst'}!
      </h1>
      <p className={styles.subHeader}>
        Your central hub for managing teams, analyzing games, and tracking progress.
      </p>

      <div className={styles.grid}>
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
