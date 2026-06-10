'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import { Game, GameStatus } from '@/types/game';
import UploadForm from '@/components/UploadForm';

const GamesPage = () => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');

  const { data: games, isLoading, mutate } = useSWR<Game[]>('/games', {
    refreshInterval: 5000,
  });
  
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [resumeGameId, setResumeGameId] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) {
      setIsUploadMode(true);
      setResumeGameId(resumeId);
    }
  }, [resumeId]);

  const getStatusDisplay = (status: GameStatus) => {
    switch (status) {
      case GameStatus.COMPLETED:
      case GameStatus.ANALYZED:
        return { icon: 'check_circle', color: 'var(--color-success)', label: 'READY' };
      case GameStatus.PROCESSING:
        return { icon: 'sync', color: 'var(--accent)', label: 'ANALYZING', spin: true };
      case GameStatus.FAILED:
        return { icon: 'error', color: 'var(--color-error)', label: 'FAILED' };
      case GameStatus.UPLOADED:
        return { icon: 'cloud_done', color: 'var(--text-muted)', label: 'UPLOADED' };
      case GameStatus.ASSIGNMENT_PENDING:
        return { icon: 'person_search', color: 'var(--accent)', label: 'IDENTITY' };
      case GameStatus.PENDING:
        return { icon: 'upload_file', color: 'var(--accent)', label: 'DRAFT' };
      default:
        return { icon: 'pending', color: 'var(--text-muted)', label: status };
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader size="large" />
    </div>
  );

  const handleRetry = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation(); // Prevent navigating to game page
    setResumeGameId(gameId);
    setIsUploadMode(true);
    // Update URL without full refresh to maintain state
    router.replace(`/games?resume=${gameId}`);
  };

  const handleDelete = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this game and all its data? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      await apiClient.delete(`/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cleanup localStorage if this was the active resumable upload
      const activeUploadId = localStorage.getItem('statvision_active_upload_id');
      if (activeUploadId === gameId) {
        localStorage.removeItem('statvision_active_upload_id');
        localStorage.removeItem('statvision_active_upload_filename');
        localStorage.removeItem('statvision_active_upload_filesize');
      }

      mutate(); // Refresh the list
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Please try again.');
    }
  };

  if (isUploadMode) return (
    <div className="max-w-4xl mx-auto pb-24">
      <header className="mb-10 flex flex-col gap-4">
        <button 
          onClick={() => {
            setIsUploadMode(false);
            setResumeGameId(null);
            router.replace('/games');
          }} 
          className="text-accent font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-tx-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Return to Vault
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-tx-primary">
          {resumeGameId ? 'Recover Upload' : 'Initialize New Analysis'}
        </h1>
      </header>
      <div className="bg-surface border border-border-main rounded-md p-1">
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
    <div className="pb-16 flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-tx-primary">Film Room</h1>
          <p className="text-xs text-tx-secondary font-medium uppercase tracking-widest">Storage & Analysis Hub</p>
        </div>
        <Button 
          onClick={() => setIsUploadMode(true)}
          icon="add_box"
          size="lg"
        >
          New Upload
        </Button>
      </header>

      {!games || games.length === 0 ? (
          <section className="bg-primary-bg/50 py-32 flex flex-col items-center justify-center text-center border-dashed border border-border-main rounded-md">
            <div className="w-16 h-16 rounded-md bg-surface border border-border-main flex items-center justify-center mb-6 text-tx-dim">
              <span className="material-symbols-outlined text-3xl">videocam_off</span>
            </div>
            <h2 className="text-lg font-bold text-tx-primary mb-2">The Vault is Empty</h2>
            <p className="text-sm text-tx-secondary max-w-xs mx-auto mb-10">Upload your first game to begin automated performance tracking.</p>
            <Button 
              onClick={() => setIsUploadMode(true)}
              variant="outline"
              size="lg"
            >
              Start Analysis
            </Button>
          </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {games.map((game) => {
            const status = getStatusDisplay(game.status);
            const date = new Date(game.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const canRetry = game.status === GameStatus.FAILED || game.status === GameStatus.PENDING;
            
            return (
              <div 
                key={game.id}
                onClick={() => !canRetry && router.push(`/games/${game.id}`)}
                className={`bg-surface border border-border-main rounded-md group overflow-hidden flex flex-col transition-all duration-200 ${canRetry ? 'opacity-80' : 'cursor-pointer hover:border-accent'}`}
              >
                {/* Scoreboard-style Header */}
                <div className="p-5 border-b border-border-main bg-primary-bg/30 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">{date}</span>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-tighter italic">{game.gameType.replace(/_/g, ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider" 
                      style={{ color: status.color, borderColor: `${status.color}33`, background: `${status.color}0D` }}>
                      <span className={`material-symbols-outlined text-[12px] ${status.spin ? 'animate-spin' : ''}`}>{status.icon}</span>
                      {status.label}
                    </span>

                    <button 
                      onClick={(e) => handleDelete(e, game.id)}
                      className="text-tx-dim hover:text-color-error transition-colors p-1 rounded-full hover:bg-color-error/10 flex items-center justify-center"
                      title="Delete Game"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Matchup Content */}
                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-black">
                        {game.homeTeam?.name?.charAt(0).toUpperCase() || 'H'}
                      </div>
                      <span className="text-[10px] font-bold text-tx-secondary uppercase truncate max-w-[80px]">{game.homeTeam?.name || 'HOME'}</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-black text-tx-dim uppercase tracking-tighter">VS</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning text-sm font-black">
                        {game.awayTeam?.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <span className="text-[10px] font-bold text-tx-secondary uppercase truncate max-w-[80px]">{game.awayTeam?.name || 'AWAY'}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-tx-primary text-center truncate group-hover:text-accent transition-colors">{game.name}</h3>
                </div>

                {/* Footer Stats / Actions */}
                <div className="px-5 py-3 border-t border-border-main bg-primary-bg/20 flex items-center justify-between min-h-[44px]">
                  {canRetry ? (
                    <Button 
                        variant="primary" 
                        size="sm" 
                        fullWidth 
                        icon="refresh"
                        onClick={(e) => handleRetry(e, game.id)}
                    >
                        Retry Upload
                    </Button>
                  ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-tx-dim">analytics</span>
                            <span className="text-[10px] font-bold text-tx-dim uppercase mono-stat">{game.events?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-tx-dim">person</span>
                            <span className="text-[10px] font-bold text-tx-dim uppercase mono-stat">{game.playerStats?.length || 0}</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-tx-dim group-hover:text-accent transition-all text-base">chevron_right</span>
                    </>
                  )}
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
