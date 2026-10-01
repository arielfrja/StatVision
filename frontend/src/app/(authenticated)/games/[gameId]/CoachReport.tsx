'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Game } from '@/types/game';
import { useAuth0 } from '@/app/user-provider';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';

interface CoachReportProps {
    game: Game;
}

type ReportStatus = 'idle' | 'working' | 'done' | 'failed';

export const CoachReport: React.FC<CoachReportProps> = ({ game }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [report, setReport] = useState<string | null>(null);
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    // Team options: prefer linked home/away, but fall back to teamStats-derived
    // rows when links are unassigned — options must never both be value="".
    const teamOptions = useMemo(() => {
        const opts: { id: string; name: string }[] = [];
        if (game.homeTeamId) opts.push({ id: game.homeTeamId, name: game.homeTeam?.name || 'Home Team' });
        if (game.awayTeamId && game.awayTeamId !== game.homeTeamId) {
            opts.push({ id: game.awayTeamId, name: game.awayTeam?.name || 'Away Team' });
        }
        if (opts.length === 0) {
            for (const ts of game.teamStats || []) {
                if (!ts?.teamId || opts.some(o => o.id === ts.teamId)) continue;
                opts.push({ id: ts.teamId, name: `Team ${ts.teamId.slice(0, 8)}` });
            }
        }
        return opts;
    }, [game.homeTeamId, game.awayTeamId, game.homeTeam, game.awayTeam, game.teamStats]);

    const [selectedTeamId, setSelectedTeamId] = useState<string>(game.homeTeamId || game.awayTeamId || '');

    useEffect(() => {
        if (!selectedTeamId && teamOptions.length > 0) {
            setSelectedTeamId(teamOptions[0].id);
        }
    }, [selectedTeamId, teamOptions]);

    const generateReport = async () => {
        if (!selectedTeamId) {
            setError('Select a team before generating a report.');
            return;
        }
        setStatus('working');
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const response = await apiClient.post(`/games/${game.id}/coach-report`, { teamId: selectedTeamId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const raw = response.data?.report;
            setReport(typeof raw === 'string' ? raw : JSON.stringify(raw ?? null, null, 2));
            setStatus('done');

            // Log for audit
            logger.info('Coach report generated', { gameId: game.id, teamId: selectedTeamId });
        } catch (err: any) {
            logger.error('Error generating coach report', { gameId: game.id, teamId: selectedTeamId, message: err?.message });
            setError(err?.response?.data?.message || 'Failed to generate AI Coach Report. Please try again.');
            setStatus('failed');
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
                        onChange={(e) => { setSelectedTeamId(e.target.value); setError(null); }}
                        aria-label="Team for coach report"
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
                        {teamOptions.length === 0 && <option value="">No teams available</option>}
                        {teamOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                    
                    <md-filled-button 
                        onClick={generateReport} 
                        disabled={status === 'working'}
                    >
                        <md-icon slot="icon">smart_toy</md-icon>
                        {report ? 'Regenerate Report' : 'Generate Report'}
                    </md-filled-button>
                </div>
            </div>

            <div aria-live="polite">
                {status === 'working' && (
                    <p role="status" style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--md-sys-color-primary)',
                        margin: 0,
                    }}>Generating report…</p>
                )}
                {error && (
                    <p role="alert" style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--md-sys-color-error)',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        margin: 0,
                    }}>{error}</p>
                )}
                {status === 'done' && report ? (
                    <div data-coach-report-content style={{
                        whiteSpace: 'pre-wrap',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontSize: '14px',
                        lineHeight: '1.625',
                    }}>
                        {report}
                    </div>
                ) : status !== 'working' && !error ? (
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
                            <md-icon>psychology</md-icon>
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
                ) : null}
            </div>

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
