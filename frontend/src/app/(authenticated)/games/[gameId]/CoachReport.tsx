'use client';

import React, { useState } from 'react';
import { Game } from '@/types/game';
import { appLogger as logger } from '@/utils/Logger';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';

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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '24px',
            backgroundColor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '6px',
        }}>
            <div data-coach-report-header style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                paddingBottom: '24px',
            }}>
                <div>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: 'var(--md-sys-color-on-surface)',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.025em',
                        margin: 0,
                    }}>AI Virtual Coach</h2>
                    <p style={{
                        fontSize: '12px',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: '4px 0 0 0',
                    }}>Strategic Performance Insights</p>
                </div>
                
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <select 
                        value={selectedTeamId} 
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        style={{
                            backgroundColor: 'var(--md-sys-color-surface-container)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '8px',
                            borderRadius: '4px',
                            outline: 'none',
                        }}
                    >
                        <option value={game.homeTeamId || ''}>{game.homeTeam?.name || 'Home Team'}</option>
                        <option value={game.awayTeamId || ''}>{game.awayTeam?.name || 'Away Team'}</option>
                    </select>
                    
                    <md-filled-button 
                        onClick={generateReport} 
                        disabled={loading}
                    >
                        <md-icon slot="icon">smart_toy</md-icon>
                        {report ? 'Regenerate Report' : 'Generate Report'}
                    </md-filled-button>
                </div>
            </div>

            {report ? (
                <div data-coach-report-content style={{
                    whiteSpace: 'pre-wrap',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '14px',
                    lineHeight: '1.625',
                }}>
                    {report}
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '80px',
                    paddingBottom: '80px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                    }}>
                        <md-icon style={{fontSize: '30px', color: 'var(--md-sys-color-primary)'}}>psychology</md-icon>
                    </div>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--md-sys-color-on-surface)',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.025em',
                        margin: 0,
                    }}>No Report Generated</h3>
                    <p style={{
                        fontSize: '12px',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        marginTop: '8px',
                        maxWidth: '320px',
                        margin: '8px 0 0 0',
                    }}>
                        Select a team and click "Generate Report" to have our AI analyze game events and player efficiency.
                    </p>
                </div>
            )}

            <style>{`
                @media (min-width: 768px) {
                    [data-coach-report-header] {
                        flex-direction: row !important;
                    }
                }
                [data-coach-report-content] h3 {
                    color: var(--md-sys-color-primary);
                    text-transform: uppercase;
                    font-size: 0.875rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    margin-top: 1.5rem;
                    border-left: 3px solid var(--md-sys-color-primary);
                    padding-left: 0.75rem;
                }
            `}</style>
        </div>
    );
};
