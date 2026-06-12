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
      <div className="flex flex-col gap-2 w-full p-4 bg-surface-high border border-border-main rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-tx-secondary">Awaiting Engine...</span>
          <span className="text-[10px] text-tx-dim">{isConnected ? "FIREBASE: ACTIVE" : "FIREBASE: CONNECTING..."}</span>
        </div>
        {/* @ts-ignore */}
        <md-linear-progress indeterminate style={{ '--md-linear-progress-track-height': '2px' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full p-4 bg-surface border border-border-main rounded-md">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">{progress.status}</span>
          <span className="text-xs text-tx-secondary font-medium">{progress.details}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-mono font-bold text-tx-primary">{progress.progress}%</span>
          {progress.progress === 100 && (
            <span className="text-success text-[10px] font-bold uppercase tracking-tight">Verified</span>
          )}
        </div>
      </div>
      {/* @ts-ignore */}
      <md-linear-progress 
        value={progress.progress / 100} 
        style={{ 
            '--md-linear-progress-track-height': '4px',
            '--md-sys-color-primary': 'var(--accent)' 
        }} 
      />
    </div>
  );
};
