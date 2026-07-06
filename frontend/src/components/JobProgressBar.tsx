import React from "react";
import { useJobProgress } from "../hooks/useJobProgress";
import '@material/web/progress/linear-progress.js';

interface JobProgressBarProps {
  jobId?: string;
  gameId?: string;
}

export const JobProgressBar: React.FC<JobProgressBarProps> = ({ jobId, gameId }) => {
  const { progress, isConnected } = useJobProgress(jobId, gameId);

  if (!progress) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        padding: '16px',
        background: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}>Awaiting Engine...</span>
          <span style={{
            fontSize: '10px',
            color: 'var(--md-sys-color-on-surface-variant)',
            opacity: 0.7,
          }}>{isConnected ? "FIREBASE: ACTIVE" : "FIREBASE: CONNECTING..."}</span>
        </div>
        {/* @ts-ignore */}
        <md-linear-progress indeterminate style={{ '--md-linear-progress-track-height': '2px' }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      padding: '16px',
      background: 'var(--md-sys-color-surface)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      borderRadius: '8px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--md-sys-color-primary)',
          }}>{progress.status}</span>
          <span style={{
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 500,
          }}>{progress.details}</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
          <span style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'var(--md-sys-color-on-surface)',
          }}>{progress.progress}%</span>
          {progress.progress === 100 && (
            <span style={{
              color: 'var(--md-sys-color-tertiary)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
            }}>Verified</span>
          )}
        </div>
      </div>
      {/* @ts-ignore */}
      <md-linear-progress
        value={progress.progress / 100}
        style={{ '--md-linear-progress-track-height': '4px' }}
      />
    </div>
  );
};
