'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

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
    <main className="min-h-screen bg-[var(--bg-stadium)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-electric/10 blur-[120px] rounded-full" />
        <div className="absolute -top-40 -right-40 w-96 h-96 border border-electric/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 border border-electric/5 rounded-full" />
      </div>

      <div className="z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-electric flex items-center justify-center shadow-[0_0_40px_var(--primary-glow)] mb-10 group animate-pulse">
          <span className="material-symbols-outlined text-4xl text-[#00373a] font-bold">query_stats</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase">STATVISION</h1>
        <p className="text-electric font-bold text-xs uppercase tracking-[0.4em] mb-12">Elite Basketball Intelligence</p>

        <div className="flex flex-col items-center gap-6">
          <Loader />
          <div className="space-y-1">
            <p className="text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-widest">
              {isAuthenticated ? 'Finalizing Sync' : 'Accessing Stadium Gates'}
            </p>
            <p className="text-[var(--text-dim)] font-medium text-[9px] uppercase tracking-widest animate-pulse italic">
              Preparing Player Vaults • AI Warmup
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-electric/30 to-transparent" />
    </main>
  );
}
