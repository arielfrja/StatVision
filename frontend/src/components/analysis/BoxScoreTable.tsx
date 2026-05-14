'use client';
import React from 'react';
import { Game } from '@/types/game';

interface BoxScoreTableProps {
    game: Game;
    visibleStats: string[];
}

const BoxScoreTable: React.FC<BoxScoreTableProps> = ({ game, visibleStats }) => {
    const teamAStats = game.teamStats.find(s => s.teamId === game.homeTeamId);
    const teamBStats = game.teamStats.find(s => s.teamId === game.awayTeamId);

    const ALL_STAT_HEADERS: { [key: string]: string } = {
        'points': 'PTS',
        'assists': 'AST',
        'offensiveRebounds': 'OREB',
        'defensiveRebounds': 'DREB',
        'steals': 'STL',
        'blocks': 'BLK',
        'turnovers': 'TO',
        'fouls': 'PF',
        'effectiveFieldGoalPercentage': 'eFG%',
        'trueShootingPercentage': 'TS%'
    };

    const activeStatIds = visibleStats.filter(s => ALL_STAT_HEADERS[s]);
    const headers = ['Team', ...activeStatIds.map(s => ALL_STAT_HEADERS[s])];
    const teamStats = [
        { name: game.homeTeam?.name || 'Home Team', stats: teamAStats, isHome: true },
        { name: game.awayTeam?.name || 'Away Team', stats: teamBStats, isHome: false },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold tracking-tight text-tx-secondary uppercase">Box Score</h2>
                <div className="h-px flex-1 bg-bd-ghost ml-4"></div>
            </div>

            <div className="bg-container border border-bd-ghost rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-container-high/30 border-b border-bd-ghost">
                                {headers.map((header, i) => (
                                    <th key={i} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-tx-dim">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {teamStats.map((team, index) => (
                                <tr key={index} className="border-b border-bd-ghost hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${team.isHome ? 'bg-electric' : 'bg-gold'}`}></div>
                                            <span className="text-xs font-semibold text-white group-hover:text-electric transition-colors">
                                                {team.name}
                                            </span>
                                        </div>
                                    </td>
                                    {activeStatIds.map(statId => {
                                        let value: any = (team.stats as any)?.[statId] ?? 0;
                                        if (statId.toLowerCase().includes('percentage')) {
                                            value = (value * 100).toFixed(1) + '%';
                                        }
                                        return (
                                            <td key={statId} className="px-5 py-4">
                                                <span className="text-xs font-medium text-tx-secondary mono-stat">
                                                    {value}
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
        </div>
    );
};

export default BoxScoreTable;
