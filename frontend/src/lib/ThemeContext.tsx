'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'light' as ThemeMode, effectiveTheme: 'light' as const, setTheme: () => {} };
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('statvision-theme') as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const update = () => {
      let effective: 'light' | 'dark';
      if (theme === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effective = theme;
      }
      setEffectiveTheme(effective);
      document.documentElement.setAttribute('data-theme', effective);
    };

    update();
    localStorage.setItem('statvision-theme', theme);

    let mql: MediaQueryList | null = null;
    if (theme === 'system') {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', update);
    }

    return () => mql?.removeEventListener('change', update);
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
