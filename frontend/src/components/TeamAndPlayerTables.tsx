import React, { useState } from 'react';
import { Game } from '@/types/game';
import { Player } from '@/types/player';
import { GamePlayerStats } from '@/types/stats';

interface TeamAndPlayerTablesProps {
    game: Game;
}

const PlayerTable = ({ players, title }: { players: (GamePlayerStats & { player: Player })[], title: string }) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
            case 'PTS':
                aValue = a.points;
                bValue = b.points;
                break;
            case 'REB':
                aValue = a.offensiveRebounds + a.defensiveRebounds;
                bValue = b.offensiveRebounds + b.defensiveRebounds;
                break;
            case 'AST':
                aValue = a.assists;
                bValue = b.assists;
                break;
            case 'STL':
                aValue = a.steals;
                bValue = b.steals;
                break;
            case 'BLK':
                aValue = a.blocks;
                bValue = b.blocks;
                break;
            case 'TO':
                aValue = a.turnovers;
                bValue = b.turnovers;
                break;
            case 'PF':
                aValue = a.fouls;
                bValue = b.fouls;
                break;
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
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (!players || players.length === 0) {
        return (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h3>
                <p>No players found for this team.</p>
            </div>
        );
    }

    const getSortIndicator = (column: string) => {
        if (sortColumn === column) {
            return sortDirection === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h3>
            <div className="md-scrollable-table-container">
                <table className="md-table md-player-stats-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('#')}># {getSortIndicator('#')}</th>
                            <th onClick={() => handleSort('Name')}>Name {getSortIndicator('Name')}</th>
                            <th onClick={() => handleSort('Pos')}>Pos {getSortIndicator('Pos')}</th>
                            <th onClick={() => handleSort('PTS')}>PTS {getSortIndicator('PTS')}</th>
                            <th onClick={() => handleSort('REB')}>REB {getSortIndicator('REB')}</th>
                            <th onClick={() => handleSort('AST')}>AST {getSortIndicator('AST')}</th>
                            <th onClick={() => handleSort('STL')}>STL {getSortIndicator('STL')}</th>
                            <th onClick={() => handleSort('BLK')}>BLK {getSortIndicator('BLK')}</th>
                            <th onClick={() => handleSort('TO')}>TO {getSortIndicator('TO')}</th>
                            <th onClick={() => handleSort('PF')}>PF {getSortIndicator('PF')}</th>
                            <th onClick={() => handleSort('FG%')}>FG% {getSortIndicator('FG%')}</th>
                            <th onClick={() => handleSort('3P%')}>3P% {getSortIndicator('3P%')}</th>
                            <th onClick={() => handleSort('FT%')}>FT% {getSortIndicator('FT%')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map((playerStat) => (
                            <tr key={playerStat.playerId}>
                                <td>{playerStat.jerseyNumber ?? '-'}</td>
                                <td>{playerStat.player.name}</td>
                                <td>{playerStat.player.position ?? '-'}</td>
                                <td>{playerStat.points}</td>
                                <td>{playerStat.offensiveRebounds + playerStat.defensiveRebounds}</td>
                                <td>{playerStat.assists}</td>
                                <td>{playerStat.steals}</td>
                                <td>{playerStat.blocks}</td>
                                <td>{playerStat.turnovers}</td>
                                <td>{playerStat.fouls}</td>
                                <td>{playerStat.fieldGoalsAttempted > 0 ? ((playerStat.fieldGoalsMade / playerStat.fieldGoalsAttempted) * 100).toFixed(1) : '0.0'}%</td>
                                <td>{playerStat.threePointersAttempted > 0 ? ((playerStat.threePointersMade / playerStat.threePointersAttempted) * 100).toFixed(1) : '0.0'}%</td>
                                <td>{playerStat.freeThrowsAttempted > 0 ? ((playerStat.freeThrowsMade / playerStat.freeThrowsAttempted) * 100).toFixed(1) : '0.0'}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamAndPlayerTables: React.FC<TeamAndPlayerTablesProps> = ({ game }) => {
    const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');

    const homeTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.homeTeamId);
    const awayTeamPlayers = game.playerStats.filter(ps => ps.teamId === game.awayTeamId);

    const TabButton = ({ teamType, label }: { teamType: 'home' | 'away', label: string }) => (
        <md-filled-button
            onClick={() => setActiveTeamTab(teamType)}
            style={{
                flexGrow: 1,
                opacity: activeTeamTab === teamType ? 1 : 0.6,
                '--md-filled-button-container-color': activeTeamTab === teamType ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                '--md-filled-button-label-text-color': activeTeamTab === teamType ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
            }}
        >
            {label}
        </md-filled-button>
    );

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Player Statistics</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <TabButton teamType="home" label={`${game.homeTeam?.name || 'Home Team'}`} />
                <TabButton teamType="away" label={`${game.awayTeam?.name || 'Away Team'}`} />
            </div>
            {activeTeamTab === 'home' && (
                <PlayerTable players={homeTeamPlayers as (GamePlayerStats & { player: Player })[]} title={`${game.homeTeam?.name || 'Home Team'} Players`} />
            )}
            {activeTeamTab === 'away' && (
                <PlayerTable players={awayTeamPlayers as (GamePlayerStats & { player: Player })[]} title={`${game.awayTeam?.name || 'Away Team'} Players`} />
            )}
        </div>
    );
};

export default TeamAndPlayerTables;
