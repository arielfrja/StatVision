'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import { Game, GameStatus } from '@/types/game';
import UploadForm from '@/components/UploadForm';

const GamesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessTokenSilently } = useAuth0();
  const resumeId = searchParams.get('resume');

  const { data: games, isLoading, mutate } = useSWR<Game[]>('/games', {
    refreshInterval: 5000,
  });
  
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [resumeGameId, setResumeGameId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) {
      setIsUploadMode(true);
      setResumeGameId(resumeId);
    }
  }, [resumeId]);

  const handleDeleteGame = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation(); // Prevent navigating to the game page
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) return;

    setIsDeleting(gameId);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.delete(`/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await mutate();
    } catch (err) {
      console.error("Failed to delete game:", err);
      alert('Failed to delete game. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

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
      case GameStatus.PENDING:
        return { icon: 'upload_file', color: 'var(--primary-electric)', label: 'UNFINISHED' };
      default:
        return { icon: 'pending', color: 'var(--text-dim)', label: status };
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader size="large" />
    </div>
  );

  if (isUploadMode) return (
    <div className="max-w-4xl mx-auto pb-24">
      <header className="mb-10">
        <button 
          onClick={() => {
            setIsUploadMode(false);
            setResumeGameId(null);
            router.replace('/games'); // Clear query param
          }} 
          className="text-electric font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2 outline-none group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to Gallery
        </button>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">
          {resumeGameId ? 'Resume Analysis' : 'Analyze New Game'}
        </h1>
      </header>
      <div className="stadium-card">
        <UploadForm 
          initialGameId={resumeGameId || undefined}
          onUploadComplete={() => {
            setIsUploadMode(false);
            setResumeGameId(null);
            router.replace('/games');
            mutate();
          }}
          onCancel={() => {
            setIsUploadMode(false);
            setResumeGameId(null);
            router.replace('/games');
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="pb-16">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-[0.2em] mb-1">Film Room</p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Stadium Gallery</h1>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsUploadMode(true)}
            icon="add"
          >
            New Analysis
          </Button>
          </div>
          </header>

          {!games || games.length === 0 ? (
          <section className="stadium-card py-24 flex flex-col items-center justify-center text-center border-dashed border-2 border-bd-ghost bg-transparent">
          <div className="w-20 h-20 rounded-full bg-container-low flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-tx-dim">sports_basketball</span>
          </div>
          <h2 className="text-2xl font-bold uppercase mb-2">No Tape in the Vault</h2>
          <p className="text-tx-secondary font-medium max-w-md mx-auto mb-10">Upload your first game to start seeing AI performance analytics.</p>
          <Button 
            onClick={() => setIsUploadMode(true)}
            variant="secondary"
            size="lg"
            className="min-w-[240px]"
          >
            Start Analysis
          </Button>
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
                className="stadium-card group cursor-pointer border border-bd-ghost hover:border-electric/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all ${
                    game.status === GameStatus.PROCESSING ? 'bg-electric/10 border-electric/30 text-electric' : 'bg-container-low border-bd-ghost text-tx-dim'
                  }`} style={{ color: status.color, borderColor: `${status.color}33` }}>
                    <span className={`material-symbols-outlined text-sm ${status.spin ? 'animate-spin' : ''}`}>{status.icon}</span>
                    {status.label}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-tx-dim">{date}</span>
                    <button 
                      onClick={(e) => handleDeleteGame(e, game.id)}
                      disabled={isDeleting === game.id}
                      className="w-7 h-7 rounded bg-container-high border border-bd-ghost flex items-center justify-center text-tx-dim hover:text-red-400 transition-all"
                    >
                      {isDeleting === game.id ? (
                        <div className="w-3 h-3 border-2 border-tx-dim border-t-red-500 rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-base">delete</span>
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1 group-hover:text-electric transition-colors">{game.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-tx-secondary uppercase">{game.homeTeam?.name || 'Home'}</span>
                  <span className="text-[10px] font-black text-tx-dim">VS</span>
                  <span className="text-xs font-bold text-tx-secondary uppercase">{game.awayTeam?.name || 'Away'}</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-bd-ghost">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tx-dim">analytics</span>
                    <span className="text-[10px] font-black uppercase text-tx-dim tracking-widest">
                        {game.events?.length || 0} Events Logged
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-tx-dim group-hover:translate-x-1 transition-transform group-hover:text-electric">arrow_forward</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
