'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';
import styles from './page.module.css';

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className={styles.featureCard}>
    <md-icon className={styles.featureIcon}>{icon}</md-icon>
    <h3 className={styles.featureTitle}>{title}</h3>
    <p className={styles.featureDescription}>{description}</p>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth0();

  // If the user is authenticated, redirect them to the dashboard.
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);


  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to StatVision</h1>
          <p className={styles.heroSubtitle}>Your ultimate basketball analytics companion. Turn game footage into actionable insights with the power of AI.</p>
          <div className={styles.heroActions}>
            <md-filled-button onClick={() => router.push('/login?screen_hint=signup')}>
              Get Started for Free
            </md-filled-button>
            <md-outlined-button onClick={() => router.push('/login')}>
              Login
            </md-outlined-button>
          </div>
        </div>
      </header>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why You'll Love StatVision</h2>
        <div className={styles.featuresGrid}>
          <FeatureCard
            icon="smart_display"
            title="Automated Analysis"
            description="Our AI analyzes your game videos, identifying key plays, player stats, and team performance."
          />
          <FeatureCard
            icon="insights"
            title="Deep Insights"
            description="Go beyond the box score. Visualize player movements, shot charts, and team strategies."
          />
          <FeatureCard
            icon="groups"
            title="Team Collaboration"
            description="Share insights with your team, track player progress, and prepare for your next big game."
          />
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} StatVision. All rights reserved.</p>
      </footer>
    </main>
  );
}
