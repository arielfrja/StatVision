'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    eruda?: {
      init: () => void;
    };
  }
}

export default function ErudaInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !window.eruda) {
      const script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/eruda';
      script.onload = () => {
        if (window.eruda) {
          window.eruda.init();
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return null;
}