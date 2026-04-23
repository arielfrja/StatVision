'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Loader from '@/components/Loader';

const PlayerProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('highlights');

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Player Hero Section */}
      <header className="relative mb-12 stadium-card overflow-hidden py-12 px-8 flex flex-col md:flex-row items-center gap-10">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]">person</span>
        </div>

        <div className="relative group">
          <div className="w-40 h-40 rounded-full bg-[var(--bg-container-low)] border-4 border-electric/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_var(--primary-glow)]">
            <span className="material-symbols-outlined text-7xl text-[var(--text-dim)]">person</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-[var(--accent-gold)] flex items-center justify-center text-[#00373a] shadow-lg border-4 border-[var(--bg-container)]">
            <span className="material-symbols-outlined font-black">grade</span>
          </div>
        </div>

        <div className="text-center md:text-left flex-1">
          <button onClick={() => router.back()} className="text-electric font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 group mx-auto md:mx-0">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Team
          </button>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Marcus Smart</h1>
            <span className="text-2xl font-black italic text-electric/40">#36</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-electric/10 text-electric border border-electric/30 rounded-full text-[10px] font-black uppercase tracking-widest">Elite Defender</span>
            <span className="px-4 py-1.5 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded-full text-[10px] font-black uppercase tracking-widest">Floor General</span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-4 border-l border-[var(--border-ghost)] pl-10 hidden md:flex">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-1">Season Average</p>
            <p className="text-3xl font-black italic tracking-tighter text-white mono-stat">22.4 <span className="text-xs">PPG</span></p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-1">Win Rate</p>
            <p className="text-3xl font-black italic tracking-tighter text-white mono-stat">74%</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Content Area */}
        <div className="lg:col-span-8">
          <div className="flex gap-8 border-b border-[var(--border-ghost)] mb-8">
            {['highlights', 'game log', 'evolution'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-electric' : 'text-[var(--text-dim)] hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-electric shadow-[0_0_10px_var(--primary-glow)]" />}
              </button>
            ))}
          </div>

          {activeTab === 'highlights' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">The Mixtape</h2>
                <span className="text-[10px] font-bold text-electric uppercase cursor-pointer hover:underline">View All Clips</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Step-back 3PT', game: 'vs Red Team', time: '1Q 04:12', thumb: 'play_circle' },
                  { title: 'Clutch Block', game: 'vs Blue Squad', time: '4Q 00:08', thumb: 'block' },
                ].map((clip, i) => (
                  <div key={i} className="stadium-card p-0 group overflow-hidden border border-[var(--border-ghost)] hover:border-electric/30">
                    <div className="aspect-video bg-[var(--bg-container-low)] flex items-center justify-center relative">
                      <span className="material-symbols-outlined text-4xl text-[var(--text-dim)] group-hover:text-electric transition-colors group-hover:scale-110 duration-300">{clip.thumb}</span>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[8px] font-black uppercase tracking-widest text-white">0:15</div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-gradient-to-br from-[var(--bg-container)] to-[var(--bg-container-low)]">
                      <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight">{clip.title}</h4>
                        <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{clip.game} • {clip.time}</p>
                      </div>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-electric hover:bg-electric/10">
                        <span className="material-symbols-outlined text-xl">share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'game log' && (
            <div className="flex flex-col gap-3">
              {[
                { game: 'VS BULLS', date: 'Mar 22', pts: '28', ast: '8', res: 'W' },
                { game: 'VS LAKERS', date: 'Mar 18', pts: '14', ast: '12', res: 'L' },
                { game: 'VS CELTICS', date: 'Mar 15', pts: '22', ast: '5', res: 'W' },
              ].map((g, i) => (
                <div key={i} className="stadium-card py-4 flex items-center justify-between border border-[var(--border-ghost)] hover:border-white/10 group">
                  <div className="flex items-center gap-6">
                    <span className={`w-1 h-10 rounded-full ${g.res === 'W' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <h4 className="text-sm font-black italic uppercase">{g.game}</h4>
                      <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{g.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-10 text-right">
                    <div>
                      <p className="text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">PTS</p>
                      <p className="text-lg font-black italic mono-stat">{g.pts}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">AST</p>
                      <p className="text-lg font-black italic mono-stat">{g.ast}</p>
                    </div>
                    <div className="w-10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--text-dim)] group-hover:text-electric transition-colors">analytics</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Skill Matrix Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="stadium-card">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-dim)] mb-8">Skill Matrix</h3>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border border-white/5 rotate-45" />
                <div className="absolute inset-4 border border-white/5 rotate-45" />
                <svg className="w-full h-full">
                  <polygon points="96,20 160,80 120,160 40,140 20,60" fill="var(--primary-glow)" stroke="var(--primary-electric)" strokeWidth="2" />
                </svg>
                <span className="absolute -top-4 text-[10px] font-black uppercase text-electric">Shooting</span>
                <span className="absolute -bottom-4 text-[10px] font-black uppercase">Clutch</span>
                <span className="absolute -left-10 text-[10px] font-black uppercase">IQ</span>
                <span className="absolute -right-10 text-[10px] font-black uppercase">D</span>
              </div>
            </div>
          </section>

          <section className="stadium-card bg-electric text-[#00373a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined font-black">rocket_launch</span>
              <h3 className="text-xs font-black uppercase tracking-widest">Scout's Vertical</h3>
            </div>
            <p className="text-xs font-bold leading-relaxed italic">
              "Development path suggests shifting towards a primary perimeter creator role. Physical traits allow for high-level switchability on defense."
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PlayerProfilePage;
