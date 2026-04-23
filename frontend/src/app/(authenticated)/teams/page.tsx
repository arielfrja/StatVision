'use client';

import React, { useState, useRef } from 'react';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { Team } from '@/types/team';
import apiClient from '@/utils/apiClient';

const TeamsPage = () => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>('/teams');
  
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    setIsCreating(true);
    try {
      const token = await getAccessTokenSilently();
      await apiClient.post('/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTeamName('');
      setShowModal(false);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-[0.2em] mb-1">Organization</p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Squad Management</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-electric text-[#00373a] rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Create New Squad
        </button>
      </header>

      {!teams || teams.length === 0 ? (
        <section className="stadium-card py-24 flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--border-ghost)] bg-transparent">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-container-low)] flex items-center justify-center mb-6 text-[var(--text-dim)]">
            <span className="material-symbols-outlined text-4xl">groups</span>
          </div>
          <h2 className="text-2xl font-bold uppercase mb-2 text-white">The Roster is Empty</h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-xs mx-auto mb-10">Create your first team to begin building elite rosters and tracking performance.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="px-10 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-electric hover:text-[#00373a] transition-all"
          >
            Create Team
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div 
              key={team.id}
              onClick={() => router.push(`/teams/${team.id}`)}
              className="stadium-card group cursor-pointer border border-[var(--border-ghost)] hover:border-electric/30 relative overflow-hidden"
            >
              {/* Team ID Card Background Decoration */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">sports_basketball</span>
              </div>

              <div className="flex justify-between items-start mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  team.isTemp ? 'bg-[var(--bg-container-highest)] border border-[var(--border-ghost)]' : 'bg-electric text-[#00373a]'
                }`}>
                  <span className="material-symbols-outlined font-bold">
                    {team.isTemp ? 'bolt' : 'shield'}
                  </span>
                </div>
                {team.isTemp && (
                  <span className="text-[8px] font-black uppercase tracking-widest bg-[var(--bg-container-low)] px-2 py-1 rounded border border-[var(--border-ghost)]">Park Mode</span>
                )}
              </div>

              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-electric transition-colors">
                {team.name}
              </h3>
              
              <div className="flex items-center gap-6 text-[var(--text-secondary)] mb-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{team.players?.length || 0} Roster</span>
                </div>
                <div className="flex items-center gap-2 border-l border-[var(--border-ghost)] pl-6">
                  <span className="material-symbols-outlined text-sm">leaderboard</span>
                  <span className="text-xs font-bold uppercase tracking-widest">12-4 REC</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-[var(--border-ghost)]">
                <span className="text-[10px] font-black uppercase text-electric opacity-0 group-hover:opacity-100 transition-opacity tracking-widest flex items-center gap-2">
                  Manage Roster
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
                {!team.isTemp && <span className="text-[10px] font-black uppercase text-[var(--text-dim)]">Official Club</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Redesigned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="stadium-card max-w-md w-full border border-electric/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <header className="mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Create New Squad</h2>
              <p className="text-[var(--text-dim)] font-bold uppercase text-[10px] tracking-widest">Initialize Official Roster</p>
            </header>
            
            <div className="mb-10">
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">Team Name</label>
              <input 
                type="text" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Gotham City Knights"
                className="w-full bg-[var(--bg-container-low)] border border-[var(--border-ghost)] rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:border-electric transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 bg-[var(--bg-container-low)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-container-highest)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTeam}
                disabled={isCreating || !newTeamName}
                className="flex-[2] py-4 bg-electric text-[#00373a] rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-50 transition-all"
              >
                {isCreating ? 'Initializing...' : 'Confirm Squad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TeamsPage;
