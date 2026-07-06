import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import axios from 'axios';
import '@material/web/progress/circular-progress.js';
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
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        setIsInitialLoading(true);
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
        } finally {
            setIsInitialLoading(false);
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

    if (isInitialLoading) {
        return (
            <div style={{
                padding: '24px',
                background: 'var(--md-sys-color-surface-container-high)',
                borderRadius: '16px',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                border: '1px solid var(--md-sys-color-outline-variant)',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0' }}>
                    <md-circular-progress indeterminate></md-circular-progress>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '13px' }}>Loading Preferences</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: '24px',
            background: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid var(--md-sys-color-outline-variant)',
        }}>
            <h3 style={{
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '24px',
            }}>Customize Displayed Stats</h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '32px',
            }}>
                {ALL_STATS.map(stat => (
                    <label key={stat.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                    }}>
                        <md-checkbox
                            checked={visibleStats.includes(stat.id)}
                            onchange={() => handleToggleStat(stat.id)}
                            style={{ transform: 'scale(0.9)' }}
                        ></md-checkbox>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--md-sys-color-on-surface-variant)',
                        }}>{stat.label}</span>
                    </label>
                ))}
            </div>
            <md-filled-button
                onClick={handleSave}
                disabled={isLoading}
            >
                <md-icon slot="icon">save</md-icon>
                Save Preferences
            </md-filled-button>
        </div>
    );
};

export default StatSelectionControl;