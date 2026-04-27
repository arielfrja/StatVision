'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import Loader from '@/components/Loader';
import Link from 'next/link';

const CommandCenterPage = () => {
  const { data: games, error, isLoading } = useSWR<Game[]>('/games');
  const [activeTab, setActiveTab] = useState('live');

  // ... (useMemo logic) ...

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader />
    </div>
  );

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-container-low flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-tx-dim">cloud_off</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">NO DATA DETECTED</h1>
        <p className="text-tx-secondary mb-8 max-w-md mx-auto">Upload a game recording to initialize the Command Center intelligence stream.</p>
        <Link href="/games" className="inline-flex items-center justify-center bg-electric text-[#00373a] px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform min-w-[200px]">
          Upload Game
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-widest mb-1">
            Status: {activeGame?.status === GameStatus.PROCESSING ? 'Active Analysis' : 'Intelligence Ready'}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">COMMAND CENTER</h1>
          <p className="text-tx-dim text-sm mt-1 font-medium">{activeGame?.name || 'No Active Game'}</p>
        </div>
        <div className="flex bg-container-low p-1.5 rounded-xl border border-bd-ghost">
          {['live', 'timeline', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center justify-center px-10 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all min-w-[140px] ${
                activeTab === tab 
                  ? 'bg-container-highest text-electric shadow-sm border border-bd-active' 
                  : 'text-tx-dim hover:text-tx-secondary'
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
          <section className="stadium-card flex flex-wrap items-center gap-8 py-4 px-6 overflow-x-auto no-scrollbar min-h-[88px]">
            {activeGame?.status === GameStatus.PROCESSING ? (
              <>
                <div className="flex items-center gap-3 min-w-fit">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="18" stroke="var(--bg-container-highest)" strokeWidth="3" fill="none" />
                      <circle cx="20" cy="20" r="18" stroke="var(--primary-electric)" strokeWidth="3" fill="none" strokeDasharray="113" strokeDashoffset="40" className="animate-pulse" />
                    </svg>
                    <span className="absolute text-[8px] font-bold">ANALYZING</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-tx-dim uppercase">Worker State</span>
                    <span className="text-xs font-bold">In-Progress</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 min-w-fit">
                  <div className="relative w-10 h-10 flex items-center justify-center text-electric">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-tx-dim uppercase">Parallel Ops</span>
                    <span className="text-xs font-bold">Event Extraction</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 text-tx-dim italic">
                <span className="material-symbols-outlined opacity-50">check_circle</span>
                <span className="text-xs font-bold uppercase tracking-widest">System Idle • All Tasks Completed</span>
              </div>
            )}

            <div className="flex items-center gap-3 min-w-fit border-l border-bd-ghost pl-8 ml-auto">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-tx-dim uppercase">Cloud Connectivity</span>
                <span className="text-xs font-bold mono-stat text-green-400">ACTIVE</span>
              </div>
            </div>
          </section>

          {/* Video Player Section */}
          <section className="stadium-card p-0 overflow-hidden aspect-video relative group border border-bd-ghost">
            {activeGame?.videoUrl ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                 <span className="material-symbols-outlined text-6xl text-white/20">videocam</span>
                 <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">
                   Source Linked: {activeGame.id.slice(0,8)}
                 </p>
              </div>
            ) : (
              <div className="w-full h-full bg-container-lowest flex flex-col items-center justify-center gap-4">
                 <span className="material-symbols-outlined text-6xl text-container-highest">video_camera_back</span>
                 <p className="text-xs font-bold text-tx-dim uppercase tracking-widest">No Source Video Available</p>
              </div>
            )}
          </section>

          {/* Intelligence Stream */}
          <section>
            <h3 className="text-sm font-bold text-tx-dim uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeGame?.status === GameStatus.PROCESSING ? 'bg-electric animate-pulse' : 'bg-tx-dim'}`} />
              Intelligence Stream
            </h3>
            <div className="flex flex-col gap-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((event, i) => (
                  <div key={event.id || i} className="frosted-glass rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-container-high transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-container-low flex items-center justify-center text-xl text-electric">
                        <span className="material-symbols-outlined">
                          {event.type.toLowerCase().includes('shot') || event.type.toLowerCase().includes('3pt') ? 'sports_basketball' : 
                           event.type.toLowerCase().includes('steal') || event.type.toLowerCase().includes('block') ? 'pan_tool' : 'history'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase">{event.type}</h4>
                        <p className="text-xs text-tx-dim font-semibold">
                          {event.player?.name ? `${event.player.name} (#${event.player.jerseyNumber})` : 'Unassigned Player'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs mono-stat font-bold">
                        {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                      </p>
                      <button className="text-[10px] font-bold uppercase text-electric opacity-0 group-hover:opacity-100 transition-opacity">Analyze</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="stadium-card py-12 text-center border-dashed border border-bd-ghost bg-transparent">
                  <p className="text-xs font-bold text-tx-dim uppercase tracking-[0.2em]">No Events Detected Yet</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Tactical Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="stadium-card">
            <h3 className="text-xs font-bold text-tx-dim uppercase tracking-widest mb-6">Efficiency Pulse</h3>
            <div className="flex flex-col gap-6">
              {activeGame?.stats ? (
                <>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                      <span>Home Efficiency</span>
                      <span className="text-electric">{activeGame.stats.homeScore || 0} PTS</span>
                    </div>
                    <div className="h-1 w-full bg-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-electric" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                      <span>Away Efficiency</span>
                      <span className="text-gold">{activeGame.stats.awayScore || 0} PTS</span>
                    </div>
                    <div className="h-1 w-full bg-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: '40%' }} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[10px] font-bold text-tx-dim uppercase italic">Statistical data pending...</p>
              )}
            </div>
          </section>

          <section className="stadium-card bg-gradient-to-br from-container to-container-low border-l-4 border-electric/30">
            <h3 className="text-xs font-bold text-electric uppercase tracking-widest mb-4 italic">System Logs</h3>
            <div className="space-y-2">
               <p className="text-[10px] text-tx-secondary font-medium">
                 [DATABASE] Connected to Supabase Instance
               </p>
               <p className="text-[10px] text-tx-secondary font-medium">
                 [AI-ENGINE] gemini-3-flash-preview ready
               </p>
               <p className="text-[10px] text-tx-secondary font-medium">
                 [SECURITY] Auth Mode: {process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ? 'MOCK' : 'OIDC'}
               </p>
            </div>
          </section>

          <Link href="/games" className="stadium-card flex items-center justify-between hover:bg-container-high transition-colors group">
             <span className="text-xs font-bold uppercase tracking-widest">Manage All Games</span>
             <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterPage;
