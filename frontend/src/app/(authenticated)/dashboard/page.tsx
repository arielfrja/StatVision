'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import Link from 'next/link';

const CommandCenterPage = () => {
  const { data: games, error, isLoading } = useSWR<Game[]>('/games');
  const [activeTab, setActiveTab] = useState('live');

  const activeGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games.find(g => g.status === GameStatus.PROCESSING) || games[0];
  }, [games]);

  const recentEvents = useMemo(() => {
    if (!activeGame || !activeGame.events) return [];
    return [...activeGame.events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [activeGame]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader size="large" />
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
        <Link href="/games" passHref>
          <Button size="lg" className="min-w-[200px]">Upload Game</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-electric font-bold text-[10px] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeGame?.status === GameStatus.PROCESSING ? 'bg-electric animate-pulse shadow-[0_0_10px_#00F3FF]' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`} />
            {activeGame?.status === GameStatus.PROCESSING ? 'AI Engine Active' : 'Intelligence Ready'}
          </p>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-white">Command Center</h1>
          <p className="text-tx-dim text-xs mt-1 font-bold uppercase tracking-widest">{activeGame?.name || 'No Active Game'}</p>
        </div>
        <div className="flex bg-container-low p-1 rounded-xl border border-bd-ghost">
          {['Live Feed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab('live')}
              className={`inline-flex items-center justify-center px-10 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all min-w-[140px] bg-container-highest text-electric shadow-lg border border-bd-active`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed: Video & Live Intelligence */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Video Player Section */}
          <section className="stadium-card p-0 overflow-hidden aspect-video relative group border border-bd-ghost shadow-2xl">
            {activeGame?.videoUrl ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                 <span className="material-symbols-outlined text-6xl text-white/10 animate-pulse">videocam</span>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-white/40 tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                   Stream ID: {activeGame.id.slice(0,12)}
                 </p>
              </div>
            ) : (
              <div className="w-full h-full bg-container-lowest flex flex-col items-center justify-center gap-6 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_70%)]"></div>
                 <span className="material-symbols-outlined text-6xl text-container-highest">video_camera_back</span>
                 <div className="text-center relative z-10">
                    <p className="text-[10px] font-black text-tx-dim uppercase tracking-[0.3em] mb-2">No active video source</p>
                    <p className="text-[8px] font-bold text-tx-dim/60 uppercase tracking-widest max-w-[200px] mx-auto">
                        Link a recording to initialize the visual intelligence overlay.
                    </p>
                 </div>
              </div>
            )}
          </section>

          {/* Intelligence Stream - Only show if events exist */}
          {recentEvents.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-[10px] font-black text-tx-dim uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${activeGame?.status === GameStatus.PROCESSING ? 'bg-electric animate-pulse' : 'bg-tx-dim'}`} />
                Live Event Log
                </h3>
                <div className="flex flex-col gap-3">
                {recentEvents.map((event, i) => (
                    <div key={event.id || i} className="bg-container-low border border-bd-ghost rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-container-highest transition-all duration-300 active:scale-[0.99] click-flash">
                        <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-container flex items-center justify-center text-xl text-electric border border-bd-ghost group-hover:border-electric/50 transition-colors">
                            <span className="material-symbols-outlined">
                            {event.type.toLowerCase().includes('shot') || event.type.toLowerCase().includes('3pt') ? 'sports_basketball' : 
                            event.type.toLowerCase().includes('steal') || event.type.toLowerCase().includes('block') ? 'pan_tool' : 'history'}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase text-white group-hover:text-electric transition-colors">{event.type}</h4>
                            <p className="text-[10px] text-tx-dim font-bold uppercase tracking-tight">
                            {event.player?.name ? `${event.player.name} (#${event.player.jerseyNumber})` : 'Unassigned Identification'}
                            </p>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 tracking-widest mb-1">
                            {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                        </p>
                        <span className="text-[8px] font-black uppercase text-electric opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">Detail View</span>
                        </div>
                    </div>
                ))}
                </div>
            </section>
          )}
        </div>

        {/* Sidebar: Tactical Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="stadium-card">
            <h3 className="text-[10px] font-black text-tx-dim uppercase tracking-[0.2em] mb-8">Game Efficiency</h3>
            <div className="flex flex-col gap-8">
              {activeGame?.stats ? (
                <>
                  <div className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-tx-dim tracking-widest mb-1">Home Roster</p>
                        <p className="text-3xl font-black italic tracking-tighter text-white">{activeGame.stats.homeScore || 0} <span className="text-[10px] not-italic text-tx-dim font-bold ml-1 uppercase">PTS</span></p>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-electric shadow-[0_0_10px_#00F3FF]" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-tx-dim tracking-widest mb-1">Away Roster</p>
                        <p className="text-3xl font-black italic tracking-tighter text-white">{activeGame.stats.awayScore || 0} <span className="text-[10px] not-italic text-tx-dim font-bold ml-1 uppercase">PTS</span></p>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-gold shadow-[0_0_10px_#FFD700]" style={{ width: '40%' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                    <span className="material-symbols-outlined text-3xl text-tx-dim mb-2 opacity-20">leaderboard</span>
                    <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest italic leading-relaxed">
                        Numerical data syncing...<br/>Waiting for AI events
                    </p>
                </div>
              )}
            </div>
          </section>

          <section className="stadium-card bg-gradient-to-br from-container-low to-container border-l-4 border-electric/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 blur-3xl -mr-16 -mt-16 group-hover:bg-electric/10 transition-all duration-700"></div>
            <h3 className="text-[10px] font-black text-electric uppercase tracking-[0.2em] mb-4 italic relative z-10">System Status</h3>
            <div className="space-y-3 relative z-10">
               {[
                 { label: 'Database', val: 'Connected', col: 'text-tx-secondary' },
                 { label: 'AI Engine', val: 'Vigilant', col: 'text-tx-secondary' },
                 { label: 'Cloud Stream', val: 'Active', col: 'text-green-400' }
               ].map((log, i) => (
                 <div key={i} className="flex justify-between items-center">
                   <span className="text-[8px] font-black uppercase text-tx-dim tracking-widest">[{log.label}]</span>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${log.col}`}>{log.val}</span>
                 </div>
               ))}
            </div>
          </section>

          <Link href="/games" passHref>
             <Button variant="ghost" fullWidth className="justify-between group">
                <span className="text-[10px]">Access All Archives</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterPage;
