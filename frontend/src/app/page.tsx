'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';
import Button from '@/components/Button';
import styles from './page.module.css';

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className={styles.featureCard}>
    <span className={`material-symbols-outlined ${styles.featureIcon}`}>{icon}</span>
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
      <main className="flex items-center justify-center h-screen bg-primary-bg">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0A0A0B] font-bold text-2xl">query_stats</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-tx-primary">StatVision</h2>
          </div>
          <h1 className={styles.heroTitle}>Professional Basketball Analytics</h1>
          <p className={styles.heroSubtitle}>
            Transform game footage into elite data. High-precision event detection and advanced player insights.
          </p>
          <div className={styles.heroActions}>
            <Button size="lg" onClick={() => router.push('/login?screen_hint=signup')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Precision Intelligence</h2>
        <div className={styles.featuresGrid}>
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

      <footer className={styles.footer}>
        <p className="text-tx-dim text-xs">© {new Date().getFullYear()} StatVision AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
