import React from 'react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
      <div className="w-20 h-20 rounded-full bg-surface-high border border-border-main flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-4xl text-tx-dim">error_outline</span>
      </div>
      <h1 className="text-3xl font-bold text-tx-primary mb-2 uppercase tracking-tight">Resource Not Found</h1>
      <p className="text-sm text-tx-secondary mb-10 max-w-xs mx-auto font-medium">The analytical data or segment you requested does not exist or has been archived.</p>
      <a href="/dashboard" className="px-6 py-3 bg-accent text-white rounded-md font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
        Return to Dashboard
      </a>
    </div>
  );
}
