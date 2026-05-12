'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import { Game } from '@/types/game';

const StatsDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');
  const [timeframe, setTimeframe] = useState('Season');

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader size="large" label="Synchronizing Analytics" />
    </div>
  );

  const hasData = games && games.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-electric blur-[100px] opacity-10 rounded-full animate-pulse"></div>
            <span className="material-symbols-outlined text-8xl text-tx-dim relative z-10">analytics</span>
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">Elite Analytics Locked</h1>
        <p className="text-tx-secondary font-medium max-w-md mx-auto leading-relaxed mb-10 uppercase text-xs tracking-widest">
            Upload and analyze your first game recording to unlock the high-performance intelligence engine and spatial tracking.
        </p>
        <Link href="/games">
            <Button size="lg" icon="cloud_upload">Initialize First Stream</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-700">
      {/* Editorial Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-bd-ghost pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 uppercase">Performance Intelligence</h1>
          <p className="text-tx-secondary font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric shadow-[0_0_8px_var(--primary-electric)]" />
            Active Aggregation • {timeframe}
          </p>
        </div>
        <div className="flex bg-container-low p-1 rounded-xl border border-bd-ghost">
          {['Game', 'Season', 'All-Time'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`inline-flex items-center justify-center px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all min-w-[120px] active:scale-95 ${
                timeframe === t 
                  ? 'bg-container-highest text-electric shadow-lg border border-bd-active' 
                  : 'text-tx-dim hover:text-tx-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content: Box Scores Summary */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="stadium-card">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Aggregated Efficiency</h2>
                    <p className="text-[10px] text-tx-dim font-bold uppercase tracking-widest mt-1">Cross-Game Performance Distribution</p>
                </div>
            </div>
            
            <div className="py-20 text-center bg-container-low rounded-2xl border border-bd-ghost border-dashed">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-50">query_stats</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tx-dim">AI Aggregation in Progress</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-tx-dim mt-2 max-w-xs mx-auto">
                    Advanced distribution charts will unlock once 3+ games are fully analyzed.
                </p>
            </div>
          </section>
        </div>

        {/* Sidebar: System Readiness */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           <section className="stadium-card border-l-4 border-electric/30">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-tx-dim mb-6">Engine Readiness</h3>
                <div className="flex flex-col gap-6">
                    {[
                        { label: 'Spatial Engine', state: 'Active', color: 'text-electric' },
                        { label: 'Tactical Narrative', state: 'Aggregating', color: 'text-action' },
                        { label: 'Efficiency Pulse', state: 'Synced', color: 'text-green-400' },
                    ].map((engine, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase text-tx-secondary">{engine.label}</span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${engine.color}`}>{engine.state}</span>
                        </div>
                    ))}
                </div>
           </section>

           <section className="stadium-card frosted-glass border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-electric/10 blur-3xl -mr-16 -mt-16 group-hover:bg-electric/20 transition-all duration-700"></div>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-container-highest flex items-center justify-center text-electric border border-bd-ghost">
                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <div>
                        <h4 className="font-black italic tracking-tight uppercase text-white">AI Scout</h4>
                        <p className="text-[10px] font-bold text-tx-dim uppercase">Status: Vigilant</p>
                    </div>
                </div>
                <p className="text-xs text-tx-secondary leading-relaxed italic font-medium relative z-10">
                    "Analyzing {games.length} active records. I am looking for play patterns and defensive inconsistencies across your lineup."
                </p>
           </section>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboardPage;
