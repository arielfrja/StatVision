import React, { useState } from 'react';
import { Game } from '@/types/game';
import { Player } from '@/types/player';
import { GamePlayerStats } from '@/types/stats';

interface TeamAndPlayerTablesProps {
    game: Game;
    visibleStats: string[];
}

import Button from './Button';

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
            <div className="p-12 text-center bg-container-low rounded-2xl border border-bd-ghost animate-in fade-in duration-500">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4">person_off</span>
                <p className="text-xs font-bold uppercase tracking-widest text-tx-dim">No players found for this team.</p>
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

    return (
        <div className="bg-container border border-bd-ghost rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-container-high/50 border-b border-bd-ghost">
                            {activeHeaders.map(header => (
                                <th 
                                    key={header.id} 
                                    onClick={() => handleSort(header.id)}
                                    className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        {header.label}
                                        {sortColumn === header.id && (
                                            <span className="material-symbols-outlined text-[14px] text-electric">
                                                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map((playerStat) => (
                            <tr key={playerStat.playerId} className="border-b border-bd-ghost/50 hover:bg-white/[0.02] transition-colors group">
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
                                        <td key={header.id} className="px-4 py-4">
                                            <span className={`text-xs ${isMono ? 'font-black tracking-widest' : 'font-bold'} ${header.id === 'Name' ? 'text-white group-hover:text-electric transition-colors' : 'text-tx-secondary'}`}>
                                                {content}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamAndPlayerTables: React.FC<TeamAndPlayerTablesProps> = ({ game, visibleStats }) => {
    const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');

    const homeTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.homeTeamId);
    const awayTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.awayTeamId);

    const TabButton = ({ teamType, label }: { teamType: 'home' | 'away', label: string }) => (
        <button
            onClick={() => setActiveTeamTab(teamType)}
            className={`
                flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 relative overflow-hidden
                ${activeTeamTab === teamType ? 'text-electric' : 'text-tx-dim hover:text-white'}
            `}
        >
            {label}
            {activeTeamTab === teamType && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-electric shadow-[0_0_15px_var(--primary-electric)] animate-in slide-in-from-left duration-300"></div>
            )}
        </button>
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Player Statistics</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-bd-ghost to-transparent ml-6"></div>
            </div>

            <div className="flex bg-container-low border border-bd-ghost rounded-xl overflow-hidden shadow-lg p-1">
                <TabButton teamType="home" label={`${game.homeTeam?.name || 'Home Team'}`} />
                <TabButton teamType="away" label={`${game.awayTeam?.name || 'Away Team'}`} />
            </div>

            <div className="min-h-[400px]">
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
