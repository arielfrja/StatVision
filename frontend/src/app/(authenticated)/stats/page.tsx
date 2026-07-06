'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import '@material/web/progress/circular-progress.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/elevated-card.js';
import { Game } from '@/types/game';
import '@material/web/button/filled-button.js';

const StatsDashboardPage = () => {
  const { data: games, isLoading } = useSWR<Game[]>('/games');
  const [timeframe, setTimeframe] = useState('Season');

  if (isLoading) return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0'}}>
        <md-circular-progress indeterminate></md-circular-progress>
        <span style={{color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', fontWeight: 500}}>Synchronizing Analytics</span>
      </div>
    </div>
  );

  const hasData = games && games.length > 0;

  if (!hasData) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '0 24px'}}>
        <div style={{position: 'relative', marginBottom: '32px'}}>
            <div style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'var(--md-sys-color-primary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%'}}></div>
            <md-icon style={{fontSize: '72px', color: 'var(--md-sys-color-on-surface-variant)', position: 'relative', zIndex: 10}}>analytics</md-icon>
        </div>
         <h1 style={{fontSize: '30px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)', margin: 0, marginBottom: '16px'}}>Elite Analytics Locked</h1>
        <p style={{color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, maxWidth: '448px', margin: '0 auto', lineHeight: 1.625, marginBottom: '40px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em'}}>
            Upload and analyze your first game recording to unlock the high-performance intelligence engine and spatial tracking.
        </p>
        <Link href="/games">
            <md-filled-button>
                <md-icon slot="icon">cloud_upload</md-icon>
                Initialize First Stream
            </md-filled-button>
        </Link>
      </div>
    );
  }

  const engineStateColor = (state: string): string => {
    if (state === 'Active') return 'var(--md-sys-color-primary)';
    if (state === 'Aggregating') return 'var(--md-sys-color-secondary)';
    return 'var(--md-sys-color-tertiary)';
  };

  return (
    <div style={{paddingBottom: '64px'}}>
      {/* Editorial Header */}
      <header style={{marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '24px', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '32px'}}>
        <div>
          <h1 style={{fontSize: '36px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface)', margin: 0, marginBottom: '8px'}}>Performance Intelligence</h1>
          <p style={{color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
            <span style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary)', boxShadow: '0 0 8px var(--md-sys-color-primary)', display: 'inline-block'}} />
            Active Aggregation • {timeframe}
          </p>
        </div>
        <div style={{display: 'flex', backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: '4px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', alignSelf: 'flex-start'}}>
          {['Game', 'Season', 'All-Time'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              style={timeframe === t 
                ? {display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 32px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: '120px', backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-primary)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', border: '1px solid var(--md-sys-color-outline)', cursor: 'pointer'}
                : {display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 32px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: '120px', backgroundColor: 'transparent', color: 'var(--md-sys-color-on-surface-variant)', border: '1px solid transparent', cursor: 'pointer'}
              }
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '32px'}}>
        {/* Main Content: Box Scores Summary */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
          <md-elevated-card style={{padding: '24px', width: '100%', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
                <div>
                    <h2 style={{fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)', margin: 0}}>Aggregated Efficiency</h2>
                    <p style={{fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginTop: '4px'}}>Cross-Game Performance Distribution</p>
                </div>
            </div>
            
            <div style={{padding: '80px 0', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', border: '1px dashed var(--md-sys-color-outline-variant)'}}>
                <md-icon style={{fontSize: '36px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', opacity: 0.5}}>query_stats</md-icon>
                <p style={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, margin: 0}}>AI Aggregation in Progress</p>
                <p style={{fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, margin: '8px auto 0', maxWidth: '320px'}}>
                    Advanced distribution charts will unlock once 3+ games are fully analyzed.
                </p>
            </div>
          </md-elevated-card>
        </div>

        {/* Sidebar: System Readiness */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
           <md-elevated-card style={{padding: '24px', width: '100%', boxSizing: 'border-box', borderLeft: '4px solid color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent)'}}>
                <h3 style={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, margin: 0, marginBottom: '24px'}}>Engine Readiness</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                    {[
                        { label: 'Spatial Engine', state: 'Active' },
                        { label: 'Tactical Narrative', state: 'Aggregating' },
                        { label: 'Efficiency Pulse', state: 'Synced' },
                    ].map((engine, i) => (
                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)'}}>{engine.label}</span>
                            <span style={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em', color: engineStateColor(engine.state)}}>{engine.state}</span>
                        </div>
                    ))}
                </div>
           </md-elevated-card>

           <md-elevated-card style={{padding: '24px', width: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', top: 0, right: 0, width: '128px', height: '128px', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)', filter: 'blur(64px)', marginRight: '-64px', marginTop: '-64px'}}></div>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 10}}>
                    <div style={{width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)', border: '1px solid var(--md-sys-color-outline-variant)'}}>
                        <md-icon style={{fontSize: '24px'}}>auto_awesome</md-icon>
                    </div>
                    <div>
                        <h4 style={{fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface)', margin: 0}}>AI Scout</h4>
                        <p style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, margin: 0}}>Status: Vigilant</p>
                    </div>
                </div>
                <p style={{fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.625, fontStyle: 'italic', fontWeight: 500, margin: 0, position: 'relative', zIndex: 10}}>
                    &ldquo;Analyzing {games.length} active records. I am looking for play patterns and defensive inconsistencies across your lineup.&rdquo;
                </p>
           </md-elevated-card>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboardPage;
