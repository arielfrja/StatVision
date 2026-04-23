'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Game } from '@/types/game';
import Loader from '@/components/Loader';

const CommandCenterPage = () => {
  const { data: games, error, isLoading } = useSWR<Game[]>('/games');
  const [activeTab, setActiveTab] = useState('live');

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-widest mb-1">Status: Active Analysis</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">COMMAND CENTER</h1>
        </div>
        <div className="flex bg-[var(--bg-container-low)] p-1 rounded-xl border border-[var(--border-ghost)]">
          {['live', 'timeline', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? 'bg-[var(--bg-container-highest)] text-electric shadow-sm' 
                  : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed: Video & Live Intelligence */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* AI Brain Peek (Processing Indicators) */}
          <section className="stadium-card flex flex-wrap items-center gap-8 py-4 px-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3 min-w-fit">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="18" stroke="var(--bg-container-highest)" strokeWidth="3" fill="none" />
                  <circle cx="20" cy="20" r="18" stroke="var(--primary-electric)" strokeWidth="3" fill="none" strokeDasharray="113" strokeDashoffset="20" className="transition-all duration-1000" />
                </svg>
                <span className="absolute text-[10px] font-bold">85%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Chunk 412</span>
                <span className="text-xs font-bold">Processing</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 min-w-fit">
              <div className="relative w-10 h-10 flex items-center justify-center text-electric">
                <span className="material-symbols-outlined animate-spin">sync</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Parallel B</span>
                <span className="text-xs font-bold">Object Detection</span>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-fit border-l border-[var(--border-ghost)] pl-8 ml-auto">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Avg Latency</span>
                <span className="text-xs font-bold mono-stat text-electric">142ms</span>
              </div>
            </div>
          </section>

          {/* Video Player Placeholder */}
          <section className="stadium-card p-0 overflow-hidden aspect-video relative group border border-[var(--border-ghost)]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-full h-full bg-[var(--bg-container-lowest)] flex items-center justify-center">
               <span className="material-symbols-outlined text-6xl text-[var(--bg-container-highest)]">play_circle</span>
            </div>
            
            {/* Custom Scrubbable Timeline */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                <div className="h-full w-1/3 bg-electric relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_var(--primary-electric)]" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-bold mono-stat uppercase">
                <span>04:20 / 12:00</span>
                <span className="text-electric">1Q - LIVE FEED</span>
              </div>
            </div>
          </section>

          {/* Live Event Stream */}
          <section>
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
              Intelligence Stream
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { type: '3PT Made', player: '#23 Blue', time: '04:12', color: 'var(--secondary-action)' },
                { type: 'Steal', player: '#02 Red', time: '04:05', color: 'var(--primary-electric)' },
                { type: 'Defensive Rebound', player: '#15 Blue', time: '03:58', color: 'var(--primary-electric)' },
              ].map((event, i) => (
                <div key={i} className="frosted-glass rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-[var(--bg-container-high)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-container-low)] flex items-center justify-center text-xl" style={{ color: event.color }}>
                      <span className="material-symbols-outlined">
                        {event.type.includes('3PT') ? 'sports_basketball' : event.type.includes('Steal') ? 'pan_tool' : 'history'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase">{event.type}</h4>
                      <p className="text-xs text-[var(--text-dim)] font-semibold">{event.player}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs mono-stat font-bold">{event.time}</p>
                    <button className="text-[10px] font-bold uppercase text-electric opacity-0 group-hover:opacity-100 transition-opacity">Verify</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: Tactical Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="stadium-card">
            <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest mb-6">Shot Map (1Q)</h3>
            <div className="aspect-[4/5] bg-[var(--bg-container-low)] rounded-lg border border-[var(--border-ghost)] relative p-4 flex items-center justify-center">
              {/* Virtual Court SVG */}
              <div className="w-full h-full border-2 border-[var(--bg-container-highest)] rounded-t-full opacity-20" />
              <div className="absolute w-20 h-20 rounded-full bg-[var(--secondary-action)] blur-2xl opacity-20 top-1/4 left-1/4" />
              <div className="absolute w-16 h-16 rounded-full bg-electric blur-2xl opacity-10 bottom-1/3 right-1/3" />
              <p className="absolute text-[10px] font-bold uppercase text-[var(--text-dim)]">Live Heatmap Rendering</p>
            </div>
          </section>

          <section className="stadium-card">
            <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest mb-6">Efficiency Pulse</h3>
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span>Effective FG%</span>
                  <span className="text-electric">54.2%</span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-container-low)] rounded-full overflow-hidden">
                  <div className="h-full w-[54%] bg-electric" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span>True Shooting%</span>
                  <span className="text-[var(--accent-gold)]">61.8%</span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-container-low)] rounded-full overflow-hidden">
                  <div className="h-full w-[61%] bg-[var(--accent-gold)]" />
                </div>
              </div>
            </div>
          </section>

          <section className="stadium-card bg-gradient-to-br from-[var(--bg-container)] to-[var(--bg-container-low)]">
            <h3 className="text-xs font-bold text-electric uppercase tracking-widest mb-4 italic">Coach's Brief</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "AI identifies high-efficiency transition play in the last 2 minutes. Recommend increasing tempo if #23 Blue remains on court."
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CommandCenterPage;
