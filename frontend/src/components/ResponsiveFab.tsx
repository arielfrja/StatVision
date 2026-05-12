'use client';

import React, { useState, useEffect } from 'react';
import '@material/web/fab/fab.js';
import '@material/web/icon/icon.js';

interface ResponsiveFabProps {
  label: string;
  icon: string;
  onClick: () => void;
  style?: React.CSSProperties;
}

const ResponsiveFab: React.FC<ResponsiveFabProps> = ({ label, icon, onClick, style }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50 flex items-center justify-center gap-2
        bg-electric text-[#00373a] font-black uppercase tracking-widest
        shadow-[0_0_30px_rgba(0,243,255,0.3)] hover:shadow-[0_0_40px_rgba(0,243,255,0.5)]
        hover:brightness-110 active:scale-95 transition-all duration-300
        focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4
        ${isMobile ? 'bottom-[calc(1rem+64px)] right-4 p-4 rounded-full' : 'bottom-8 right-8 px-6 py-4 rounded-2xl'}
      `}
      style={style}
    >
      <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
      {!isMobile && <span className="text-sm">{label}</span>}
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
    </button>
  );
};

export default ResponsiveFab;
