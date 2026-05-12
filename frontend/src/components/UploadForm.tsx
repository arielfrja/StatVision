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
            <h3 className="text-lg font-black italic uppercase tracking-tight text-electric">Step 1: Game Details</h3>
            
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
                    <md-select-option value={GameType.FULL_COURT}><span>Full Court (Standard)</span></md-select-option>
                    <md-select-option value={GameType.THREE_X_THREE}><span>FIBA 3x3</span></md-select-option>
                    <md-select-option value={GameType.STREET_BALL}><span>Streetball / Park</span></md-select-option>
                    <md-select-option value={GameType.ONE_X_ONE}><span>1-on-1</span></md-select-option>
                </md-filled-select>

                <md-filled-select
                    label="Team Detection Mode"
                    value={identityMode}
                    onchange={(e: any) => setIdentityMode(e.target.value as IdentityMode)}
                    className="flex-1"
                >
                    <md-select-option value={IdentityMode.JERSEY_COLORS}><span>Jersey Colors</span></md-select-option>
                    <md-select-option value={IdentityMode.INTERACTION_BASED}><span>Interaction-based (Streetball)</span></md-select-option>
                </md-filled-select>
            </div>

            <div className="flex items-center gap-6 px-4 py-3 bg-container-low rounded-xl border border-bd-ghost">
                <span className="text-[10px] font-black uppercase tracking-widest text-tx-dim">Scoring:</span>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <md-radio 
                        name="scoring" 
                        value="2_AND_3" 
                        checked={pointValue === '2_AND_3'} 
                        onchange={() => setPointValue('2_AND_3')}
                    ></md-radio>
                    <span className="text-xs font-bold text-tx-secondary group-hover:text-white transition-colors">2s & 3s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <md-radio 
                        name="scoring" 
                        value="1_AND_2" 
                        checked={pointValue === '1_AND_2'} 
                        onchange={() => setPointValue('1_AND_2')}
                    ></md-radio>
                    <span className="text-xs font-bold text-tx-secondary group-hover:text-white transition-colors">1s & 2s</span>
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
                <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
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
                <Button type="submit" icon="arrow_forward">Next: Upload Video</Button>
            </div>
        </form>
    );

    const renderUploadStep = () => (
        <div className="flex flex-col gap-6">
            <h3 className="text-lg font-black italic uppercase tracking-tight text-electric">Step 2: Upload Video</h3>
            <p className="text-xs font-bold text-tx-dim uppercase tracking-wider">
                Upload the game recording for <span className="text-white">{gameName}</span>.
            </p>

            <div className="relative border-2 border-dashed border-bd-ghost p-12 rounded-2xl text-center bg-container-low hover:bg-container-high transition-colors group cursor-pointer overflow-hidden">
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    id="video-file-input"
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center">
                    <span className={`material-symbols-outlined text-5xl mb-4 transition-colors ${file ? 'text-electric' : 'text-tx-dim group-hover:text-electric'}`}>
                        {file ? 'check_circle' : 'cloud_upload'}
                    </span>
                    <p className="text-sm font-black uppercase tracking-widest text-white mb-1">
                        {file ? file.name : 'Click to select video file'}
                    </p>
                    {!file && <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">MP4, MOV or AVI (Max 500MB)</p>}
                </div>
                
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-electric opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {isUploading && (
                <div className="mt-4 p-6 bg-container-low rounded-xl border border-bd-ghost animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-electric">Uploading Video</span>
                        <span className="text-[10px] font-black tracking-widest text-white">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-container-highest rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-electric shadow-[0_0_10px_var(--primary-electric)] transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[8px] font-bold text-tx-dim uppercase tracking-[0.2em] mt-3 text-center animate-pulse">
                        Encrypting & Streaming to Worker
                    </p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-bd-ghost pt-6">
                <Button variant="outline" onClick={() => setStep('METADATA')} disabled={isUploading}>Back</Button>
                <Button onClick={handleUpload} isLoading={isUploading} disabled={!file} icon="bolt">
                    Start Analysis
                </Button>
            </div>
        </div>
    );

    const renderStatusStep = () => (
        <div className="text-center py-10 animate-in fade-in zoom-in duration-700">
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-electric blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <span className="material-symbols-outlined text-8xl text-electric relative z-10 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                    task_alt
                </span>
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-4">Upload Complete!</h3>
            <p className="text-sm font-bold text-tx-secondary uppercase tracking-wider leading-relaxed mb-10 max-w-sm mx-auto">
                Your video for <span className="text-electric">{gameName}</span> is being processed.<br/>
                We'll notify you when the analysis is ready.
            </p>
            <Button onClick={onUploadComplete} size="lg" fullWidth icon="dashboard">Return to Dashboard</Button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-10 bg-container rounded-[32px] border border-bd-ghost shadow-2xl overflow-hidden relative">
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-electric/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
                {step === 'METADATA' && renderMetadataStep()}
                {step === 'UPLOAD' && renderUploadStep()}
                {step === 'STATUS' && renderStatusStep()}
            </div>
        </div>
    );
};

export default UploadForm;
