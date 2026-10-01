'use client';
import React from 'react';
import { Game } from '@/types/game';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/divider/divider.js';

interface BoxScoreTableProps {
    game: Game;
    visibleStats: string[];
}

const BoxScoreTable: React.FC<BoxScoreTableProps> = ({ game, visibleStats }) => {
    const homeTeamId = game.homeTeamId;
    const awayTeamId = game.awayTeamId;
    const statsRows = game.teamStats ?? [];
    const playerRows = game.playerStats ?? [];

    const ALL_STAT_HEADERS: { [key: string]: string } = {
        'points': 'PTS',
        'assists': 'AST',
        'offensiveRebounds': 'OR',
        'defensiveRebounds': 'DR',
        'fieldGoalsMade': 'FG',
        'threePointersMade': '3P',
        'freeThrowsMade': 'FT',
        'steals': 'STL',
        'blocks': 'BLK',
        'turnovers': 'TO',
        'fouls': 'PF',
        'plusMinus': '+/-',
        'effectiveFieldGoalPercentage': 'eFG%',
        'trueShootingPercentage': 'TS%'
    };

    const activeStatIds = visibleStats.filter(s => ALL_STAT_HEADERS[s]);

    const formatPct = (v: any): string => {
        const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
        return `${(n * 100).toFixed(1)}%`;
    };

    const formatStatValue = (ps: any, id: string): string => {
        if (id === 'fieldGoalsMade') return `${ps.fieldGoalsMade ?? 0}-${ps.fieldGoalsAttempted ?? 0}`;
        if (id === 'threePointersMade') return `${ps.threePointersMade ?? 0}-${ps.threePointersAttempted ?? 0}`;
        if (id === 'freeThrowsMade') return `${ps.freeThrowsMade ?? 0}-${ps.freeThrowsAttempted ?? 0}`;
        if (id === 'effectiveFieldGoalPercentage') return formatPct(ps.effectiveFieldGoalPercentage);
        if (id === 'trueShootingPercentage') return formatPct(ps.trueShootingPercentage);
        return String((ps as any)[id] ?? 0);
    };

    const formatTotalValue = (totals: any, id: string): string => {
        if (id === 'fieldGoalsMade') return `${totals.fieldGoalsMade ?? 0}-${totals.fieldGoalsAttempted ?? 0}`;
        if (id === 'threePointersMade') return `${totals.threePointersMade ?? 0}-${totals.threePointersAttempted ?? 0}`;
        if (id === 'freeThrowsMade') return `${totals.freeThrowsMade ?? 0}-${totals.freeThrowsAttempted ?? 0}`;
        if (id === 'effectiveFieldGoalPercentage') return formatPct(totals.effectiveFieldGoalPercentage);
        if (id === 'trueShootingPercentage') return formatPct(totals.trueShootingPercentage);
        return String((totals as any)[id] ?? 0);
    };

    const renderNoDataSection = (teamName: string, isHome: boolean) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '8px',
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isHome ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)',
                }} />
                <h3 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    {teamName}
                </h3>
            </div>
            <div style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
            }}>
                No data — link this side in Roster Assignment
            </div>
        </div>
    );

    const renderTeamSection = (teamId: string | null, teamName: string, isHome: boolean) => {
        // Own row by exact team link. A lone stat row belongs to exactly one
        // side: the matching link, or — when it matches neither (unassigned
        // game) — the home side. The other side renders NO DATA. This never
        // duplicates one row under both teams.
        let teamTotals = statsRows.find(ts => teamId != null && ts.teamId === teamId);
        let teamPlayers = playerRows.filter(ps => ps.teamId === teamId);
        if (!teamTotals && statsRows.length === 1) {
            const orphan = statsRows[0];
            const matchesNeitherSide = orphan.teamId !== game.homeTeamId && orphan.teamId !== game.awayTeamId;
            if ((orphan.teamId === teamId) || (matchesNeitherSide && isHome)) {
                teamTotals = orphan;
                teamPlayers = playerRows.filter(ps => ps.teamId === orphan.teamId);
            } else {
                return renderNoDataSection(teamName, isHome);
            }
        }
        if (!teamTotals && teamPlayers.length === 0) {
            return renderNoDataSection(teamName, isHome);
        }

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '8px',
                overflow: 'hidden',
            }}>
                {/* Team Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isHome ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)',
                    }} />
                    <h3 style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--md-sys-color-on-surface)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        {teamName}
                    </h3>
                </div>

                {/* Player List */}
                {teamPlayers.length > 0 ? (
                    <md-list className="list-flush">
                        {teamPlayers.map((ps) => {
                            const plusMinusVal = ps.plusMinus ?? 0;
                            const statSummary = activeStatIds.map(id => {
                                const header = ALL_STAT_HEADERS[id];
                                const value = formatStatValue(ps, id);
                                return `${header} ${value}`;
                            }).join('  ·  ');

                            return (
                                <md-list-item
                                    key={ps.playerId}
                                >
                                    <div slot="start" style={{
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textAlign: 'center',
                                        minWidth: '28px',
                                        fontFamily: 'monospace',
                                    }}>
                                        {ps.jerseyNumber ?? '--'}
                                    </div>
                                    <span slot="headline" style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'var(--md-sys-color-on-surface)',
                                    }}>
                                        {(ps as any).player?.name || 'Unknown Player'}
                                    </span>
                                    <span slot="supporting-text" style={{
                                        fontSize: '11px',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.02em',
                                    }}>
                                        {statSummary}
                                    </span>
                                    <div slot="end" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        {plusMinusVal !== 0 && (
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                color: plusMinusVal > 0 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)',
                                                backgroundColor: plusMinusVal > 0
                                                    ? 'color-mix(in srgb, var(--md-sys-color-tertiary) 12%, transparent)'
                                                    : 'color-mix(in srgb, var(--md-sys-color-error) 12%, transparent)',
                                            }}>
                                                {plusMinusVal > 0 ? '+' : ''}{plusMinusVal}
                                            </span>
                                        )}
                                    </div>
                                </md-list-item>
                            );
                        })}

                        {/* Totals row */}
                        {teamTotals && (
                            <>
                                <md-divider />
                                <md-list-item>
                                    <div slot="start" style={{
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textAlign: 'center',
                                        minWidth: '28px',
                                    }} />
                                    <span slot="headline" style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'var(--md-sys-color-on-surface)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                    }}>
                                        TOTALS
                                    </span>
                                    <span slot="supporting-text" style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'var(--md-sys-color-on-surface)',
                                        fontFamily: 'monospace',
                                    }}>
                                        {activeStatIds.map(id => `${ALL_STAT_HEADERS[id]} ${formatTotalValue(teamTotals, id)}`).join('  ·  ')}
                                        {'  ·  '}
                                        eFG% {formatPct((teamTotals as any).effectiveFieldGoalPercentage)}
                                        {'  ·  '}
                                        TS% {formatPct((teamTotals as any).trueShootingPercentage)}
                                    </span>
                                </md-list-item>
                            </>
                        )}
                    </md-list>
                ) : (
                    <div style={{
                        padding: '40px 0',
                        textAlign: 'center',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}>
                        No player data available
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {renderTeamSection(homeTeamId, game.homeTeam?.name || 'Home Team', true)}
            {renderTeamSection(awayTeamId, game.awayTeam?.name || 'Away Team', false)}
        </div>
    );
};

export default BoxScoreTable;
