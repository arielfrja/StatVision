/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import axios from 'axios';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Game, GameStatus } from '@/types/game';
import Button from '@/components/Button';
import Loader from '@/components/Loader';

import '@material/web/textfield/filled-text-field.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/linear-progress.js';

interface UploadFormProps {
    onUploadComplete: () => void;
    onCancel: () => void;
    initialGameId?: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, onCancel, initialGameId }) => {
    const { getAccessTokenSilently } = useAuth0();

    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [gameName, setGameName] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('Initializing...');
    const [status, setStatus] = useState<'READY' | 'UPLOADING' | 'FINALIZING' | 'ERROR' | 'COMPLETE'>('READY');
    
    // Persistence state
    const [activeGameId, setActiveGameId] = useState<string | null>(initialGameId || null);
    const [activeUploadUrl, setActiveUploadUrl] = useState<string | null>(null);
    const [activeGcsUri, setActiveGcsUri] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (!activeGameId) {
            const savedId = localStorage.getItem('statvision_active_upload_id');
            if (savedId) setActiveGameId(savedId);
        }
    }, []);

    useEffect(() => {
        const fetchExistingUpload = async () => {
            if (activeGameId && !activeUploadUrl && mounted) {
                try {
                    const token = await getAccessTokenSilently();
                    const gameResponse = await apiClient.get(`/games/${activeGameId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const game: Game = gameResponse.data;
                    setGameName(game.name);
                    
                    if (game.status !== GameStatus.PENDING) {
                        setStatus('COMPLETE');
                        return;
                    }

                    setStatus('READY');
                    setError('Previous ingestion attempt was incomplete. Please re-select the game footage to continue.');
                } catch (err) {
                    console.error('Failed to restore ingestion session:', err);
                }
            }
        };
        
        fetchExistingUpload();
    }, [activeGameId, mounted]);

    if (!mounted) return <div className="flex items-center justify-center h-[400px]"><Loader size="large" /></div>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null);
            setStatus('READY');
            setProgress(0);

            if (!gameName) {
                setGameName(selectedFile.name.split('.')[0].replace(/[-_]/g, ' '));
            }
        }
    };

    /**
     * Intelligent Handshake: Polls the backend until GCS finalization is confirmed.
     */
    const finalizeIngestion = async (gameId: string, gcsUri: string, attempt = 1): Promise<boolean> => {
        if (attempt > 10) return false;

        try {
            const token = await getAccessTokenSilently();
            const response = await apiClient.post(`/${gameId}/upload-complete`, { gcsUri }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'SUCCESS') {
                return true;
            }

            // If pending storage, wait and retry
            if (response.data.status === 'PENDING_STORAGE') {
                setProgressLabel(`Cloud Finalization (Attempt ${attempt}/10)...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return await finalizeIngestion(gameId, gcsUri, attempt + 1);
            }

            return false;
        } catch (err) {
            console.warn(`Finalization attempt ${attempt} failed:`, err);
            if (attempt < 5) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await finalizeIngestion(gameId, gcsUri, attempt + 1);
            }
            return false;
        }
    };

    const handleFastUpload = async () => {
        if (!file) {
            setError('Please select a video file to begin.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStatus('UPLOADING');

        try {
            const token = await getAccessTokenSilently();
            let gameId = activeGameId;
            let uploadUrl = activeUploadUrl;
            let gcsUri = activeGcsUri;

            // Step 1: Create Game Record
            if (!gameId) {
                setProgressLabel('Establishing game record...');
                const createGameResponse = await apiClient.post('/games', {
                    name: gameName || undefined,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                gameId = createGameResponse.data.id;
                setActiveGameId(gameId);
                if (gameId) localStorage.setItem('statvision_active_upload_id', gameId);
            }

            // Step 2: Get Resumable Upload URL
            if (!uploadUrl) {
                setProgressLabel('Securing cloud ingestion link...');
                const urlResponse = await apiClient.get(`/games/${gameId}/upload-url`, {
                    params: {
                        fileName: file.name,
                        contentType: file.type || 'video/mp4'
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });
                uploadUrl = urlResponse.data.uploadUrl;
                gcsUri = urlResponse.data.gcsUri;
                setActiveUploadUrl(uploadUrl);
                setActiveGcsUri(gcsUri);
            }

            // Step 3: Perform Direct Upload
            const isLocal = uploadUrl!.includes('localhost') || !uploadUrl!.startsWith('http');
            
            if (isLocal) {
                setProgressLabel('Streaming video (local)...');
                const formData = new FormData();
                formData.append('file', file);
                await apiClient.put(uploadUrl!, formData, {
                    onUploadProgress: (p) => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                });
            } else {
                setProgressLabel('Streaming video to cloud...');
                let startByte = 0;
                try {
                    const checkResponse = await axios.put(uploadUrl!, null, {
                        headers: { 'Content-Range': `bytes */${file.size}` },
                        validateStatus: (status) => status === 308
                    });
                    const rangeHeader = checkResponse.headers['range'];
                    if (rangeHeader) {
                        const parts = rangeHeader.split('=')[1].split('-');
                        startByte = parseInt(parts[1], 10) + 1;
                    }
                } catch (e) {}

                const chunkToUpload = file.slice(startByte);
                await axios.put(uploadUrl!, chunkToUpload, {
                    headers: { 
                        'Content-Type': file.type || 'video/mp4',
                        'Content-Range': `bytes ${startByte}-${file.size - 1}/${file.size}`
                    },
                    onUploadProgress: (p) => {
                        if (p.total) {
                            const totalUploaded = startByte + p.loaded;
                            setProgress(Math.round((totalUploaded * 100) / file.size));
                        }
                    }
                });
            }

            // Step 4: Robust Confirm Handshake
            setStatus('FINALIZING');
            setProgressLabel('Confirming cloud persistence...');
            
            const success = await finalizeIngestion(gameId!, gcsUri!);

            if (success) {
                localStorage.removeItem('statvision_active_upload_id');
                setStatus('COMPLETE');
                onUploadComplete();
            } else {
                setError('Cloud finalization taking longer than expected. The analysis may still start shortly. Please check the dashboard in a moment.');
                setStatus('ERROR');
            }
        } catch (err: any) {
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
            setStatus('ERROR'); 
        } finally {
            setIsProcessing(false);
        }
    };

    if (status === 'COMPLETE') {
        return (
            <div className="max-w-xl mx-auto p-12 bg-surface rounded-md border border-border-main text-center animate-in fade-in zoom-in-95">
                <span className="material-symbols-outlined text-5xl text-success mb-6">check_circle</span>
                <h3 className="text-xl font-bold text-tx-primary mb-2">Ingestion Successful</h3>
                <p className="text-sm text-tx-secondary mb-10 max-w-xs mx-auto">
                    The video for <span className="text-tx-primary font-bold">{gameName}</span> is now being processed by the AI engine.
                </p>
                <Button onClick={onUploadComplete} fullWidth size="lg">Open Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-8 bg-surface rounded-md border border-border-main space-y-8">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-tx-secondary">Game Ingestion</h3>
                <p className="text-xs text-tx-dim">Upload raw footage to begin automated event detection.</p>
            </div>

            <div className="space-y-6">
                <div className={`relative border border-dashed rounded-md p-12 text-center transition-colors group ${file ? 'border-accent bg-accent/5' : 'border-border-main bg-primary-bg hover:border-tx-dim'}`}>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center">
                        <span className={`material-symbols-outlined text-4xl mb-4 ${file ? 'text-accent' : 'text-tx-dim group-hover:text-tx-secondary'}`}>
                            {file ? 'video_file' : 'upload_file'}
                        </span>
                        <p className="text-sm font-bold text-tx-primary mb-1">
                            {file ? file.name : 'Select game recording'}
                        </p>
                        <p className="text-[10px] font-bold text-tx-dim uppercase tracking-widest">MP4 / MOV / AVI</p>
                    </div>
                </div>

                {/* @ts-ignore */}
                <md-filled-text-field
                    label="Game Title"
                    value={gameName}
                    onInput={(e: any) => setGameName(e.target.value)}
                    className="w-full"
                    disabled={isProcessing}
                    style={{ '--md-sys-shape-corner-extra-small': '4px' }}
                />
            </div>

            {(isProcessing || status === 'FINALIZING') && (
                <div className="p-4 bg-surface-high rounded-md border border-border-main space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{progressLabel}</span>
                        <span className="text-[10px] font-bold text-tx-primary mono-stat">{progress}%</span>
                    </div>
                    {/* @ts-ignore */}
                    <md-linear-progress value={progress / 100} style={{ '--md-sys-color-primary': 'var(--accent)' }} />
                </div>
            )}

            {error && (
                <div className="p-4 bg-error/10 border border-error/30 text-error rounded-md flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span className="text-xs font-medium">{error}</span>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-border-main">
                <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
                <Button onClick={handleFastUpload} isLoading={isProcessing} disabled={!file} size="lg">
                    {activeGameId ? 'Resume Ingestion' : 'Begin Analysis'}
                </Button>
            </div>
        </div>
    );
};

export default UploadForm;
