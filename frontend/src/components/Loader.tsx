/* eslint-disable */
import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  light?: boolean;
  label?: string;
}

export default function Loader({ size = 'medium', light = false, label = 'Analyzing Performance' }: LoaderProps) {
  const sizeClass = size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-16 h-16' : 'w-10 h-10';
  const colorClass = light ? 'border-white/20 border-t-white' : 'border-electric/20 border-t-electric';
  const labelSize = size === 'small' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12 transition-all duration-500 opacity-100 scale-100">
      <div className={`relative ${sizeClass}`}>
        {/* Outer Glow */}
        <div className={`absolute -inset-4 rounded-full blur-2xl opacity-20 ${light ? 'bg-white' : 'bg-electric'}`}></div>
        
        {/* Orbit Ring */}
        <div className={`absolute inset-0 rounded-full border-[3px] border-transparent border-t-electric animate-[spin_0.8s_linear_infinite] z-10`}></div>
        
        {/* Track Ring */}
        <div className={`absolute inset-0 rounded-full border-[3px] ${light ? 'border-white/10' : 'border-white/5'}`}></div>
        
        {/* Center Pulse */}
        <div className={`absolute inset-[30%] rounded-full ${light ? 'bg-white/40' : 'bg-electric/40'} animate-pulse`}></div>
      </div>
      
      {size !== 'small' && (
        <div className="flex flex-col items-center gap-1">
          <p className={`${labelSize} font-black uppercase tracking-[0.4em] ${light ? 'text-white' : 'text-electric'} drop-shadow-[0_0_8px_rgba(0,243,255,0.3)]`}>
            {label}
          </p>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 rounded-full bg-current animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
}
