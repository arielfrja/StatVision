'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import '@material/web/progress/circular-progress.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/card/elevated-card.js';
import { Player } from '@/types/game';

const PlayerProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: player, isLoading } = useSWR<Player>(`/players/${params.playerId}`);
  const [activeTab, setActiveTab] = useState('highlights');

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <md-circular-progress indeterminate></md-circular-progress>
    </div>
  );

  if (!player) return (
    <div style={{ textAlign: 'center', paddingTop: '96px', paddingBottom: '96px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>Player Not Found</h1>
      <button
        onClick={() => router.back()}
        style={{
          color: 'var(--md-sys-color-primary)',
          marginTop: '16px',
          textTransform: 'uppercase',
          fontWeight: 900,
          fontSize: '10px',
          letterSpacing: '0.1em',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Return to Roster
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: '64px' }}>
      {/* Player Hero Section */}
      <md-elevated-card
        style={{
          position: 'relative',
          marginBottom: '48px',
          overflow: 'hidden',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        {/* Background Accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.05, pointerEvents: 'none' }}>
          <md-icon style={{ fontSize: '200px', color: 'var(--md-sys-color-on-surface)' }}>person</md-icon>
        </div>

        {/* Avatar + Badge */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: '4px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <md-icon style={{ fontSize: '72px', color: 'var(--md-sys-color-on-surface-variant)' }}>person</md-icon>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00373a',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
              border: '4px solid var(--md-sys-color-surface)',
            }}
          >
            <md-icon style={{ fontWeight: 900, fontSize: '24px' }}>grade</md-icon>
          </div>
        </div>

        {/* Player Info + Back Button */}
        <div style={{ textAlign: 'center', flex: 1, maxWidth: '600px' }}>
          <button
            onClick={() => router.back()}
            style={{
              color: 'var(--md-sys-color-primary)',
              fontWeight: 700,
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <md-icon style={{ fontSize: '14px' }}>arrow_back</md-icon>
            Back to Team
          </button>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                lineHeight: 1,
                color: 'var(--md-sys-color-on-surface)',
                margin: 0,
              }}
            >
              {player.name}
            </h1>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 900,
                fontStyle: 'italic',
                color: 'color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent)',
              }}
            >
              #{player.jerseyNumber}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            <span
              style={{
                padding: '4px 16px',
                paddingTop: '6px',
                paddingBottom: '6px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {player.position || 'Active Roster'}
            </span>
          </div>
        </div>

        {/* Status Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            borderLeft: '1px solid var(--md-sys-color-outline-variant)',
            paddingLeft: '40px',
            opacity: 0.5,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--md-sys-color-on-surface-variant)',
                letterSpacing: '0.1em',
                margin: 0,
                marginBottom: '4px',
              }}
            >
              Status
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-0.03em',
                color: 'var(--md-sys-color-on-surface)',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Active
            </p>
          </div>
        </div>
      </md-elevated-card>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
        }}
      >
        {/* Left: Content Area */}
        <div>
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              marginBottom: '32px',
            }}
          >
            {['highlights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  paddingBottom: '16px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'color 0.15s ease',
                  position: 'relative',
                  color:
                    activeTab === tab
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab}
                {activeTab === tab && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: 'var(--md-sys-color-primary)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'highlights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    margin: 0,
                  }}
                >
                  Intelligence Archives
                </h2>
              </div>

              <md-elevated-card
                style={{
                  paddingTop: '96px',
                  paddingBottom: '96px',
                  textAlign: 'center',
                  border: '2px dashed var(--md-sys-color-outline-variant)',
                  backgroundColor: 'transparent',
                }}
              >
                <md-icon
                  style={{
                    fontSize: '36px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                >
                  video_library
                </md-icon>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    lineHeight: 1.625,
                    margin: 0,
                  }}
                >
                  No analyzed game clips found for this player profile.
                  <br />
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>
                    Upload game footage to begin AI extraction.
                  </span>
                </p>
              </md-elevated-card>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <md-elevated-card
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderLeft: '4px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
              padding: '24px',
            }}
          >
            {/* Decorative glow blob */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '128px',
                height: '128px',
                background: 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)',
                filter: 'blur(24px)',
                marginRight: '-64px',
                marginTop: '-64px',
                transition: 'background 0.7s ease',
                pointerEvents: 'none',
              }}
            />

            <h3
              style={{
                fontSize: '10px',
                fontWeight: 900,
                color: 'var(--md-sys-color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                marginBottom: '16px',
                fontStyle: 'italic',
                position: 'relative',
                zIndex: 10,
                margin: 0,
                marginBottom: '16px',
              }}
            >
              AI Scout
            </h3>

            <div style={{ position: 'relative', zIndex: 10 }}>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  lineHeight: 1.625,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                &ldquo;I am monitoring this player&rsquo;s performance across recent games.
                Skill distribution and efficiency pulse will be generated as more events
                are recorded.&rdquo;
              </p>
            </div>
          </md-elevated-card>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
