'use client';
import React from 'react';
import { Game } from '@/types/game';

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
    
    const renderTeamSection = (teamId: string | null, teamName: string, isHome: boolean) => {
        const teamPlayers = game.playerStats.filter(ps => ps.teamId === teamId);
        const teamTotals = game.teamStats.find(ts => ts.teamId === teamId);

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2 bg-surface-high border-x border-t border-border-main rounded-t-md">
                    <div className={`w-2 h-2 rounded-full ${isHome ? 'bg-accent' : 'bg-warning'}`}></div>
                    <h3 className="text-sm font-bold text-tx-primary uppercase tracking-wider">{teamName}</h3>
                </div>
                <div className="md-scrollable-table-container rounded-t-none border-t-0">
                    <table className="md-table md-box-score-table">
                        <thead>
                            <tr>
                                <th className="w-10 text-center">#</th>
                                <th className="w-48">PLAYER</th>
                                {activeStatIds.map(id => (
                                    <th key={id} className="text-center">{ALL_STAT_HEADERS[id]}</th>
                                ))}
                                <th className="w-12 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamPlayers.length > 0 ? teamPlayers.map((ps) => (
                                <tr key={ps.playerId} className="hover:bg-white/[0.01]">
                                    <td className="text-center font-bold text-tx-dim">
                                        {ps.jerseyNumber ?? '--'}
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-tx-primary">{(ps as any).player?.name || 'Unknown Player'}</span>
                                            {ps.plusMinus !== 0 && (
                                                <span className={`text-[10px] ${ps.plusMinus > 0 ? 'text-success' : 'text-error'}`}>
                                                    {ps.plusMinus > 0 ? '+' : ''}{ps.plusMinus}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {activeStatIds.map(id => {
                                        let val = (ps as any)[id];
                                        if (id === 'fieldGoalsMade') val = `${ps.fieldGoalsMade}-${ps.fieldGoalsAttempted}`;
                                        if (id === 'threePointersMade') val = `${ps.threePointersMade}-${ps.threePointersAttempted}`;
                                        if (id === 'freeThrowsMade') val = `${ps.freeThrowsMade}-${ps.freeThrowsAttempted}`;
                                        
                                        return (
                                            <td key={id} className="text-center font-medium text-tx-secondary mono-stat">
                                                {val}
                                            </td>
                                        );
                                    })}
                                    <td className="text-right px-2">
                                        <button 
                                            onClick={() => onEditPlayer && onEditPlayer(ps.playerId)}
                                            className="p-1.5 rounded text-tx-dim hover:text-accent hover:bg-accent/10 transition-colors"
                                            title="Edit Player Stats"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_square</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={activeStatIds.length + 3} className="py-8 text-center text-tx-dim text-[10px] uppercase font-bold tracking-widest">
                                        No player data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {teamTotals && (
                            <tfoot className="bg-surface-high/50 border-t border-border-main">
                                <tr className="font-bold text-tx-primary">
                                    <td colSpan={2} className="px-4 py-2 text-[10px] uppercase tracking-widest">TOTALS</td>
                                    {activeStatIds.map(id => {
                                        let val = (teamTotals as any)[id];
                                        if (id === 'fieldGoalsMade') val = `${teamTotals.fieldGoalsMade}-${teamTotals.fieldGoalsAttempted}`;
                                        if (id === 'threePointersMade') val = `${teamTotals.threePointersMade}-${teamTotals.threePointersAttempted}`;
                                        if (id === 'freeThrowsMade') val = `${teamTotals.freeThrowsMade}-${teamTotals.freeThrowsAttempted}`;
                                        return (
                                            <td key={id} className="text-center mono-stat">{val}</td>
                                        );
                                    })}
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-10">
            {renderTeamSection(homeTeamId, game.homeTeam?.name || 'Home Team', true)}
            {renderTeamSection(awayTeamId, game.awayTeam?.name || 'Away Team', false)}
        </div>
    );
};

export default BoxScoreTable;
