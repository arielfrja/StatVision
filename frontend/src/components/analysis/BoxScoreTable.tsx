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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Box Score</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-bd-ghost to-transparent ml-6"></div>
            </div>

            <div className="bg-container border border-bd-ghost rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-container-high/50 border-b border-bd-ghost">
                                {headers.map((header, i) => (
                                    <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-tx-dim">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {teamStats.map((team, index) => (
                                <tr key={index} className="border-b border-bd-ghost/50 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${team.isHome ? 'bg-electric' : 'bg-gold'}`}></div>
                                            <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-electric transition-colors">
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
                                            <td key={statId} className="px-6 py-5">
                                                <span className="text-xs font-black tracking-widest text-tx-secondary mono-stat">
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
