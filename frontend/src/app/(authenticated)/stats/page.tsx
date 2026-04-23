'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Loader from '@/components/Loader';

const StatsDashboardPage = () => {
  const [selectedPlayer, setSelectedPlayer] = useState('Global');
  const [timeframe, setTimeframe] = useState('Season');

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Editorial Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-ghost)] pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 uppercase">Elite Analytics</h1>
          <p className="text-[var(--text-secondary)] font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric" />
            Performance Intelligence • {timeframe}
          </p>
        </div>
        <div className="flex gap-2">
          {['Game', 'Season', 'All-Time'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                timeframe === t 
                  ? 'bg-electric text-[#00373a] shadow-[0_0_15px_var(--primary-glow)]' 
                  : 'bg-[var(--bg-container-low)] text-[var(--text-dim)] hover:text-white'
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
                <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest mt-1">Spatial Efficiency Tracking</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-[var(--secondary-action)]" />
                  High Volume
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--text-dim)]">
                  <span className="w-2 h-2 rounded-full bg-electric opacity-40" />
                  Efficiency
                </div>
              </div>
            </div>

            <div className="aspect-[16/9] bg-[var(--bg-container-low)] rounded-xl border border-[var(--border-ghost)] relative flex items-center justify-center p-8 overflow-hidden">
              {/* Virtual Court SVG Illustration */}
              <div className="w-full h-full border-2 border-white/5 rounded-t-[100px] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 border-2 border-white/5 rounded-full -mt-24" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-48 border-2 border-white/5" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 rounded-full" />
              </div>

              {/* Heatmap Blobs */}
              <div className="absolute w-24 h-24 rounded-full bg-[var(--secondary-action)] blur-3xl opacity-30 top-1/3 left-1/4 animate-pulse" />
              <div className="absolute w-32 h-32 rounded-full bg-[var(--secondary-action)] blur-3xl opacity-20 top-1/4 right-1/3" />
              <div className="absolute w-20 h-20 rounded-full bg-electric blur-2xl opacity-20 bottom-1/4 left-1/2" />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">3D Court Rendering</span>
              </div>
            </div>
          </section>

          {/* Player Archetypes Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="stadium-card">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-[var(--text-dim)]">Offensive Archetype</h3>
              <div className="flex items-center justify-center py-4">
                {/* Radar Chart Placeholder */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 border border-white/5 rotate-45" />
                  <div className="absolute inset-4 border border-white/5 rotate-45" />
                  <div className="absolute inset-8 border border-white/5 rotate-45" />
                  <svg className="w-full h-full drop-shadow-[0_0_10px_var(--primary-glow)]">
                    <polygon points="96,20 160,60 140,140 40,130 30,60" fill="var(--primary-glow)" stroke="var(--primary-electric)" strokeWidth="2" />
                  </svg>
                  <span className="absolute -top-4 text-[10px] font-black uppercase text-electric">Shooting</span>
                  <span className="absolute -bottom-4 text-[10px] font-black uppercase">Playmaking</span>
                  <span className="absolute -left-10 text-[10px] font-black uppercase">Driving</span>
                  <span className="absolute -right-10 text-[10px] font-black uppercase">Spacing</span>
                </div>
              </div>
              <div className="mt-8 text-center">
                <span className="px-4 py-1 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded-full text-[10px] font-black uppercase tracking-tighter">Elite Sniper</span>
              </div>
            </div>

            <div className="stadium-card bg-gradient-to-br from-[var(--bg-container)] to-[var(--bg-container-low)]">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-electric italic">Story of the Run</h3>
              <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed mb-6">
                Team efficiency spiked during the 3rd quarter. High-post sets generated <span className="text-electric font-bold">1.45 Points Per Possession</span>. Defensive rotations were 12% faster than season average.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-[var(--text-dim)]">Clutch Rating</span>
                  <span className="text-[var(--accent-gold)]">94.2</span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-container-low)] rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-[var(--accent-gold)]" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Precise Stats Pulse */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          <section className="stadium-card border-l-4 border-electric">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-dim)] mb-8">Efficiency Pulse</h3>
            
            <div className="flex flex-col gap-10">
              {[
                { label: 'Effective FG%', value: '58.4%', trend: '+2.1%', color: 'var(--primary-electric)' },
                { label: 'True Shooting%', value: '64.2%', trend: '-0.4%', color: 'var(--accent-gold)' },
                { label: 'Assist/TO Ratio', value: '2.8', trend: '+0.5', color: 'var(--primary-electric)' },
                { label: 'Usage Rate', value: '24.1%', trend: 'Stable', color: 'var(--text-dim)' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[var(--text-dim)] tracking-widest mb-1">{stat.label}</p>
                      <p className="text-3xl font-black italic tracking-tighter mono-stat">{stat.value}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase ${stat.trend.includes('+') ? 'text-green-400' : stat.trend.includes('-') ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-[var(--bg-container-low)] rounded-full overflow-hidden">
                    <div className="h-full bg-current transition-all duration-1000 group-hover:opacity-100 opacity-60" style={{ width: stat.value, color: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="stadium-card frosted-glass border-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric to-[#0052FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <h4 className="font-black italic tracking-tight uppercase">AI Scout Insight</h4>
                <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Real-time Tactical Data</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic font-medium">
              "Player identified as high-volume spot-up threat. Defenses are sagging off the corner—recommend increased corner-fill action to exploit spacing."
            </p>
          </section>

        </div>
      </div>
    </main>
  );
};

export default StatsDashboardPage;
