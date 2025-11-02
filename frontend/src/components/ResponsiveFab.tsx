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

    // Initial check after mounting to avoid hydration mismatch
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <md-fab
      {...(!isMobile && { label })}
      extended={!isMobile}
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: isMobile ? 'calc(var(--spacing-md) + 64px)' : 'var(--spacing-lg)',
        right: isMobile ? 'var(--spacing-md)' : 'var(--spacing-lg)',
        zIndex: 1000,
        ...style,
      }}
    >
      <md-icon slot="icon">{icon}</md-icon>
    </md-fab>
  );
};

export default ResponsiveFab;
