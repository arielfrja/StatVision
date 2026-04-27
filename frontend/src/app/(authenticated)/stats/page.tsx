'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import { Game } from '@/types/game';

const StatsDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');
  const [timeframe, setTimeframe] = useState('Season');

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  const hasData = games && games.length > 0;

  return (
    <div className="pb-16">
      {/* Editorial Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-bd-ghost pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 uppercase">Elite Analytics</h1>
          <p className="text-tx-secondary font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-electric' : 'bg-tx-dim'}`} />
            Performance Intelligence • {timeframe}
          </p>
        </div>
        <div className="flex gap-2">
          {['Game', 'Season', 'All-Time'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`inline-flex items-center justify-center px-10 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-w-[120px] ${
                timeframe === t 
                  ? 'bg-electric text-[#00373a] shadow-[0_0_15px_var(--primary-glow)] border border-white/20' 
                  : 'bg-container-low text-tx-dim hover:text-white border border-bd-ghost'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Heatmaps & Radar */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Virtual Court Shot Map */}
          <section className="stadium-card group overflow-hidden relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight">Shot Density Map</h2>
                <p className="text-[10px] text-tx-dim font-bold uppercase tracking-widest mt-1">Spatial Efficiency Tracking</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-action" />
                  High Volume
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-tx-dim">
                  <span className="w-2 h-2 rounded-full bg-electric opacity-40" />
                  Efficiency
                </div>
              </div>
            </div>

            <div className="aspect-[16/9] bg-container-low rounded-xl border border-bd-ghost relative flex items-center justify-center p-8 overflow-hidden">
              {/* Virtual Court SVG Illustration */}
              <div className="w-full h-full border-2 border-white/5 rounded-t-[100px] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 border-2 border-white/5 rounded-full -mt-24" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-48 border-2 border-white/5" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 rounded-full" />
              </div>

              {hasData ? (
                <>
                  <div className="absolute w-24 h-24 rounded-full bg-action/10 blur-3xl top-1/3 left-1/4 animate-pulse" />
                  <div className="absolute w-20 h-20 rounded-full bg-electric/10 blur-2xl bottom-1/4 left-1/2" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">No Spatial Data Available</span>
                </div>
              )}
            </div>
          </section>

          {/* Player Archetypes Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="stadium-card">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-tx-dim">Offensive Archetype</h3>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-48 h-48 flex items-center justify-center opacity-20">
                  <div className="absolute inset-0 border border-white/5 rotate-45" />
                  <div className="absolute inset-4 border border-white/5 rotate-45" />
                  <div className="absolute inset-8 border border-white/5 rotate-45" />
                  <span className="absolute -top-4 text-[10px] font-black uppercase text-tx-dim">Shooting</span>
                  <span className="absolute -bottom-4 text-[10px] font-black uppercase text-tx-dim">Playmaking</span>
                  <span className="absolute -left-10 text-[10px] font-black uppercase text-tx-dim">Driving</span>
                  <span className="absolute -right-10 text-[10px] font-black uppercase text-tx-dim">Spacing</span>
                </div>
              </div>
              <div className="mt-8 text-center">
                <span className="px-4 py-1 bg-container-high text-tx-dim border border-bd-ghost rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {hasData ? 'Analyzing Archetype...' : 'Data Required'}
                </span>
              </div>
            </div>

            <div className="stadium-card bg-gradient-to-br from-container to-container-low">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-electric italic">Story of the Run</h3>
              <p className="text-sm text-tx-primary font-medium leading-relaxed mb-6">
                {hasData 
                  ? "AI is currently aggregating game data to generate performance narratives and tactical trends."
                  : "Upload and analyze your first game to generate AI-driven narrative insights and performance storytelling."
                }
              </p>
              <div className="flex flex-col gap-3 opacity-20">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-tx-dim">Aggregate Rating</span>
                  <span className="text-gold">--</span>
                </div>
                <div className="h-1 w-full bg-container-low rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-gold" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Precise Stats Pulse */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          <section className="stadium-card border-l-4 border-electric">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-tx-dim mb-8">Efficiency Pulse</h3>
            
            <div className="flex flex-col gap-10">
              {[
                { label: 'Effective FG%', value: '0.0%', color: 'var(--primary-electric)' },
                { label: 'True Shooting%', value: '0.0%', color: 'var(--accent-gold)' },
                { label: 'Assist/TO Ratio', value: '0.0', color: 'var(--primary-electric)' },
                { label: 'Usage Rate', value: '0.0%', color: 'var(--text-dim)' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-tx-dim tracking-widest mb-1">{stat.label}</p>
                      <p className="text-3xl font-black italic tracking-tighter mono-stat">{stat.value}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-tx-dim">
                        Pending
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-current opacity-20" style={{ width: '5%', color: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="stadium-card frosted-glass border-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric to-action/50 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <h4 className="font-black italic tracking-tight uppercase">AI Scout Insight</h4>
                <p className="text-[10px] font-bold text-tx-dim uppercase">Intelligence Active</p>
              </div>
            </div>
            <p className="text-xs text-tx-secondary leading-relaxed italic font-medium">
              {hasData
                ? "Aggregating game data for tactical insights. AI scouts are identifying play patterns and defensive weaknesses."
                : "No tactical data available. Analyze game footage to enable AI defensive coverage and offensive spacing reports."
              }
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default StatsDashboardPage;
