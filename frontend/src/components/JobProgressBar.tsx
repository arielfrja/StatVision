import React from "react";
import { useJobProgress } from "../hooks/useJobProgress";

interface JobProgressBarProps {
  jobId?: string;
  gameId?: string;
}

export const JobProgressBar: React.FC<JobProgressBarProps> = ({ jobId, gameId }) => {
  const { progress, isConnected } = useJobProgress(jobId, gameId);

  if (!progress) {
    return (
      <div className="flex flex-col gap-2 w-full p-4 bg-surface-variant rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Waiting for progress...</span>
          <span className="text-xs text-secondary">{isConnected ? "Connected" : "Connecting..."}</span>
        </div>
        <div className="h-2 w-full bg-outline-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full p-4 bg-surface-variant rounded-lg border border-outline-variant">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-primary">{progress.currentPhase}</span>
          <span className="text-xs text-secondary">{progress.details}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{progress.progress}%</span>
          {progress.progress === 100 && (
            <span className="text-success text-xs font-bold uppercase">Complete</span>
          )}
        </div>
      </div>
      <div className="h-2 w-full bg-outline-variant rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out" 
          style={{ width: `${progress.progress}%` }}
        ></div>
      </div>
    </div>
  );
};
