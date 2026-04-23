'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import { Game, GameStatus } from '@/types/game';
import UploadForm from '@/components/UploadForm';

const GamesPage = () => {
  const router = useRouter();
  const { data: games, error, isLoading, mutate } = useSWR<Game[]>('/games', {
    refreshInterval: 5000,
  });
  const [isUploadMode, setIsUploadMode] = useState(false);

  const getStatusDisplay = (status: GameStatus) => {
    switch (status) {
      case GameStatus.COMPLETED:
      case GameStatus.ANALYZED:
        return { icon: 'check_circle', color: 'var(--accent-gold)', label: 'READY' };
      case GameStatus.PROCESSING:
        return { icon: 'sync', color: 'var(--primary-electric)', label: 'ANALYZING', spin: true };
      case GameStatus.FAILED:
        return { icon: 'error', color: '#ff6e84', label: 'FAILED' };
      case GameStatus.UPLOADED:
        return { icon: 'cloud_done', color: 'var(--text-secondary)', label: 'UPLOADED' };
      case GameStatus.ASSIGNMENT_PENDING:
        return { icon: 'person_search', color: 'var(--primary-electric)', label: 'ASSIGNMENT' };
      default:
        return { icon: 'pending', color: 'var(--text-dim)', label: status };
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  if (isUploadMode) return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <button onClick={() => setIsUploadMode(false)} className="text-electric font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Gallery
        </button>
        <h1 className="text-4xl font-black italic tracking-tighter">ANALYZE NEW GAME</h1>
      </header>
      <div className="stadium-card">
        <UploadForm 
          onUploadComplete={() => {
            setIsUploadMode(false);
            mutate();
          }}
          onCancel={() => setIsUploadMode(false)}
        />
      </div>
    </main>
  );

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-[0.2em] mb-1">Film Room</p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Stadium Gallery</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/games/park-setup')}
            className="px-6 py-3 bg-[var(--bg-container-low)] border border-[var(--border-ghost)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-container)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            Park Setup
          </button>
          <button 
            onClick={() => setIsUploadMode(true)}
            className="px-6 py-3 bg-electric text-[#00373a] rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            New Analysis
          </button>
        </div>
      </header>

      {!games || games.length === 0 ? (
        <section className="stadium-card py-24 flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--border-ghost)] bg-transparent">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-container-low)] flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-[var(--text-dim)]">sports_basketball</span>
          </div>
          <h2 className="text-2xl font-bold uppercase mb-2">No Tape in the Vault</h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-xs mx-auto mb-10">Upload your first game to start seeing AI performance analytics.</p>
          <button 
            onClick={() => setIsUploadMode(true)}
            className="px-10 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-electric hover:text-[#00373a] transition-all"
          >
            Start Analysis
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const status = getStatusDisplay(game.status);
            const date = new Date(game.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <div 
                key={game.id}
                onClick={() => router.push(`/games/${game.id}`)}
                className="stadium-card group cursor-pointer border border-[var(--border-ghost)] hover:border-electric/30"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all ${
                    game.status === GameStatus.PROCESSING ? 'bg-electric/10 border-electric/30 text-electric' : 'bg-[var(--bg-container-low)] border-[var(--border-ghost)] text-[var(--text-dim)]'
                  }`} style={{ color: status.color, borderColor: `${status.color}33` }}>
                    <span className={`material-symbols-outlined text-sm ${status.spin ? 'animate-spin' : ''}`}>{status.icon}</span>
                    {status.label}
                  </span>
                  <span className="text-[10px] font-black uppercase text-[var(--text-dim)]">{date}</span>
                </div>

                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1 group-hover:text-electric transition-colors">{game.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{game.homeTeam?.name || 'Home'}</span>
                  <span className="text-[10px] font-black text-[var(--text-dim)]">VS</span>
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{game.awayTeam?.name || 'Away'}</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-ghost)]">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[var(--bg-container-highest)] border-2 border-[var(--bg-container)] flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-xs text-[var(--text-dim)]">person</span>
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-[var(--bg-container-low)] border-2 border-[var(--bg-container)] flex items-center justify-center">
                      <span className="text-[8px] font-black">+12</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[var(--text-dim)] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default GamesPage;
