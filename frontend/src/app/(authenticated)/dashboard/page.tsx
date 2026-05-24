/* eslint-disable */
'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Game, GameStatus } from '@/types/game';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import Link from 'next/link';
import { JobProgressBar } from '@/components/JobProgressBar';

const PerformanceDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');

  const pendingUpload = useMemo(() => {
    if (!games) return null;
    return games.find(g => g.status === GameStatus.PENDING && g.uploadUrl);
  }, [games]);

  const activeGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games.find(g => g.status === GameStatus.PROCESSING) || games[0];
  }, [games]);

  const recentEvents = useMemo(() => {
    if (!activeGame || !activeGame.events) return [];
    return [...activeGame.events]
      .sort((a, b) => (b as any).timestamp - (a as any).timestamp)
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
        <div className="w-16 h-16 rounded-md bg-surface border border-border-main flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl text-tx-dim opacity-40">upload_file</span>
        </div>
        <h1 className="text-xl font-bold text-tx-primary mb-2">No Active Records</h1>
        <p className="text-sm text-tx-secondary mb-8 max-w-xs mx-auto uppercase tracking-wider font-medium">Initialize game footage ingestion to activate the performance analytics dashboard.</p>
        <Link href="/games" passHref>
          <Button size="lg" className="px-10">Upload Game</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 flex flex-col gap-10 animate-in fade-in duration-300">
      
      {/* Professional System Alert for Pending Uploads */}
      {pendingUpload && (
        <div className="p-5 bg-accent/5 border border-accent/20 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <span className="material-symbols-outlined">restart_alt</span>
              </div>
              <div>
                 <h3 className="text-sm font-bold text-tx-primary uppercase tracking-wider">Unfinished Ingestion Detected</h3>
                 <p className="text-xs text-tx-secondary font-medium">Process for "<span className="text-accent font-bold">{pendingUpload.name}</span>" was interrupted. System is ready to resume.</p>
              </div>
           </div>
           <Link href={`/games?resume=${pendingUpload.id}`} passHref>
              <Button size="sm">Resume Stream</Button>
           </Link>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${activeGame?.status === GameStatus.PROCESSING ? 'bg-accent animate-pulse' : 'bg-success'}`} />
            <span className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">
              {activeGame?.status === GameStatus.PROCESSING ? 'ENGINE: ANALYZING' : 'ENGINE: STANDBY'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-tx-primary">Performance Dashboard</h1>
          <p className="text-xs text-tx-secondary font-medium uppercase tracking-widest">{activeGame?.name || 'Session Ready'}</p>
        </div>
        
        <div className="flex flex-col md:items-end gap-3 min-w-[280px]">
           {activeGame?.status === GameStatus.PROCESSING && (
             <div className="w-full">
                <JobProgressBar gameId={activeGame.id} />
             </div>
           )}
           <Link href="/games" passHref>
             <Button variant="outline" size="sm" icon="grid_view">Gallery View</Button>
           </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Column: Activity & Preview */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Professional Video Placeholder/Preview */}
          <section className="bg-surface border border-border-main rounded-md aspect-video flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
            {activeGame?.videoUrl ? (
              <div className="text-center">
                 <span className="material-symbols-outlined text-5xl text-tx-dim opacity-10 mb-4">analytics</span>
                 <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Analytics Feed Ready</p>
                 <div className="absolute bottom-4 right-4 text-[9px] font-bold text-tx-dim mono-stat opacity-30">
                   STREAM_ID: {activeGame.id.slice(0,12)}
                 </div>
              </div>
            ) : (
              <div className="text-center px-6">
                 <span className="material-symbols-outlined text-5xl text-tx-dim opacity-5 mb-4">videocam_off</span>
                 <p className="text-xs font-bold text-tx-dim uppercase tracking-widest">No Active Video Stream</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-bg/50 to-transparent pointer-events-none" />
          </section>

          {/* Activity Stream */}
          <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Recent System Detections</h3>
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Live Log</span>
              </div>
              <div className="flex flex-col gap-px bg-border-main border border-border-main rounded-md overflow-hidden">
                {recentEvents.length > 0 ? (
                    recentEvents.map((event, i) => (
                        <div key={event.id || i} className="bg-surface p-4 flex items-center justify-between hover:bg-surface-high transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded bg-primary-bg flex items-center justify-center text-tx-secondary border border-border-main">
                                    <span className="material-symbols-outlined text-lg">
                                    {event.eventType.toLowerCase().includes('shot') || event.eventType.toLowerCase().includes('3pt') ? 'sports_basketball' : 
                                    event.eventType.toLowerCase().includes('steal') || event.eventType.toLowerCase().includes('block') ? 'pan_tool' : 'pending_actions'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-tx-primary tracking-tight">{event.eventType.replace(/_/g, ' ')}</h4>
                                    <p className="text-[10px] text-tx-secondary font-medium uppercase mt-0.5 tracking-tighter">
                                    {event.assignedPlayerId ? 'Verified Target' : 'Detection Pending Assignment'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-tx-dim mono-stat">
                                    {Math.floor(event.absoluteTimestamp / 60)}:{(Math.floor(event.absoluteTimestamp % 60)).toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 bg-surface text-center">
                        <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Awaiting Engine Synchronization...</p>
                    </div>
                )}
              </div>
          </section>
        </div>

        {/* Sidebar Column: Metrics & Health */}
        <div className="lg:col-span-4 space-y-6">
          
          <section className="utility-card p-6 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Session Scoring</h3>
            <div className="space-y-6">
              {activeGame?.teamStats?.length ? (
                activeGame.teamStats.slice(0, 2).map((ts, idx) => (
                  <div key={ts.teamId}>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider">{idx === 0 ? 'Home' : 'Away'}</span>
                        <span className="text-3xl font-black text-tx-primary mono-stat leading-none">{ts.points || 0}</span>
                    </div>
                    <div className="h-1 w-full bg-primary-bg rounded-full overflow-hidden border border-border-main">
                      <div className={`h-full ${idx === 0 ? 'bg-accent' : 'bg-warning'}`} style={{ width: `${Math.min(ts.points, 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                    <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Syncing Scoreboard...</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface border border-border-main rounded-md p-6 border-l-2 border-accent">
            <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-6">Engine Diagnostics</h3>
            <div className="space-y-4">
               {[
                 { label: 'Inference', val: 'Operational', color: 'text-success' },
                 { label: 'Cloud Storage', val: 'Synchronized', color: 'text-tx-secondary' },
                 { label: 'Metadata API', val: 'Active', color: 'text-tx-secondary' }
               ].map((log, i) => (
                 <div key={i} className="flex justify-between items-center">
                   <span className="text-[9px] font-bold uppercase text-tx-dim tracking-tight">[{log.label}]</span>
                   <span className={`text-[9px] font-bold uppercase tracking-tight ${log.color}`}>{log.val}</span>
                 </div>
               ))}
            </div>
          </section>

          <Link href="/games" passHref>
             <button className="w-full flex items-center justify-between px-5 py-4 bg-surface border border-border-main rounded-md text-tx-secondary hover:text-accent transition-all group">
                <span className="text-[10px] font-bold uppercase tracking-widest">Access Game Archive</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
             </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboardPage;
