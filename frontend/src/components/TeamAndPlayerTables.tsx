/* eslint-disable */
import React, { useState } from 'react';
import { Game } from '@/types/game';
import { Player } from '@/types/player';
import { GamePlayerStats } from '@/types/stats';
import '@material/web/icon/icon.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/labs/card/outlined-card.js';

interface TeamAndPlayerTablesProps {
    game: Game;
    visibleStats: string[];
}

const PlayerTable = ({ players, title, visibleStats }: { players: (GamePlayerStats & { player: Player })[], title: string, visibleStats: string[] }) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const ALL_PLAYER_HEADERS: { [key: string]: string } = {
        'points': 'PTS',
        'assists': 'AST',
        'offensiveRebounds': 'OREB',
        'defensiveRebounds': 'DREB',
        'steals': 'STL',
        'blocks': 'BLK',
        'turnovers': 'TO',
        'fouls': 'PF',
        'fieldGoalsMade': 'FG%',
        'threePointersMade': '3P%',
        'freeThrowsMade': 'FT%',
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
            case '#':
                aValue = a.jerseyNumber ?? -1;
                bValue = b.jerseyNumber ?? -1;
                break;
            case 'Name':
                aValue = a.player.name;
                bValue = b.player.name;
                break;
            case 'Pos':
                aValue = a.player.position ?? '';
                bValue = b.player.position ?? '';
                break;
            case 'PTS': aValue = a.points; bValue = b.points; break;
            case 'OREB': aValue = a.offensiveRebounds; bValue = b.offensiveRebounds; break;
            case 'DREB': aValue = a.defensiveRebounds; bValue = b.defensiveRebounds; break;
            case 'REB': aValue = a.offensiveRebounds + a.defensiveRebounds; bValue = b.offensiveRebounds + b.defensiveRebounds; break;
            case 'AST': aValue = a.assists; bValue = b.assists; break;
            case 'STL': aValue = a.steals; bValue = b.steals; break;
            case 'BLK': aValue = a.blocks; bValue = b.blocks; break;
            case 'TO': aValue = a.turnovers; bValue = b.turnovers; break;
            case 'PF': aValue = a.fouls; bValue = b.fouls; break;
            case 'FG%':
                aValue = a.fieldGoalsAttempted > 0 ? (a.fieldGoalsMade / a.fieldGoalsAttempted) : 0;
                bValue = b.fieldGoalsAttempted > 0 ? (b.fieldGoalsMade / b.fieldGoalsAttempted) : 0;
                break;
            case '3P%':
                aValue = a.threePointersAttempted > 0 ? (a.threePointersMade / a.threePointersAttempted) : 0;
                bValue = b.threePointersAttempted > 0 ? (b.threePointersMade / b.threePointersAttempted) : 0;
                break;
            case 'FT%':
                aValue = a.freeThrowsAttempted > 0 ? (a.freeThrowsMade / a.freeThrowsAttempted) : 0;
                bValue = b.freeThrowsAttempted > 0 ? (b.freeThrowsMade / b.freeThrowsAttempted) : 0;
                break;
            default: return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (!players || players.length === 0) {
        return (
            <div
                style={{
                    padding: '48px',
                    textAlign: 'center',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderRadius: '16px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                }}
            >
                <md-icon style={{ fontSize: '36px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', opacity: 0.6 }}>person_off</md-icon>
                <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>
                    No players found for this team.
                </p>
            </div>
        );
    }

    const activeHeaders = [
        { id: '#', label: '#' },
        { id: 'Name', label: 'Name' },
        { id: 'Pos', label: 'Pos' },
        ...visibleStats
            .filter(id => ALL_PLAYER_HEADERS[id])
            .map(id => ({ id: ALL_PLAYER_HEADERS[id], label: ALL_PLAYER_HEADERS[id] }))
    ];

    // Map column IDs to flex basis ratios
    const columnFlex = (id: string): number => {
        if (id === 'Name') return 2;
        if (id === '#' || id === 'Pos') return 0.6;
        return 0.8;
    };

    return (
        <md-outlined-card
            style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: '16px',
            }}
        >
            {/* Table header row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                }}
            >
                {activeHeaders.map(header => (
                    <div
                        key={header.id}
                        onClick={() => handleSort(header.id)}
                        style={{
                            flex: columnFlex(header.id),
                            padding: '16px',
                            fontSize: '10px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        {header.label}
                        {sortColumn === header.id && (
                            <md-icon style={{ fontSize: '14px', color: 'var(--md-sys-color-primary)' }}>
                                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </md-icon>
                        )}
                    </div>
                ))}
            </div>

            {/* Player rows as md-list */}
            <md-list style={{ width: '100%', background: 'transparent' }}>
                {sortedPlayers.map((playerStat) => (
                    <md-list-item
                        key={playerStat.playerId}
                        type="text"
                        style={{
                            width: '100%',
                            borderBottom: '0.5px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent)',
                            minHeight: '20px',
                            '--md-list-item-top-space': '0px',
                            '--md-list-item-bottom-space': '0px',
                            '--md-list-item-leading-space': '0px',
                            '--md-list-item-trailing-space': '0px',
                            '--md-list-item-one-line-container-height': 'auto',
                        } as React.CSSProperties}
                    >
                        <div
                            slot="body"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '12px 0',
                            }}
                        >
                            {activeHeaders.map(header => {
                                let content: any = '-';
                                let isMono = false;
                                switch (header.id) {
                                    case '#': content = playerStat.jerseyNumber ?? '-'; isMono = true; break;
                                    case 'Name': content = playerStat.player.name; break;
                                    case 'Pos': content = playerStat.player.position ?? '-'; break;
                                    case 'PTS': content = playerStat.points; isMono = true; break;
                                    case 'OREB': content = playerStat.offensiveRebounds; isMono = true; break;
                                    case 'DREB': content = playerStat.defensiveRebounds; isMono = true; break;
                                    case 'REB': content = playerStat.offensiveRebounds + playerStat.defensiveRebounds; isMono = true; break;
                                    case 'AST': content = playerStat.assists; isMono = true; break;
                                    case 'STL': content = playerStat.steals; isMono = true; break;
                                    case 'BLK': content = playerStat.blocks; isMono = true; break;
                                    case 'TO': content = playerStat.turnovers; isMono = true; break;
                                    case 'PF': content = playerStat.fouls; isMono = true; break;
                                    case 'FG%': content = (playerStat.fieldGoalsAttempted > 0 ? ((playerStat.fieldGoalsMade / playerStat.fieldGoalsAttempted) * 100).toFixed(1) : '0.0') + '%'; isMono = true; break;
                                    case '3P%': content = (playerStat.threePointersAttempted > 0 ? ((playerStat.threePointersMade / playerStat.threePointersAttempted) * 100).toFixed(1) : '0.0') + '%'; isMono = true; break;
                                    case 'FT%': content = (playerStat.freeThrowsAttempted > 0 ? ((playerStat.freeThrowsMade / playerStat.freeThrowsAttempted) * 100).toFixed(1) : '0.0') + '%'; isMono = true; break;
                                }
                                return (
                                    <div
                                        key={header.id}
                                        style={{
                                            flex: columnFlex(header.id),
                                            padding: '0 16px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: isMono ? 900 : 700,
                                                letterSpacing: isMono ? '0.1em' : 'normal',
                                                color: header.id === 'Name'
                                                    ? 'var(--md-sys-color-on-surface)'
                                                    : 'var(--md-sys-color-on-surface-variant)',
                                            }}
                                        >
                                            {content}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </md-list-item>
                ))}
            </md-list>
        </md-outlined-card>
    );
};

const TeamAndPlayerTables: React.FC<TeamAndPlayerTablesProps> = ({ game, visibleStats }) => {
    const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');

    const homeTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.homeTeamId);
    const awayTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.awayTeamId);

    const TabButton = ({ teamType, label }: { teamType: 'home' | 'away', label: string }) => (
        <button
            onClick={() => setActiveTeamTab(teamType)}
            style={{
                flex: 1,
                padding: '16px 0',
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTeamTab === teamType
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-on-surface-variant)',
                transition: 'color 300ms',
            }}
        >
            {label}
            {activeTeamTab === teamType && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'var(--md-sys-color-primary)',
                    }}
                ></div>
            )}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.025em', color: 'var(--md-sys-color-on-surface)' }}>
                    Player Statistics
                </h2>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, var(--md-sys-color-outline-variant), transparent)', marginLeft: '24px' }}></div>
            </div>

            <div
                style={{
                    display: 'flex',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    padding: '4px',
                }}
            >
                <TabButton teamType="home" label={`${game.homeTeam?.name || 'Home Team'}`} />
                <TabButton teamType="away" label={`${game.awayTeam?.name || 'Away Team'}`} />
            </div>

            <div style={{ minHeight: '400px' }}>
                {activeTeamTab === 'home' ? (
                    <PlayerTable players={homeTeamPlayers as (GamePlayerStats & { player: Player })[]} title={`${game.homeTeam?.name || 'Home Team'} Players`} visibleStats={visibleStats} />
                ) : (
                    <PlayerTable players={awayTeamPlayers as (GamePlayerStats & { player: Player })[]} title={`${game.awayTeam?.name || 'Away Team'} Players`} visibleStats={visibleStats} />
                )}
            </div>
        </div>
    );
};

export default TeamAndPlayerTables;
