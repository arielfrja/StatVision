'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import { Player } from '@/types/game';

const PlayerProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: player, isLoading } = useSWR<Player>(`/players/${params.playerId}`);
  const [activeTab, setActiveTab] = useState('highlights');

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  if (!player) return (
    <div className="text-center py-24">
      <h1 className="text-2xl font-bold uppercase">Player Not Found</h1>
      <button onClick={() => router.back()} className="text-electric mt-4 uppercase font-black text-xs tracking-widest">Return to Roster</button>
    </div>
  );

  return (
    <div className="pb-16">
      {/* Player Hero Section */}
      <header className="relative mb-12 stadium-card overflow-hidden py-12 px-8 flex flex-col md:flex-row items-center gap-10">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]">person</span>
        </div>

        <div className="relative group">
          <div className="w-40 h-40 rounded-full bg-container-low border-4 border-electric/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_var(--primary-glow)]">
            <span className="material-symbols-outlined text-7xl text-tx-dim">person</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-gold flex items-center justify-center text-[#00373a] shadow-lg border-4 border-container">
            <span className="material-symbols-outlined font-black">grade</span>
          </div>
        </div>

        <div className="text-center md:text-left flex-1">
          <button onClick={() => router.back()} className="text-electric font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 group mx-auto md:mx-0">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Team
          </button>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{player.name}</h1>
            <span className="text-2xl font-black italic text-electric/40">#{player.jerseyNumber}</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <span className="px-4 py-1.5 bg-container-highest border border-bd-ghost rounded-full text-[10px] font-black uppercase tracking-widest text-tx-secondary">
               {player.position || 'Active Roster'}
             </span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-4 border-l border-bd-ghost pl-10 hidden md:flex opacity-50">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase text-tx-dim tracking-widest mb-1">Status</p>
            <p className="text-2xl font-black italic tracking-tighter text-white uppercase">Active</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Content Area */}
        <div className="lg:col-span-8">
          <div className="flex gap-8 border-b border-bd-ghost mb-8">
            {['highlights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-electric' : 'text-tx-dim hover:text-white'
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
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-tx-dim">Intelligence Archives</h2>
              </div>
              
              <div className="stadium-card py-24 text-center border-dashed border-2 border-bd-ghost bg-transparent">
                 <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-30">video_library</span>
                 <p className="text-xs font-bold text-tx-dim uppercase tracking-widest leading-relaxed">
                    No analyzed game clips found for this player profile.<br/>
                    <span className="text-[10px] opacity-60">Upload game footage to begin AI extraction.</span>
                 </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="stadium-card border-l-4 border-electric/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 blur-3xl -mr-16 -mt-16 group-hover:bg-electric/10 transition-all duration-700"></div>
            <h3 className="text-[10px] font-black text-electric uppercase tracking-[0.2em] mb-4 italic relative z-10">AI Scout</h3>
            <div className="relative z-10">
              <p className="text-xs text-tx-secondary leading-relaxed italic font-medium">
                "I am monitoring this player's performance across recent games. Skill distribution and efficiency pulse will be generated as more events are recorded."
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
