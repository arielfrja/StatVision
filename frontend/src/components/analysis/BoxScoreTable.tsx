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
    onEditPlayer?: (playerId: string) => void;
}

const BoxScoreTable: React.FC<BoxScoreTableProps> = ({ game, visibleStats, onEditPlayer }) => {
    const homeTeamId = game.homeTeamId;
    const awayTeamId = game.awayTeamId;

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
        'plusMinus': '+/-'
    };

    const activeStatIds = visibleStats.filter(s => ALL_STAT_HEADERS[s]);

    const formatStatValue = (ps: any, id: string): string => {
        if (id === 'fieldGoalsMade') return `${ps.fieldGoalsMade}-${ps.fieldGoalsAttempted}`;
        if (id === 'threePointersMade') return `${ps.threePointersMade}-${ps.threePointersAttempted}`;
        if (id === 'freeThrowsMade') return `${ps.freeThrowsMade}-${ps.freeThrowsAttempted}`;
        return String((ps as any)[id] ?? '');
    };

    const renderTeamSection = (teamId: string | null, teamName: string, isHome: boolean) => {
        const teamPlayers = game.playerStats.filter(ps => ps.teamId === teamId);
        const teamTotals = game.teamStats.find(ts => ts.teamId === teamId);

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
                    <md-list style={{ padding: 0 }}>
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
                                    style={{
                                        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                                        minHeight: '52px',
                                        transition: 'background-color 0.15s ease',
                                    }}
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
                                        <button
                                            onClick={() => onEditPlayer && onEditPlayer(ps.playerId)}
                                            style={{
                                                padding: '4px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--md-sys-color-on-surface-variant)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title="Edit Player Stats"
                                        >
                                            <md-icon style={{ fontSize: '18px' }}>edit_square</md-icon>
                                        </button>
                                    </div>
                                </md-list-item>
                            );
                        })}

                        {/* Totals row */}
                        {teamTotals && (
                            <>
                                <md-divider style={{ margin: 0 }} />
                                <md-list-item style={{
                                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                    fontWeight: 700,
                                    minHeight: '44px',
                                }}>
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
                                        {activeStatIds.map(id => {
                                            let val = (teamTotals as any)[id];
                                            if (id === 'fieldGoalsMade') val = `${teamTotals.fieldGoalsMade}-${teamTotals.fieldGoalsAttempted}`;
                                            if (id === 'threePointersMade') val = `${teamTotals.threePointersMade}-${teamTotals.threePointersAttempted}`;
                                            if (id === 'freeThrowsMade') val = `${teamTotals.freeThrowsMade}-${teamTotals.freeThrowsAttempted}`;
                                            return `${ALL_STAT_HEADERS[id]} ${val}`;
                                        }).join('  ·  ')}
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
