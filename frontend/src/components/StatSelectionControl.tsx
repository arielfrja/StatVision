import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

// Import Material Web Components
import '@material/web/checkbox/checkbox.js';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';

interface StatSelectionControlProps {
    onPreferencesChanged: (visibleStats: string[]) => void;
}

const ALL_STATS = [
    { id: 'points', label: 'Points' },
    { id: 'assists', label: 'Assists' },
    { id: 'offensiveRebounds', label: 'Off. Rebounds' },
    { id: 'defensiveRebounds', label: 'Def. Rebounds' },
    { id: 'fieldGoalsMade', label: 'FG Made' },
    { id: 'fieldGoalsAttempted', label: 'FG Attempted' },
    { id: 'threePointersMade', label: '3P Made' },
    { id: 'threePointersAttempted', label: '3P Attempted' },
    { id: 'freeThrowsMade', label: 'FT Made' },
    { id: 'freeThrowsAttempted', label: 'FT Attempted' },
    { id: 'steals', label: 'Steals' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'turnovers', label: 'Turnovers' },
    { id: 'fouls', label: 'Fouls' },
    { id: 'effectiveFieldGoalPercentage', label: 'eFG%' },
    { id: 'trueShootingPercentage', label: 'TS%' },
];

const StatSelectionControl: React.FC<StatSelectionControlProps> = ({ onPreferencesChanged }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [visibleStats, setVisibleStats] = useState<string[]>(ALL_STATS.map(s => s.id));
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await axios.get('http://localhost:3000/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.preferences?.visibleStats) {
                setVisibleStats(response.data.preferences.visibleStats);
                onPreferencesChanged(response.data.preferences.visibleStats);
            }
        } catch (error) {
            console.error("Error fetching preferences:", error);
        }
    };

    const handleToggleStat = (statId: string) => {
        const newVisibleStats = visibleStats.includes(statId)
            ? visibleStats.filter(id => id !== statId)
            : [...visibleStats, statId];
        
        setVisibleStats(newVisibleStats);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            await axios.put('http://localhost:3000/me/preferences', { visibleStats }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onPreferencesChanged(visibleStats);
        } catch (error) {
            console.error("Error saving preferences:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--border-radius-md)', marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Customize Displayed Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                {ALL_STATS.map(stat => (
                    <label key={stat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                        <md-checkbox
                            checked={visibleStats.includes(stat.id)}
                            onchange={() => handleToggleStat(stat.id)}
                        ></md-checkbox>
                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>{stat.label}</span>
                    </label>
                ))}
            </div>
            <md-filled-button onClick={handleSave} disabled={isLoading}>
                <md-icon slot="icon">save</md-icon>
                {isLoading ? 'Saving...' : 'Save Preferences'}
            </md-filled-button>
        </div>
    );
};

export default StatSelectionControl;