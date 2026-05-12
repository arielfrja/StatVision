'use client';

import React, { useState, useRef } from 'react';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
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
      <Loader size="large" />
    </div>
  );

  return (
    <div className="pb-16">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-electric font-bold text-xs uppercase tracking-[0.2em] mb-1">Organization</p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Squad Management</h1>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          icon="add"
          size="md"
        >
          Create New Squad
        </Button>
      </header>

      {!teams || teams.length === 0 ? (
        <section className="stadium-card py-24 flex flex-col items-center justify-center text-center border-dashed border-2 border-bd-ghost bg-transparent">
          <div className="w-20 h-20 rounded-full bg-container-low flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-tx-dim">groups</span>
          </div>
          <h2 className="text-2xl font-bold uppercase mb-2">The Roster is Empty</h2>
          <p className="text-tx-secondary font-medium max-w-md mx-auto mb-10">Create your first team to begin building elite rosters and tracking performance.</p>
          <Button 
            onClick={() => setShowModal(true)}
            variant="secondary"
            size="lg"
          >
            Create Team
          </Button>
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${
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
              
              <div className="flex items-center gap-6 text-tx-secondary mb-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{team.players?.length || 0} Roster</span>
                </div>
                <div className="flex items-center gap-2 border-l border-bd-ghost pl-6">
                  <span className="material-symbols-outlined text-sm">event</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-bd-ghost">
                <span className="text-[10px] font-black uppercase text-electric opacity-0 group-hover:opacity-100 transition-opacity tracking-widest flex items-center gap-2">
                  Manage Roster
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
                {!team.isTemp && <span className="text-[10px] font-black uppercase text-tx-dim">Official Club</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Redesigned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="stadium-card max-w-md w-full border border-electric/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
            <header className="mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Create New Squad</h2>
              <p className="text-tx-dim font-bold uppercase text-[10px] tracking-widest">Initialize Official Roster</p>
            </header>
            
            <div className="mb-10">
              <label className="text-[10px] font-black uppercase text-tx-secondary tracking-widest mb-3 block">Team Name</label>
              <input 
                type="text" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Gotham City Knights"
                className="w-full bg-container-low border border-bd-ghost rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:border-electric transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setShowModal(false)}
                variant="ghost"
                fullWidth
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTeam}
                isLoading={isCreating}
                disabled={!newTeamName}
                fullWidth
                className="flex-[2]"
              >
                Confirm Squad
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
