/* eslint-disable */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Loader from '@/components/Loader';
import Button from '@/components/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
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
  const totalInputTokens = summary?.totalInputTokens || 0;
  const totalOutputTokens = summary?.totalOutputTokens || 0;
  const totalVideoMinutes = Math.round((summary?.totalVideoSeconds || 0) / 60);
  const pricing = summary?.pricing || { inputPricePer1M: 0.50, outputPricePer1M: 3.00, model: 'gemini-3-flash-preview' };
  const inputPricePerToken = pricing.inputPricePer1M / 1000000;
  const outputPricePerToken = pricing.outputPricePer1M / 1000000;
  const estimatedCost = (totalInputTokens * inputPricePerToken) + (totalOutputTokens * outputPricePerToken);

  if (summaryLoading || dailyLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader size="large" />
    </div>
  );

  return (
    <div className="pb-16 flex flex-col gap-10 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">
              RESOURCE MONITOR
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-tx-primary">AI Usage & Credits</h1>
          <p className="text-xs text-tx-secondary font-medium uppercase tracking-widest">Tracking tokens and processing throughput</p>
        </div>
        
        <div className="flex items-center gap-2 bg-surface border border-border-main p-1 rounded-md">
           {['7d', '30d', '90d'].map(p => (
             <button 
               key={p}
               onClick={() => setPeriod(p)}
               className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${period === p ? 'bg-accent text-white' : 'text-tx-secondary hover:text-tx-primary'}`}
             >
               {p}
             </button>
           ))}
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="utility-card p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-tx-dim opacity-60">
               <Zap size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Total Tokens</span>
            </div>
            <div className="text-3xl font-black text-tx-primary mono-stat">{totalTokens.toLocaleString()}</div>
            <p className="text-[9px] text-tx-secondary uppercase tracking-tighter">Consumption for current period</p>
         </div>

         <div className="utility-card p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-tx-dim opacity-60">
               <Video size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Video Processed</span>
            </div>
            <div className="text-3xl font-black text-tx-primary mono-stat">{totalVideoMinutes}m</div>
            <p className="text-[9px] text-tx-secondary uppercase tracking-tighter">Total analysis duration</p>
         </div>

         <div className="utility-card p-6 flex flex-col gap-2 border-l-2 border-accent">
            <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2 text-accent">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Estimated Value</span>
               </div>
               <div title="Based on standard token pricing">
                  <Info size={12} className="text-tx-dim opacity-40 cursor-help" />
               </div>
            </div>
            <div className="text-3xl font-black text-tx-primary mono-stat">${estimatedCost.toFixed(4)}</div>
            <p className="text-[9px] text-tx-secondary uppercase tracking-tighter">Est. cost ({pricing.model}: ${pricing.inputPricePer1M}/${pricing.outputPricePer1M} $/1M I/O)</p>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8">
         <section className="bg-surface border border-border-main rounded-md p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Daily Token Consumption</h3>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-accent" />
                     <span className="text-[9px] font-bold uppercase text-tx-secondary">Gemini 3 Flash</span>
                  </div>
               </div>
            </div>
            <div className="h-[300px] w-full">
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
         </section>

         <section className="bg-surface border border-border-main rounded-md p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">Video Throughput (Seconds)</h3>
            </div>
            <div className="h-[200px] w-full">
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
         </section>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
         <section className="flex-1 bg-surface border border-border-main rounded-md p-6">
            <h3 className="text-[10px] font-bold text-tx-dim uppercase tracking-widest mb-6">Usage Policies</h3>
            <div className="space-y-4">
               {[
                  { label: 'Input Rate', val: `$${pricing.inputPricePer1M.toFixed(2)} / 1M Tokens` },
                  { label: 'Output Rate', val: `$${pricing.outputPricePer1M.toFixed(2)} / 1M Tokens` },
                  { label: 'Video Cap', val: '120 Minutes / Job' }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center pb-4 border-b border-border-main last:border-0 last:pb-0">
                   <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-tight">{item.label}</span>
                   <span className="text-[10px] font-black text-tx-primary uppercase tracking-tight">{item.val}</span>
                 </div>
               ))}
            </div>
         </section>

         <section className="flex-1 utility-card p-6 border-l-2 border-warning bg-warning/5">
            <h3 className="text-[10px] font-bold text-warning uppercase tracking-widest mb-4">Optimization Advisory</h3>
            <p className="text-[11px] text-tx-secondary font-medium leading-relaxed mb-4">
              Your token consumption is currently within optimal parameters. Using <span className="text-tx-primary font-bold">JERSEY_COLORS</span> identity mode instead of <span className="text-tx-primary font-bold">INTERACTION_BASED</span> can reduce token usage by up to 15% for multi-turn sessions.
            </p>
            <Button variant="outline" size="sm" className="w-full">View Optimization Guide</Button>
         </section>
      </div>
    </div>
  );
};

export default UsageDashboard;
