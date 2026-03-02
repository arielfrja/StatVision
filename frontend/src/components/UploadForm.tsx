'use client';

import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Team, GameType, IdentityMode } from '@/types/game';

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

    const [step, setStep] = useState<Step>('METADATA');
    const [file, setFile] = useState<File | null>(null);
    const [gameName, setGameName] = useState('');
    const [gameDate, setGameDate] = useState('');
    const [location, setLocation] = useState('');
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [homeTeamColor, setHomeTeamColor] = useState('White');
    const [awayTeamColor, setAwayTeamColor] = useState('Black');
    
    // New States
    const [gameType, setGameType] = useState<GameType>(GameType.FULL_COURT);
    const [identityMode, setIdentityMode] = useState<IdentityMode>(IdentityMode.JERSEY_COLORS);
    const [pointValue, setPointValue] = useState<'1_AND_2' | '2_AND_3'>( '2_AND_3');

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [gameId, setGameId] = useState<string | null>(null);

    const colors = ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Navy', 'Grey'];

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
        <form onSubmit={handleMetadataSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--md-sys-color-primary)' }}>Step 1: Game Details</h3>
            
            <md-filled-text-field
                label="Game Name"
                value={gameName}
                onInput={(e: any) => setGameName(e.target.value)}
                required
            ></md-filled-text-field>

            <div style={{ display: 'flex', gap: '16px' }}>
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
                    style={{ flex: 1 }}
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
                    style={{ flex: 1 }}
                >
                    <md-select-option value={IdentityMode.JERSEY_COLORS}><span>Jersey Colors</span></md-select-option>
                    <md-select-option value={IdentityMode.INTERACTION_BASED}><span>Interaction-based (Streetball)</span></md-select-option>
                </md-filled-select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '0 16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>Scoring:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <md-radio 
                        name="scoring" 
                        value="2_AND_3" 
                        checked={pointValue === '2_AND_3'} 
                        onchange={() => setPointValue('2_AND_3')}
                    ></md-radio>
                    <span style={{ fontSize: '14px' }}>2s & 3s</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <md-radio 
                        name="scoring" 
                        value="1_AND_2" 
                        checked={pointValue === '1_AND_2'} 
                        onchange={() => setPointValue('1_AND_2')}
                    ></md-radio>
                    <span style={{ fontSize: '14px' }}>1s & 2s</span>
                </label>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <md-filled-text-field
                    label="Date"
                    type="date"
                    value={gameDate}
                    onInput={(e: any) => setGameDate(e.target.value)}
                    style={{ flex: 1 }}
                ></md-filled-text-field>
                <md-filled-text-field
                    label="Location"
                    value={location}
                    onInput={(e: any) => setLocation(e.target.value)}
                    style={{ flex: 1 }}
                ></md-filled-text-field>
            </div>

            {identityMode === IdentityMode.JERSEY_COLORS && (
                <>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <md-filled-select
                            label="Home Team"
                            value={homeTeamId}
                            onchange={(e: any) => setHomeTeamId(e.target.value)}
                            style={{ flex: 1 }}
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
                            style={{ flex: 1 }}
                        >
                            {colors.map(c => (
                                <md-select-option key={c} value={c}><span>{c}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <md-filled-select
                            label="Away Team"
                            value={awayTeamId}
                            onchange={(e: any) => setAwayTeamId(e.target.value)}
                            style={{ flex: 1 }}
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
                            style={{ flex: 1 }}
                        >
                            {colors.map(c => (
                                <md-select-option key={c} value={c}><span>{c}</span></md-select-option>
                            ))}
                        </md-filled-select>
                    </div>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <md-outlined-button type="button" onClick={onCancel}>Cancel</md-outlined-button>
                <md-filled-button type="submit">Next: Upload Video</md-filled-button>
            </div>
        </form>
    );

    const renderUploadStep = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: 'var(--md-sys-color-primary)' }}>Step 2: Upload Video</h3>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Upload the game recording for {gameName}.
            </p>

            <div style={{ border: '2px dashed var(--md-sys-color-outline)', padding: '40px', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="video-file-input"
                    disabled={isUploading}
                />
                <label htmlFor="video-file-input" style={{ cursor: isUploading ? 'default' : 'pointer', display: 'block' }}>
                    <md-icon style={{ fontSize: '64px', color: 'var(--md-sys-color-primary)', marginBottom: '16px' }}>
                        {file ? 'check_circle' : 'cloud_upload'}
                    </md-icon>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>
                        {file ? file.name : 'Click to select video file'}
                    </p>
                    {!file && <p style={{ fontSize: '12px', opacity: 0.7 }}>MP4, MOV or AVI (Max 500MB)</p>}
                </label>
            </div>

            {isUploading && (
                <div style={{ marginTop: '16px' }}>
                    <md-linear-progress value={progress / 100}></md-linear-progress>
                    <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px' }}>
                        Uploading... {progress}%
                    </p>
                </div>
            )}

            {error && (
                <div style={{ padding: '12px', backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <md-icon>error</md-icon>
                    <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <md-outlined-button onClick={() => setStep('METADATA')} disabled={isUploading}>Back</md-outlined-button>
                <md-filled-button onClick={handleUpload} disabled={isUploading || !file}>
                    {isUploading ? 'Uploading...' : 'Start Analysis'}
                </md-filled-button>
            </div>
        </div>
    );

    const renderStatusStep = () => (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <md-icon style={{ fontSize: '80px', color: 'var(--md-sys-color-success)', marginBottom: '24px' }}>task_alt</md-icon>
            <h3 style={{ marginBottom: '16px' }}>Upload Complete!</h3>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '32px' }}>
                Your video for <strong>{gameName}</strong> is being processed.<br/>
                We'll notify you when the analysis is ready.
            </p>
            <md-filled-button onClick={onUploadComplete}>Return to Dashboard</md-filled-button>
        </div>
    );

    return (
        <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '32px', 
            backgroundColor: 'var(--md-sys-color-surface-container)', 
            borderRadius: '24px',
            boxShadow: 'var(--shadow-elevation-2)'
        }}>
            {step === 'METADATA' && renderMetadataStep()}
            {step === 'UPLOAD' && renderUploadStep()}
            {step === 'STATUS' && renderStatusStep()}
        </div>
    );
};

export default UploadForm;
