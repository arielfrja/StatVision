/* eslint-disable */
'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import Link from 'next/link';

const PerformanceDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');
  const [activeTab, setActiveTab] = useState('live');

  const activeGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games.find(g => g.status === GameStatus.PROCESSING) || games[0];
  }, [games]);

  const recentEvents = useMemo(() => {
    if (!activeGame || !activeGame.events) return [];
    return [...activeGame.events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [activeGame]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader size="large" />
    </div>
  );

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-container-low flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl text-tx-dim opacity-40">upload_file</span>
        </div>
        <h1 className="text-xl font-bold mb-2">No Active Records</h1>
        <p className="text-xs text-tx-secondary mb-8 max-w-sm mx-auto uppercase tracking-wider font-medium">Upload footage to initialize the performance dashboard analysis.</p>
        <Link href="/games" passHref>
          <Button size="lg" className="px-10">Upload Game</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bd-ghost pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${activeGame?.status === GameStatus.PROCESSING ? 'bg-electric animate-pulse' : 'bg-green-500'}`} />
            <p className="text-[10px] font-bold text-tx-dim uppercase tracking-[0.1em]">
              {activeGame?.status === GameStatus.PROCESSING ? 'Analysis Active' : 'System Ready'}
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-tx-secondary text-xs mt-1 font-semibold">{activeGame?.name || 'No Active Session'}</p>
        </div>
        <div className="flex gap-2">
           <Link href="/games" passHref>
             <button className="px-4 py-2 bg-container-high border border-bd-ghost rounded-lg text-xs font-bold hover:bg-container-highest transition-colors">
                View Archive
             </button>
           </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed: Video & Live Intelligence */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Video Player Preview Section */}
          <section className="bg-black border border-bd-ghost rounded-xl aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
            {activeGame?.videoUrl ? (
              <div className="text-center">
                 <span className="material-symbols-outlined text-5xl text-tx-dim opacity-20 mb-3">video_library</span>
                 <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Video Stream Ready</p>
                 <div className="absolute bottom-4 right-4 text-[9px] font-medium text-tx-dim mono-stat opacity-40">
                   ID: {activeGame.id.slice(0,8)}
                 </div>
              </div>
            ) : (
              <div className="text-center px-6">
                 <span className="material-symbols-outlined text-5xl text-tx-dim opacity-10 mb-4">videocam_off</span>
                 <p className="text-xs font-semibold text-tx-dim uppercase tracking-wider">No Video Source Attached</p>
              </div>
            )}
          </section>

          {/* Intelligence Stream */}
          <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-tx-dim uppercase tracking-widest">Recent Activity</h3>
                <span className="text-[10px] font-medium text-tx-dim opacity-50">Play-by-Play</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recentEvents.length > 0 ? (
                    recentEvents.map((event, i) => (
                        <div key={event.id || i} className="bg-container border border-bd-ghost rounded-lg p-4 flex items-center justify-between hover:bg-container-high transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded bg-container-high flex items-center justify-center text-tx-secondary border border-bd-ghost">
                                    <span className="material-symbols-outlined text-lg">
                                    {event.type.toLowerCase().includes('shot') || event.type.toLowerCase().includes('3pt') ? 'sports_basketball' : 
                                    event.type.toLowerCase().includes('steal') || event.type.toLowerCase().includes('block') ? 'pan_tool' : 'pending_actions'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-white">{event.type}</h4>
                                    <p className="text-[10px] text-tx-dim font-medium uppercase mt-0.5">
                                    {event.player?.name ? `${event.player.name} (#${event.player.jerseyNumber})` : 'Unidentified Player'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-medium text-tx-dim mono-stat">
                                    {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 bg-container border border-dashed border-bd-ghost rounded-lg text-center">
                        <p className="text-xs font-medium text-tx-dim uppercase tracking-wider">Awaiting event extraction...</p>
                    </div>
                )}
              </div>
          </section>
        </div>

        {/* Sidebar: Summary & Status */}
        <div className="lg:col-span-4 space-y-6">
          <section className="utility-card">
            <h3 className="text-xs font-bold text-tx-dim uppercase tracking-widest mb-6">Game Scoring</h3>
            <div className="space-y-6">
              {activeGame?.stats ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-white uppercase">{activeGame.homeTeam?.name || 'Home'}</span>
                        <span className="text-2xl font-bold mono-stat">{activeGame.stats.homeScore || 0}</span>
                    </div>
                    <div className="h-1 w-full bg-container-highest rounded-full">
                      <div className="h-full bg-electric" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-white uppercase">{activeGame.awayTeam?.name || 'Away'}</span>
                        <span className="text-2xl font-bold mono-stat">{activeGame.stats.awayScore || 0}</span>
                    </div>
                    <div className="h-1 w-full bg-container-highest rounded-full">
                      <div className="h-full bg-gold" style={{ width: '40%' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                    <p className="text-[10px] font-medium text-tx-dim uppercase tracking-wider">Syncing Data Intelligence...</p>
                </div>
              )}
            </div>
          </section>

          <section className="utility-card bg-container-low border-l-2 border-electric/30">
            <h3 className="text-[10px] font-bold text-electric uppercase tracking-widest mb-4">System Logistics</h3>
            <div className="space-y-3">
               {[
                 { label: 'Network', val: 'Online' },
                 { label: 'Inference', val: 'Active' },
                 { label: 'API Stream', val: 'Synchronized' }
               ].map((log, i) => (
                 <div key={i} className="flex justify-between items-center">
                   <span className="text-[9px] font-bold uppercase text-tx-dim tracking-tight">[{log.label}]</span>
                   <span className="text-[9px] font-bold uppercase text-tx-secondary tracking-tight">{log.val}</span>
                 </div>
               ))}
            </div>
          </section>

          <Link href="/games" passHref>
             <button className="w-full flex items-center justify-between px-4 py-3 bg-container-high border border-bd-ghost rounded-lg text-tx-secondary hover:text-white transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider">View Full Archive</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
             </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboardPage;
