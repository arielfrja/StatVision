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

    const headers = ['Team', ...visibleStats.filter(s => ALL_STAT_HEADERS[s]).map(s => ALL_STAT_HEADERS[s])];
    const teamStats = [
        { name: game.homeTeam?.name || 'Home Team', stats: teamAStats },
        { name: game.awayTeam?.name || 'Away Team', stats: teamBStats },
    ];

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Box Score (Team Totals)</h2>
            <div className="md-scrollable-table-container">
                <table className="md-table md-box-score-table">
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {teamStats.map((team, index) => (
                            <tr key={index}>
                                <td style={{ fontWeight: 'bold' }}>{team.name}</td>
                                {visibleStats.filter(s => ALL_STAT_HEADERS[s]).map(statId => {
                                    let value: any = (team.stats as any)?.[statId] ?? 0;
                                    if (statId.toLowerCase().includes('percentage')) {
                                        value = (value * 100).toFixed(1) + '%';
                                    }
                                    return <td key={statId}>{value}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BoxScoreTable;
