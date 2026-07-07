/* eslint-disable */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import '@material/web/progress/circular-progress.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/outlined-card.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import '@material/web/button/outlined-button.js';
import { Info, Zap, Video, Clock } from 'lucide-react';

const UsageDashboard = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const dateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (period === '7d') start.setDate(end.getDate() - 7);
    else if (period === '30d') start.setDate(end.getDate() - 30);
    else if (period === '90d') start.setDate(end.getDate() - 90);
    else if (period === 'custom' && customRange.start && customRange.end) {
       return { start: customRange.start, end: customRange.end };
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [period, customRange]);

  const { data: summary, isLoading: summaryLoading } = useSWR(`/usage/summary?start=${dateRange.start}&end=${dateRange.end}`);
  const { data: daily, isLoading: dailyLoading } = useSWR(`/usage/daily?start=${dateRange.start}&end=${dateRange.end}`);

  const chartData = useMemo(() => {
    if (!daily) return [];
    
    // Group by date
    const grouped: any = {};
    daily.forEach((item: any) => {
      const date = item.date;
      if (!grouped[date]) grouped[date] = { date, tokens: 0, videoSeconds: 0 };
      if (item.type === 'TOKEN') grouped[date].tokens += Number(item.total);
      if (item.type === 'VIDEO_SECONDS') grouped[date].videoSeconds += Number(item.total);
    });

    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [daily]);

  const totalTokens = summary?.totalTokens || 0;
  const totalVideoMinutes = Math.round((summary?.totalVideoSeconds || 0) / 60);

  if (summaryLoading || dailyLoading) return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh'}}>
      <md-circular-progress indeterminate></md-circular-progress>
    </div>
  );

  return (
    <div style={{paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '40px'}}>
      
      {/* Header Section */}
      <header style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
            <div style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary)'}} />
            <span style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em'}}>
              RESOURCE MONITOR
            </span>
          </div>
          <h1 style={{fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)', margin: 0}}>AI Usage & Credits</h1>
          <p style={{fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0}}>Tracking tokens and processing throughput</p>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', padding: '4px', borderRadius: '6px', alignSelf: 'flex-start'}}>
           {['7d', '30d', '90d'].map(p => (
             <button 
               key={p}
               onClick={() => setPeriod(p)}
               style={period === p 
                 ? {padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px', backgroundColor: 'var(--md-sys-color-primary)', color: '#fff', border: 'none', cursor: 'pointer'} 
                 : {padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px', backgroundColor: 'transparent', color: 'var(--md-sys-color-on-surface-variant)', border: 'none', cursor: 'pointer'}
               }
             >
               {p}
             </button>
           ))}
        </div>
      </header>

      {/* Stats Overview */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px'}}>
         <div style={{backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6}}>
               <Zap size={14} style={{color: 'var(--md-sys-color-on-surface-variant)'}} />
               <span style={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em'}}>Total Tokens</span>
            </div>
            <div style={{fontSize: '30px', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', fontFamily: 'monospace'}}>{totalTokens.toLocaleString()}</div>
            <p style={{fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0}}>Consumption for current period</p>
         </div>

         <div style={{backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6}}>
               <Video size={14} style={{color: 'var(--md-sys-color-on-surface-variant)'}} />
               <span style={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em'}}>Video Processed</span>
            </div>
            <div style={{fontSize: '30px', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', fontFamily: 'monospace'}}>{totalVideoMinutes}m</div>
            <p style={{fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0}}>Total analysis duration</p>
         </div>

         <div style={{backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--md-sys-color-primary)'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-primary)'}}>
                  <Clock size={14} />
                  <span style={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em'}}>Estimated Value</span>
               </div>
               <div title="Based on standard token pricing">
                  <Info size={12} style={{color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.4, cursor: 'help'}} />
               </div>
            </div>
            <div style={{fontSize: '30px', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', fontFamily: 'monospace'}}>${(totalTokens * 0.000000125).toFixed(2)}</div>
            <p style={{fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0}}>Projected cost estimate</p>
         </div>
      </div>

      {/* Charts Section */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '32px'}}>
         <md-outlined-card>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px'}}>
               <h3 style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0}}>Daily Token Consumption</h3>
               <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary)'}} />
                     <span style={{fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)'}}>Gemini 3 Flash</span>
                  </div>
               </div>
            </div>
            <div style={{height: '300px', width: '100%'}}>
               {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <defs>
                           <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                           dataKey="date" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 700, fill: '#9ca3af'}}
                           tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 700, fill: '#9ca3af'}}
                           tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val}
                        />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}
                           labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                           labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        />
                        <Area type="monotone" dataKey="tokens" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                     </AreaChart>
                  </ResponsiveContainer>
               )}
            </div>
         </md-outlined-card>

         <md-outlined-card>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px'}}>
               <h3 style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0}}>Video Throughput (Seconds)</h3>
            </div>
            <div style={{height: '200px', width: '100%'}}>
               {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                           dataKey="date" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 700, fill: '#9ca3af'}}
                           tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 700, fill: '#9ca3af'}}
                        />
                        <Tooltip 
                           cursor={{fill: 'rgba(37, 99, 235, 0.05)'}}
                           contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}
                           labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        />
                        <Bar dataKey="videoSeconds" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </md-outlined-card>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
         <section style={{flex: '1', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', padding: '24px'}}>
             <h3 style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginBottom: '24px'}}>Usage Policies</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
               {[
                 { label: 'Standard Rate', val: '0.000125 / 1k Tokens' },
                 { label: 'Quota Limit', val: '500,000 Tokens / Day' },
                 { label: 'Video Cap', val: '120 Minutes / Job' }
               ].map((item, i) => (
                 <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: i < 2 ? '1px solid var(--md-sys-color-outline-variant)' : 'none'}}>
                   <span style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '-0.01em'}}>{item.label}</span>
                   <span style={{fontSize: '10px', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', textTransform: 'uppercase', letterSpacing: '-0.01em'}}>{item.val}</span>
                 </div>
               ))}
            </div>
         </section>

         <section style={{flex: '1', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', padding: '24px', borderLeft: '2px solid var(--md-sys-color-secondary)'}}>
            <h3 style={{fontSize: '10px', fontWeight: 700, color: 'var(--md-sys-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginBottom: '16px'}}>Optimization Advisory</h3>
            <p style={{fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500, lineHeight: 1.625, margin: 0, marginBottom: '16px'}}>
              Your token consumption is currently within optimal parameters. Using <span style={{color: 'var(--md-sys-color-on-surface)', fontWeight: 700}}>JERSEY_COLORS</span> identity mode instead of <span style={{color: 'var(--md-sys-color-on-surface)', fontWeight: 700}}>INTERACTION_BASED</span> can reduce token usage by up to 15% for multi-turn sessions.
            </p>
            <md-outlined-button>View Optimization Guide</md-outlined-button>
         </section>
      </div>
    </div>
  );
};

export default UsageDashboard;
