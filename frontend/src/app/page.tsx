'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If the user is authenticated, redirect them to the dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (!mounted) {
    return (
      <main className={styles.main}>
        <div className="flex items-center justify-center h-screen bg-stadium">
          <div className="w-12 h-12 border-4 border-electric/20 border-t-electric rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to StatVision</h1>
          <p className={styles.heroSubtitle}>
            AI-powered basketball analytics. Transform your game footage into professional statistics instantly.
          </p>
          <div className={styles.heroActions}>
            <md-filled-button onClick={() => router.push('/login?screen_hint=signup')}>
              Get Started for Free
            </md-filled-button>
            <md-outlined-button onClick={() => router.push('/login')}>
              Sign In
            </md-outlined-button>
          </div>
        </div>
      </header>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why StatVision?</h2>
        <div className={styles.featuresGrid}>
          <FeatureCard 
            icon="smart_display"
            title="Automated Stat Tracking"
            description="Our AI analyzes every play, detecting shots, rebounds, assists, and more with pinpoint accuracy."
          />
          <FeatureCard 
            icon="insights"
            title="Deep Insights"
            description="Go beyond basic box scores with advanced performance metrics and player efficiency ratings."
          />
          <FeatureCard 
            icon="groups"
            title="Team Collaboration"
            description="Share insights with your entire roster and coaching staff to prepare for your next big game."
          />
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} StatVision. All rights reserved.</p>
      </footer>
    </main>
  );
}
