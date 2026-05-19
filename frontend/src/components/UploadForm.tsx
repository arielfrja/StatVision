/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import useSWR from 'swr';
import axios from 'axios';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Team, GameType, IdentityMode, Game, GameStatus } from '@/types/game';
import Button from '@/components/Button';
import Loader from '@/components/Loader';

import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
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
    const [status, setStatus] = useState<'READY' | 'UPLOADING' | 'ERROR' | 'COMPLETE'>('READY');
    
    // Persistence state to allow retries without creating new games
    const [activeGameId, setActiveGameId] = useState<string | null>(initialGameId || null);
    const [activeUploadUrl, setActiveUploadUrl] = useState<string | null>(null);
    const [activeGcsUri, setActiveGcsUri] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        
        // Auto-load from localStorage if we are in a session
        if (!activeGameId) {
            const savedId = localStorage.getItem('statvision_active_upload_id');
            if (savedId) setActiveGameId(savedId);
        }
    }, []);

    // Effect to fetch details if we have an activeGameId but no URL
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
                    
                    // If it was already finished, just complete it
                    if (game.status !== GameStatus.PENDING) {
                        setStatus('COMPLETE');
                        return;
                    }

                    if (game.uploadUrl) {
                        setActiveUploadUrl(game.uploadUrl);
                        // We need the GCS URI too, which our API returns in the /upload-url endpoint
                        // Let's just trigger a re-fetch of the URL to be safe and consistent
                    }
                    
                    setStatus('ERROR');
                    setError('Previous upload was interrupted. Please re-select the file to resume.');
                } catch (err) {
                    console.error('Failed to restore upload session:', err);
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
            
            // If we are resuming, we don't reset the gameId, just the status
            if (!activeGameId) {
                setError(null);
                setStatus('READY');
                setProgress(0);
            } else {
                setStatus('ERROR'); // Still in error/resume mode but file is attached
                setError(null);
            }

            if (!gameName) {
                setGameName(selectedFile.name.split('.')[0].replace(/[-_]/g, ' '));
            }
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

            // Step 1: Create Game Record (Draft)
            if (!gameId) {
                setProgressLabel('Creating game record...');
                const createGameResponse = await apiClient.post('/games', {
                    name: gameName || undefined,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                gameId = createGameResponse.data.id;
                setActiveGameId(gameId);
                if (gameId) localStorage.setItem('statvision_active_upload_id', gameId);
                logger.info(`Draft game created with ID: ${gameId}`);
            }

            // Step 2: Get Resumable Upload URL
            if (!uploadUrl) {
                setProgressLabel('Requesting secure cloud link...');
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
                logger.info(`Acquired resumable upload URL for game: ${gameId}`);
            }

            // Step 3: Check Progress and Perform Direct Upload
            const isLocal = uploadUrl!.includes('localhost') || !uploadUrl!.startsWith('http');
            
            if (isLocal) {
                setProgressLabel('Streaming video locally...');
                const formData = new FormData();
                formData.append('file', file);
                await apiClient.put(uploadUrl!, formData, {
                    onUploadProgress: (p) => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                });
            } else {
                // 3a. Check if any bytes were already uploaded (Resumable Protocol)
                setProgressLabel('Checking cloud sync status...');
                let startByte = 0;
                try {
                    const checkResponse = await axios.put(uploadUrl!, null, {
                        headers: {
                            'Content-Range': `bytes */${file.size}`
                        },
                        validateStatus: (status) => status === 308
                    });
                    
                    const rangeHeader = checkResponse.headers['range'];
                    if (rangeHeader) {
                        const parts = rangeHeader.split('=')[1].split('-');
                        startByte = parseInt(parts[1], 10) + 1;
                        logger.info(`Resuming upload from byte: ${startByte}`);
                    }
                } catch (e) {
                    // 404 means the session expired, we'd need to clear activeUploadUrl and retry
                    // For now, assume 0 if check fails
                    logger.warn('Could not retrieve existing progress, starting from 0.');
                }

                // 3b. Direct GCS PUT (Resumable)
                setProgressLabel('Streaming video to Google Cloud...');
                const chunkToUpload = file.slice(startByte);
                
                try {
                    await axios.put(uploadUrl!, chunkToUpload, {
                        headers: { 
                            'Content-Type': file.type || 'video/mp4',
                            'Content-Range': `bytes ${startByte}-${file.size - 1}/${file.size}`
                        },
                        onUploadProgress: (p) => {
                            if (p.total) {
                                const uploadedInThisSession = p.loaded;
                                const totalUploaded = startByte + uploadedInThisSession;
                                const percent = Math.round((totalUploaded * 100) / file.size);
                                setProgress(percent);
                            }
                        }
                    });
                } catch (putErr: any) {
                    // Special case: if we hit a network error but progress is at 100%, 
                    // it often means Google finished but closed the connection. 
                    // We continue to Step 4 to check.
                    if (progress < 99) throw putErr;
                    logger.warn('Network error at 100%, attempting to verify with backend.');
                }
            }

            // Step 4: Confirm Upload to Backend
            setProgressLabel('Verifying upload and starting AI...');
            
            // Add a small breather for the browser network stack (especially on mobile)
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                await apiClient.post(`/games/${gameId}/upload-complete`, {
                    gcsUri
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                logger.info('File upload and confirmation successful.');
                localStorage.removeItem('statvision_active_upload_id');
                setStatus('COMPLETE');
                onUploadComplete();
            } catch (confirmErr: any) {
                logger.error('Finalization failed:', confirmErr);
                setError('Upload finished, but AI could not start. Please click Retry to notify the server.');
                setStatus('ERROR');
            }
        } catch (err: any) {
            logger.error('Upload failed:', err);
            setError(`Upload failed: ${err.response?.data?.message || err.message}. Please try again.`);
            setStatus('ERROR'); 
        } finally {
            setIsProcessing(false);
        }
    };

    if (status === 'COMPLETE') {
        return (
            <div className="max-w-2xl mx-auto p-12 bg-container rounded-2xl border border-bd-ghost text-center">
                <span className="material-symbols-outlined text-6xl text-electric mb-6">check_circle</span>
                <h3 className="text-xl font-bold text-white mb-3">Upload Successful</h3>
                <p className="text-sm font-medium text-tx-secondary mb-10 max-w-sm mx-auto">
                    Video for <span className="text-white font-semibold">{gameName}</span> is being processed. You can now finalize game details and assign players.
                </p>
                <Button onClick={onUploadComplete} fullWidth>Open Performance Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-8 bg-container rounded-2xl border border-bd-ghost shadow-2xl space-y-8">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-tx-secondary mb-2">Fast Upload</h3>
                <p className="text-xs font-medium text-tx-dim">Start analysis instantly. You can refine team details and player rosters later.</p>
            </div>

            <div className="space-y-6">
                {/* File Picker */}
                <div className={`relative border border-dashed rounded-xl p-10 text-center transition-colors group ${file ? 'border-electric bg-electric/5' : 'border-bd-ghost bg-container-low hover:bg-container-high'}`}>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center">
                        <span className={`material-symbols-outlined text-4xl mb-3 ${file ? 'text-electric' : 'text-tx-dim group-hover:text-white'}`}>
                            {file ? 'video_file' : 'upload_file'}
                        </span>
                        <p className="text-sm font-semibold text-white mb-1">
                            {file ? file.name : 'Select game recording'}
                        </p>
                        <p className="text-[10px] font-medium text-tx-dim uppercase tracking-wider">MP4, MOV, or AVI preferred</p>
                    </div>
                </div>

                {/* Optional Name */}
                <md-filled-text-field
                    label="Game Title (Optional)"
                    value={gameName}
                    onInput={(e: any) => setGameName(e.target.value)}
                    placeholder="e.g. Finals Q1 vs Raiders"
                    className="w-full"
                    disabled={isProcessing}
                ></md-filled-text-field>
            </div>

            {isProcessing && (
                <div className="p-5 bg-container-low rounded-lg border border-bd-ghost">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tx-secondary">{progressLabel}</span>
                        <span className="text-[10px] font-bold text-white mono-stat">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-electric transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span className="text-xs font-semibold">{error}</span>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-bd-ghost">
                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
                <Button onClick={handleFastUpload} isLoading={isProcessing} disabled={!file}>
                    {status === 'ERROR' ? 'Retry Upload' : 'Start Analysis'}
                </Button>
            </div>
        </div>
    );
};

export default UploadForm;
