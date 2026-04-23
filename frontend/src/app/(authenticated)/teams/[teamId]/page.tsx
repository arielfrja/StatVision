'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@/app/user-provider';
import Loader from '@/components/Loader';
import ClientOnlyWrapper from '@/components/ClientOnlyWrapper';
import { useParams, useRouter } from 'next/navigation';
import { PlayerTeamHistory } from '@/types/player';
import { Team } from '@/types/team';
import axios from 'axios';

interface RosterPlayer extends Omit<PlayerTeamHistory, 'player'> {
    player: {
        id: string;
        name: string;
    };
}

function TeamPlayersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number | '' >('');
  const [newPlayerDescription, setNewPlayerDescription] = useState('');

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const [teamRes, playersRes] = await Promise.all([
        axios.get(`http://localhost:3000/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:3000/teams/${teamId}/players`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, getAccessTokenSilently]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const handleCreatePlayer = async () => {
    if (!teamId || !newPlayerName) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`http://localhost:3000/teams/${teamId}/players`, { 
        name: newPlayerName, 
        jerseyNumber: newPlayerJersey || null,
        description: newPlayerDescription || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setNewPlayerName('');
      setNewPlayerJersey('');
      setNewPlayerDescription('');
      fetchTeamDetails();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Remove this player from the roster?')) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`http://localhost:3000/teams/${teamId}/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeamDetails();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader />
    </div>
  );

  if (!team) return <div className="p-8 text-center uppercase font-black tracking-tighter text-2xl">Squad Not Found</div>;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Editorial Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => router.push('/teams')} className="text-electric font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Squads
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-electric flex items-center justify-center text-[#00373a] shadow-[0_0_20px_var(--primary-glow)]">
              <span className="material-symbols-outlined font-bold text-2xl">shield</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">{team.name}</h1>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-electric hover:text-[#00373a] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm font-bold">person_add</span>
          Recruit Player
        </button>
      </header>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Active Roster */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8 border-b border-[var(--border-ghost)] pb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">Active Roster ({players.length})</h2>
            <div className="flex gap-4 text-[10px] font-bold text-[var(--text-dim)] uppercase">
              <span>Jersey</span>
              <span className="w-24 text-center">Actions</span>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="stadium-card py-20 text-center border-dashed border-2 border-[var(--border-ghost)] bg-transparent">
              <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest">No players recruited yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {players.map((p) => (
                <div key={p.id} className="stadium-card group flex items-center justify-between py-4 hover:border-electric/20">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-container-low)] flex items-center justify-center border-2 border-[var(--bg-container-highest)] overflow-hidden">
                      <span className="material-symbols-outlined text-[var(--text-dim)] group-hover:scale-110 transition-transform">person</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic tracking-tight uppercase group-hover:text-electric transition-colors">{p.player.name}</h3>
                      <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{p.description || 'Active Prospect'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                    <span className="text-2xl font-black italic tracking-tighter mono-stat text-electric/40 group-hover:text-electric transition-colors w-12 text-center">
                      {p.jerseyNumber ? `#${p.jerseyNumber}` : '--'}
                    </span>
                    <div className="flex gap-2 w-24 justify-end">
                      <button className="w-10 h-10 rounded-lg bg-[var(--bg-container-low)] flex items-center justify-center hover:text-electric transition-colors border border-[var(--border-ghost)]">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeletePlayer(p.playerId)}
                        className="w-10 h-10 rounded-lg bg-[var(--bg-container-low)] flex items-center justify-center hover:text-red-400 transition-colors border border-[var(--border-ghost)]"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Tactical Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="stadium-card border-l-4 border-[var(--accent-gold)]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-dim)] mb-6">Squad Archetype</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center text-[var(--accent-gold)]">
                <span className="material-symbols-outlined font-bold">bolt</span>
              </div>
              <div>
                <h4 className="font-black italic tracking-tight uppercase">High-Tempo Offense</h4>
                <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Team Synergy Rating: 88</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "This squad excels in transition. Statistics show a 14% increase in efficiency when utilizing early-clock shot opportunities."
            </p>
          </section>

          <section className="stadium-card bg-gradient-to-br from-[var(--bg-container)] to-[var(--bg-container-low)]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-dim)] mb-6">Season Leaders</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: 'PTS', name: 'Player #23', val: '24.5' },
                { label: 'REB', name: 'Player #11', val: '10.2' },
                { label: 'AST', name: 'Player #02', val: '8.4' },
              ].map((lead, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[var(--border-ghost)] pb-3 last:border-0">
                  <div>
                    <p className="text-[8px] font-black uppercase text-electric tracking-widest">{lead.label} LEADER</p>
                    <p className="text-sm font-bold uppercase">{lead.name}</p>
                  </div>
                  <span className="text-xl font-black italic mono-stat">{lead.val}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Recruit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="stadium-card max-w-lg w-full border border-electric/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <header className="mb-8">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Recruit Player</h2>
              <p className="text-[var(--text-dim)] font-bold uppercase text-[10px] tracking-widest">Adding to {team.name} Roster</p>
            </header>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">Full Name</label>
                <input 
                  type="text" 
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g. Marcus Smart"
                  className="w-full bg-[var(--bg-container-low)] border border-[var(--border-ghost)] rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:border-electric transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">Jersey #</label>
                  <input 
                    type="number" 
                    value={newPlayerJersey}
                    onChange={(e) => setNewPlayerJersey(Number(e.target.value))}
                    placeholder="00"
                    className="w-full bg-[var(--bg-container-low)] border border-[var(--border-ghost)] rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:border-electric transition-colors text-center mono-stat"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">Description / Role</label>
                  <input 
                    type="text" 
                    value={newPlayerDescription}
                    onChange={(e) => setNewPlayerDescription(e.target.value)}
                    placeholder="e.g. Defensive Anchor"
                    className="w-full bg-[var(--bg-container-low)] border border-[var(--border-ghost)] rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:border-electric transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 bg-[var(--bg-container-low)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-container-highest)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePlayer}
                disabled={!newPlayerName}
                className="flex-[2] py-4 bg-electric text-[#00373a] rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-50 transition-all"
              >
                Recruit Player
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TeamPlayersPageWrapper() {
  return (
    <ClientOnlyWrapper>
      <TeamPlayersPage />
    </ClientOnlyWrapper>
  );
}
