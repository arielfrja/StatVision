'use client';

import React from 'react';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/outlined-card.js';
import { useTheme } from '@/lib/ThemeContext';

const themes = [
  { value: 'light' as const, icon: 'light_mode', label: 'Light' },
  { value: 'dark' as const, icon: 'dark_mode', label: 'Dark' },
  { value: 'system' as const, icon: 'settings_brightness', label: 'System' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: 'var(--md-sys-color-primary)',
          }} />
          <span style={{
            fontSize: '10px', fontWeight: 700,
            color: 'var(--md-sys-color-on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            PREFERENCES
          </span>
        </div>
        <h1 style={{
          fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--md-sys-color-on-surface)', margin: 0,
        }}>
          Settings
        </h1>
        <p style={{
          fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)',
          fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>
          Personalize your experience
        </p>
      </header>

      <md-outlined-card>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{
            fontSize: '10px', fontWeight: 700,
            color: 'var(--md-sys-color-on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Appearance
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{
              fontSize: '10px', fontWeight: 700,
              color: 'var(--md-sys-color-on-surface-variant)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Theme Mode
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid',
                    borderColor: theme === t.value
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline-variant)',
                    backgroundColor: theme === t.value
                      ? 'var(--md-sys-color-primary-container)'
                      : 'transparent',
                    color: theme === t.value
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <md-icon style={{ fontSize: '18px' }}>{t.icon}</md-icon>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </md-outlined-card>

      <md-outlined-card>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{
            fontSize: '10px', fontWeight: 700,
            color: 'var(--md-sys-color-on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Account
          </h2>
          <p style={{
            fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 500, margin: 0,
          }}>
            Account management and profile settings will appear here.
          </p>
        </div>
      </md-outlined-card>

      <md-outlined-card>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{
            fontSize: '10px', fontWeight: 700,
            color: 'var(--md-sys-color-on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Notifications
          </h2>
          <p style={{
            fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 500, margin: 0,
          }}>
            Notification and alert preferences will appear here.
          </p>
        </div>
      </md-outlined-card>
    </div>
  );
}
