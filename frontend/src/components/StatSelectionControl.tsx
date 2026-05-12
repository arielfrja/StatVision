/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import axios from 'axios';
import Button from './Button';
import Loader from './Loader';

// Import Material Web Components
import '@material/web/checkbox/checkbox.js';

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
            <div className="p-6 bg-container-low rounded-2xl mb-8 flex flex-col items-center justify-center min-h-[300px] border border-bd-ghost">
                <Loader size="medium" label="Loading Preferences" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-container-low rounded-2xl mb-8 border border-bd-ghost">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Customize Displayed Stats</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mb-8">
                {ALL_STATS.map(stat => (
                    <label key={stat.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-container-highest transition-colors group">
                        <md-checkbox
                            checked={visibleStats.includes(stat.id)}
                            onchange={() => handleToggleStat(stat.id)}
                            className="scale-90"
                        ></md-checkbox>
                        <span className="text-xs font-bold text-tx-secondary group-hover:text-white transition-colors">{stat.label}</span>
                    </label>
                ))}
            </div>
            <Button 
                onClick={handleSave} 
                isLoading={isLoading} 
                icon="save"
                variant="primary"
            >
                Save Preferences
            </Button>
        </div>
    );
};

export default StatSelectionControl;