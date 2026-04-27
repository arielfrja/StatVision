'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ParkSetupPage = () => {
  const router = useRouter();
  const [homeColor, setHomeColor] = useState('Blue');
  const [awayColor, setAwayColor] = useState('Red');
  const [homePlayers, setHomePlayers] = useState(['#--']);
  const [awayPlayers, setAwayPlayers] = useState(['#--']);

  const colors = [
    { name: 'Blue', hex: '#00F3FF' },
    { name: 'Red', hex: '#FF004D' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#1A1C1E' },
    { name: 'Neon', hex: '#CCFF00' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-16 min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter mb-2">QUICK START</h1>
        <p className="text-tx-dim font-bold uppercase text-xs tracking-widest">Park Mode • Temporary Teams</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Home Team Card */}
        <section className="stadium-card border-t-4" style={{ borderColor: colors.find(c => c.name === homeColor)?.hex }}>
          <h2 className="text-xl font-bold mb-6 flex items-center justify-between uppercase">
            Team Alpha
            <span className="text-[10px] text-tx-dim">Home</span>
          </h2>
          
          <p className="text-[10px] font-bold text-tx-dim uppercase mb-3">Identify Color</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setHomeColor(c.name)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  homeColor === c.name ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-40 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex, borderColor: homeColor === c.name ? 'white' : 'transparent' }}
              />
            ))}
          </div>

          <p className="text-[10px] font-bold text-tx-dim uppercase mb-3">Roster (Jersey #)</p>
          <div className="grid grid-cols-4 gap-2">
            {homePlayers.map((p, i) => (
              <div key={i} className="bg-container-low rounded-lg py-3 text-center mono-stat font-bold text-sm border border-bd-ghost">
                {p}
              </div>
            ))}
            <button className="bg-container-highest rounded-lg py-3 text-center border border-dashed border-bd-ghost text-tx-dim hover:text-white transition-colors">
              +
            </button>
          </div>
        </section>

        {/* Away Team Card */}
        <section className="stadium-card border-t-4" style={{ borderColor: colors.find(c => c.name === awayColor)?.hex }}>
          <h2 className="text-xl font-bold mb-6 flex items-center justify-between uppercase">
            Team Bravo
            <span className="text-[10px] text-tx-dim">Away</span>
          </h2>

          <p className="text-[10px] font-bold text-tx-dim uppercase mb-3">Identify Color</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setAwayColor(c.name)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  awayColor === c.name ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-40 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex, borderColor: awayColor === c.name ? 'white' : 'transparent' }}
              />
            ))}
          </div>

          <p className="text-[10px] font-bold text-tx-dim uppercase mb-3">Roster (Jersey #)</p>
          <div className="grid grid-cols-4 gap-2">
            {awayPlayers.map((p, i) => (
              <div key={i} className="bg-container-low rounded-lg py-3 text-center mono-stat font-bold text-sm border border-bd-ghost">
                {p}
              </div>
            ))}
            <button className="bg-container-highest rounded-lg py-3 text-center border border-dashed border-bd-ghost text-tx-dim hover:text-white transition-colors">
              +
            </button>
          </div>
        </section>
      </div>

      <div className="stadium-card frosted-glass mb-12 p-8 border-dashed border-2 border-bd-ghost flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-electric transition-colors">
        <span className="material-symbols-outlined text-5xl text-tx-dim group-hover:text-electric transition-colors">cloud_upload</span>
        <div className="text-center">
          <h3 className="font-bold uppercase tracking-tight">Drop Game Tape</h3>
          <p className="text-xs text-tx-dim font-semibold uppercase tracking-widest mt-1">MP4 • 4K/60FPS Recommended</p>
        </div>
      </div>

      <button 
        onClick={() => router.push('/dashboard')}
        className="w-full bg-gradient-to-r from-electric to-[#0052FF] py-6 rounded-2xl text-xl font-black italic tracking-tighter uppercase shadow-[0_10px_30px_rgba(0,82,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Start Analysis Run
      </button>
    </div>
  );
};

export default ParkSetupPage;
