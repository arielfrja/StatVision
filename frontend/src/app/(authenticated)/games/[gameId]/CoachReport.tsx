'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import { Game } from '@/types/game';
import { appLogger as logger } from '@/utils/Logger';

interface CoachReportProps {
    game: Game;
}

export const CoachReport: React.FC<CoachReportProps> = ({ game }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string>(game.homeTeamId || '');

    const generateReport = async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/games/${game.id}/coach-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: selectedTeamId })
            });

            if (!response.ok) throw new Error('Failed to generate report');
            
            const data = await response.json();
            setReport(data.report);
            
            // Log for audit
            logger.info('Coach report generated', { gameId: game.id, teamId: selectedTeamId });
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate AI Coach Report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-surface border border-border-main rounded-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-main pb-6">
                <div>
                    <h2 className="text-xl font-black text-tx-primary uppercase tracking-tight">AI Virtual Coach</h2>
                    <p className="text-xs text-tx-dim font-medium uppercase tracking-widest mt-1">Strategic Performance Insights</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedTeamId} 
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="bg-primary-bg border border-border-main text-tx-primary text-xs font-bold uppercase p-2 rounded focus:outline-none focus:border-accent"
                    >
                        <option value={game.homeTeamId || ''}>{game.homeTeam?.name || 'Home Team'}</option>
                        <option value={game.awayTeamId || ''}>{game.awayTeam?.name || 'Away Team'}</option>
                    </select>
                    
                    <Button 
                        onClick={generateReport} 
                        isLoading={loading}
                        icon="smart_toy"
                        variant="primary"
                    >
                        {report ? 'Regenerate Report' : 'Generate Report'}
                    </Button>
                </div>
            </div>

            {report ? (
                <div className="whitespace-pre-wrap text-tx-secondary text-sm leading-relaxed coach-report-content">
                    {report}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-accent text-3xl">psychology</span>
                    </div>
                    <h3 className="text-sm font-bold text-tx-primary uppercase tracking-tight">No Report Generated</h3>
                    <p className="text-xs text-tx-dim mt-2 max-w-xs">
                        Select a team and click "Generate Report" to have our AI analyze game events and player efficiency.
                    </p>
                </div>
            )}

            <style jsx global>{`
                .coach-report-content h3 {
                    color: var(--color-accent);
                    text-transform: uppercase;
                    font-size: 0.875rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    margin-top: 1.5rem;
                    border-left: 3px solid var(--color-accent);
                    padding-left: 0.75rem;
                }
            `}</style>
        </div>
    );
};
