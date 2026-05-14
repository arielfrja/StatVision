/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Team, GameType, IdentityMode } from '@/types/game';
import Button from '@/components/Button';
import Loader from '@/components/Loader';

import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/radio/radio.js';

interface UploadFormProps {
    onUploadComplete: () => void;
    onCancel: () => void;
}

type Step = 'METADATA' | 'UPLOAD' | 'STATUS';

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, onCancel }) => {
    const { getAccessTokenSilently } = useAuth0();
    const { data: teams } = useSWR<Team[]>('/teams');

    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<Step>('METADATA');
    const [file, setFile] = useState<File | null>(null);
    const [gameName, setGameName] = useState('');
    const [gameDate, setGameDate] = useState('');
    const [location, setLocation] = useState('');
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [homeTeamColor, setHomeTeamColor] = useState('White');
    const [awayTeamColor, setAwayTeamColor] = useState('Black');
    
    const [gameType, setGameType] = useState<GameType>(GameType.FULL_COURT);
    const [identityMode, setIdentityMode] = useState<IdentityMode>(IdentityMode.JERSEY_COLORS);
    const [pointValue, setPointValue] = useState<'1_AND_2' | '2_AND_3'>( '2_AND_3');

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [gameId, setGameId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const colors = ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Navy', 'Grey'];

    if (!mounted) return <div className="flex items-center justify-center h-[400px]"><Loader size="large" /></div>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleMetadataSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameName) {
            setError('Please provide a game name.');
            return;
        }
        setStep('UPLOAD');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a video file.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setProgress(0);

        try {
            const token = await getAccessTokenSilently();

            // Step 1: Create Game Record
            const createGameResponse = await apiClient.post('/games', {
                name: gameName,
                gameDate: gameDate || undefined,
                location: location || undefined,
                homeTeamId: homeTeamId || undefined,
                awayTeamId: awayTeamId || undefined,
                gameType,
                identityMode,
                ruleset: {
                    pointValue,
                    halfCourt: gameType !== GameType.FULL_COURT
                },
                visualContext: {
                    homeTeamColor,
                    awayTeamColor
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newGameId = createGameResponse.data.id;
            setGameId(newGameId);
            logger.info(`Game record created with ID: ${newGameId}`);

            // Step 2: Upload File
            const formData = new FormData();
            formData.append('video', file);
            formData.append('gameId', newGameId);

            await apiClient.post('/games/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                },
            });

            logger.info('File upload successful.');
            setStep('STATUS');
        } catch (err: any) {
            logger.error('Upload failed:', err);
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const renderMetadataStep = () => (
        <form onSubmit={handleMetadataSubmit} className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-tx-secondary">Game Information</h3>
            
            <md-filled-text-field
                label="Game Name"
                value={gameName}
                onInput={(e: any) => setGameName(e.target.value)}
                required
                className="w-full"
            ></md-filled-text-field>

            <div className="flex flex-col md:flex-row gap-4">
                <md-filled-select
                    label="Game Format"
                    value={gameType}
                    onchange={(e: any) => {
                        const val = e.target.value as GameType;
                        setGameType(val);
                        if (val === GameType.THREE_X_THREE || val === GameType.STREET_BALL) {
                            setPointValue('1_AND_2');
                        } else {
                            setPointValue('2_AND_3');
                        }
                    }}
                    className="flex-1"
                >
                    <md-select-option value={GameType.FULL_COURT}><span>Full Court</span></md-select-option>
                    <md-select-option value={GameType.THREE_X_THREE}><span>3x3</span></md-select-option>
                    <md-select-option value={GameType.STREET_BALL}><span>Park/Street</span></md-select-option>
                    <md-select-option value={GameType.ONE_X_ONE}><span>1-on-1</span></md-select-option>
                </md-filled-select>

                <md-filled-select
                    label="Detection Logic"
                    value={identityMode}
                    onchange={(e: any) => setIdentityMode(e.target.value as IdentityMode)}
                    className="flex-1"
                >
                    <md-select-option value={IdentityMode.JERSEY_COLORS}><span>Uniform Colors</span></md-select-option>
                    <md-select-option value={IdentityMode.INTERACTION_BASED}><span>Interaction Flow</span></md-select-option>
                </md-filled-select>
            </div>

            <div className="flex items-center gap-6 px-4 py-3 bg-container-low rounded-lg border border-bd-ghost">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tx-dim">Point Values:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <md-radio 
                        name="scoring" 
                        value="2_AND_3" 
                        checked={pointValue === '2_AND_3'} 
                        onchange={() => setPointValue('2_AND_3')}
                    ></md-radio>
                    <span className="text-xs font-semibold text-tx-secondary">Standard (2/3)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <md-radio 
                        name="scoring" 
                        value="1_AND_2" 
                        checked={pointValue === '1_AND_2'} 
                        onchange={() => setPointValue('1_AND_2')}
                    ></md-radio>
                    <span className="text-xs font-semibold text-tx-secondary">Small Court (1/2)</span>
                </label>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <md-filled-text-field
                    label="Date"
                    type="date"
                    value={gameDate}
                    onInput={(e: any) => setGameDate(e.target.value)}
                    className="flex-1"
                ></md-filled-text-field>
                <md-filled-text-field
                    label="Location"
                    value={location}
                    onInput={(e: any) => setLocation(e.target.value)}
                    className="flex-1"
                ></md-filled-text-field>
            </div>

            {identityMode === IdentityMode.JERSEY_COLORS && (
                <div className="flex flex-col gap-4 py-4 border-t border-bd-ghost">
                    <div className="flex flex-col md:flex-row gap-4">
                        <md-filled-select
                            label="Home Team"
                            value={homeTeamId}
                            onchange={(e: any) => setHomeTeamId(e.target.value)}
                            className="flex-1"
                        >
                            <md-select-option value=""><span>Select Team</span></md-select-option>
                            {teams?.map(t => (
                                <md-select-option key={t.id} value={t.id}><span>{t.name}</span></md-select-option>
                            ))}
                        </md-filled-select>

                        <md-filled-select
                            label="Jersey Color"
                            value={homeTeamColor}
                            onchange={(e: any) => setHomeTeamColor(e.target.value)}
                            className="flex-1"
                        >
                            {colors.map(c => (
                                <md-select-option key={c} value={c}><span>{c}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <md-filled-select
                            label="Away Team"
                            value={awayTeamId}
                            onchange={(e: any) => setAwayTeamId(e.target.value)}
                            className="flex-1"
                        >
                            <md-select-option value=""><span>Select Team</span></md-select-option>
                            {teams?.map(t => (
                                <md-select-option key={t.id} value={t.id}><span>{t.name}</span></md-select-option>
                            ))}
                        </md-filled-select>

                        <md-filled-select
                            label="Jersey Color"
                            value={awayTeamColor}
                            onchange={(e: any) => setAwayTeamColor(e.target.value)}
                            className="flex-1"
                        >
                            {colors.map(c => (
                                <md-select-option key={c} value={c}><span>{c}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-bd-ghost pt-6">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Next Step</Button>
            </div>
        </form>
    );

    const renderUploadStep = () => (
        <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-tx-secondary">Media Upload</h3>
            <p className="text-xs font-medium text-tx-dim">
                Please select the video file for <span className="text-white font-semibold">{gameName}</span>.
            </p>

            <div className="relative border border-dashed border-bd-ghost p-12 rounded-xl text-center bg-container-low hover:bg-container-high transition-colors group cursor-pointer">
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    id="video-file-input"
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center">
                    <span className={`material-symbols-outlined text-4xl mb-3 transition-colors ${file ? 'text-electric' : 'text-tx-dim group-hover:text-electric'}`}>
                        {file ? 'check_circle' : 'upload_file'}
                    </span>
                    <p className="text-sm font-semibold text-white mb-1">
                        {file ? file.name : 'Select video recording'}
                    </p>
                    {!file && <p className="text-[10px] font-medium text-tx-dim uppercase tracking-wider">MP4, MOV, or AVI preferred</p>}
                </div>
            </div>

            {isUploading && (
                <div className="mt-4 p-5 bg-container-low rounded-lg border border-bd-ghost">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tx-secondary">Uploading...</span>
                        <span className="text-[10px] font-bold text-white mono-stat">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-container-highest rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-electric transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span className="text-xs font-semibold">{error}</span>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-bd-ghost pt-6">
                <Button variant="outline" onClick={() => setStep('METADATA')} disabled={isUploading}>Back</Button>
                <Button onClick={handleUpload} isLoading={isUploading} disabled={!file}>
                    Start Processing
                </Button>
            </div>
        </div>
    );

    const renderStatusStep = () => (
        <div className="text-center py-8">
            <div className="mb-6">
                <span className="material-symbols-outlined text-6xl text-electric opacity-80">
                    check_circle
                </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Video Received</h3>
            <p className="text-sm font-medium text-tx-secondary leading-relaxed mb-8 max-w-sm mx-auto">
                Processing for <span className="text-white font-semibold">{gameName}</span> has started. This may take some time. We will notify you once the stats are ready.
            </p>
            <Button onClick={onUploadComplete} fullWidth>Return to Dashboard</Button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-8 bg-container rounded-2xl border border-bd-ghost shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                {step === 'METADATA' && renderMetadataStep()}
                {step === 'UPLOAD' && renderUploadStep()}
                {step === 'STATUS' && renderStatusStep()}
            </div>
        </div>
    );
};

export default UploadForm;
