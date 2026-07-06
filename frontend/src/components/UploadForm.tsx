/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import axios from 'axios';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Game, GameStatus } from '@/types/game';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/progress/circular-progress.js';
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
    const [isResumable, setIsResumable] = useState(false);
    const [resumableFileMetadata, setResumableFileMetadata] = useState<{name: string, size: number} | null>(null);
    const [isExplicitResume, setIsExplicitResume] = useState(!!initialGameId);

    const abortControllerRef = React.useRef<AbortController | null>(null);

    useEffect(() => {
        setMounted(true);
        const savedId = localStorage.getItem('statvision_active_upload_id');
        const savedName = localStorage.getItem('statvision_active_upload_filename');
        const savedSize = localStorage.getItem('statvision_active_upload_filesize');

        // Only load background state if we are in explicit resume mode
        // OR if we want to check for file matching later
        if (!activeGameId && savedId) {
            setActiveGameId(savedId);
        }

        if (savedName && savedSize) {
            setResumableFileMetadata({ name: savedName, size: parseInt(savedSize, 10) });
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
                    
                    if (game.status !== GameStatus.PENDING) {
                        // If it's not pending, we shouldn't be resuming it
                        setActiveGameId(null);
                        localStorage.removeItem('statvision_active_upload_id');
                        localStorage.removeItem('statvision_active_upload_filename');
                        localStorage.removeItem('statvision_active_upload_filesize');
                        return;
                    }

                    if (!gameName) setGameName(game.name);
                    setStatus('READY');
                } catch (err) {
                    console.error('Failed to restore upload session:', err);
                }
            }
        };
        
        fetchExistingUpload();
    }, [activeGameId, mounted]);

    if (!mounted) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}><md-circular-progress indeterminate></md-circular-progress></div>;

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

            // Identity Check: Can we resume?
            if (activeGameId) {
                if (resumableFileMetadata) {
                    const matches = selectedFile.name === resumableFileMetadata.name && 
                                   selectedFile.size === resumableFileMetadata.size;
                    setIsResumable(matches);
                } else {
                    // If we have activeGameId (e.g. from Retry button) but no local metadata,
                    // we assume user knows what they're doing for now, but will save metadata on start.
                    setIsResumable(true);
                }
            } else {
                setIsResumable(false);
            }
        }
    };

    const handleStartAgain = () => {
        setActiveGameId(null);
        setActiveUploadUrl(null);
        setActiveGcsUri(null);
        setIsResumable(false);
        setResumableFileMetadata(null);
        localStorage.removeItem('statvision_active_upload_id');
        localStorage.removeItem('statvision_active_upload_filename');
        localStorage.removeItem('statvision_active_upload_filesize');
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        onCancel();
    };

    /**
     * Intelligent Handshake: Polls the backend until GCS finalization is confirmed.
     */
    const finalizeUpload = async (gameId: string, gcsUri: string, attempt = 1): Promise<boolean> => {
        if (attempt > 10) return false;

        try {
            const token = await getAccessTokenSilently();
            const response = await apiClient.post(`/games/${gameId}/upload-complete`, { gcsUri }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'SUCCESS') {
                return true;
            }

            // If pending storage, wait and retry
            if (response.data.status === 'PENDING_STORAGE') {
                setProgressLabel(`Cloud Finalization (Attempt ${attempt}/10)...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return await finalizeUpload(gameId, gcsUri, attempt + 1);
            }

            return false;
        } catch (err) {
            console.warn(`Finalization attempt ${attempt} failed:`, err);
            if (attempt < 5) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await finalizeUpload(gameId, gcsUri, attempt + 1);
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
        abortControllerRef.current = new AbortController();

        try {
            const token = await getAccessTokenSilently();
            
            // Resume only if:
            // 1. It's an explicit resume (arrived via 'Retry' button)
            // 2. AND the selected file identity matches the previous attempt
            const shouldResume = isExplicitResume && isResumable;

            let gameId = shouldResume ? activeGameId : null;
            let uploadUrl = shouldResume ? activeUploadUrl : null;
            let gcsUri = shouldResume ? activeGcsUri : null;

            // Step 1: Create Game Record if not resuming
            if (!gameId) {
                setProgressLabel('Establishing game record...');
                const createGameResponse = await apiClient.post('/games', {
                    name: gameName || undefined,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                gameId = createGameResponse.data.id;
                setActiveGameId(gameId);
                
                // Persist session identity
                if (gameId) {
                    localStorage.setItem('statvision_active_upload_id', gameId);
                    localStorage.setItem('statvision_active_upload_filename', file.name);
                    localStorage.setItem('statvision_active_upload_filesize', file.size.toString());
                    setResumableFileMetadata({ name: file.name, size: file.size });
                    setIsResumable(true);
                }
            }

            // Step 2: Get Resumable Upload URL if we don't have one for this gameId
            if (!uploadUrl) {
                setProgressLabel('Securing cloud upload link...');
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
                    signal: abortControllerRef.current?.signal,
                    onUploadProgress: (p) => {
                        if (p.total) {
                            const percent = Math.round((p.loaded * 99) / p.total);
                            setProgress(percent);
                        }
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
                    signal: abortControllerRef.current?.signal,
                    headers: { 
                        'Content-Type': file.type || 'video/mp4',
                        'Content-Range': `bytes ${startByte}-${file.size - 1}/${file.size}`
                    },
                    onUploadProgress: (p) => {
                        if (p.total) {
                            const totalUploaded = startByte + p.loaded;
                            // Limit to 99% during stream
                            const percent = Math.min(99, Math.round((totalUploaded * 99) / file.size));
                            setProgress(percent);
                        }
                    }
                });
            }

            // Step 4: Robust Confirm Handshake
            setStatus('FINALIZING');
            setProgress(99);
            setProgressLabel('Confirming cloud persistence...');
            
            const success = await finalizeUpload(gameId!, gcsUri!);

            if (success) {
                setProgress(100);
                localStorage.removeItem('statvision_active_upload_id');
                localStorage.removeItem('statvision_active_upload_filename');
                localStorage.removeItem('statvision_active_upload_filesize');
                setStatus('COMPLETE');
                onUploadComplete();
            } else {
                setError('Cloud finalization taking longer than expected. The analysis may still start shortly. Please check the dashboard in a moment.');
                setStatus('ERROR');
            }
        } catch (err: any) {
            if (axios.isCancel(err)) {
                logger.info('Upload cancelled by user');
                return;
            }
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
            setStatus('ERROR'); 
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
        }
    };

    if (status === 'COMPLETE') {
        return (
            <div
                style={{
                    maxWidth: '576px',
                    margin: '0 auto',
                    padding: '48px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    textAlign: 'center',
                }}
            >
                <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-tertiary)', marginBottom: '24px' }}>check_circle</md-icon>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>Upload Successful</h3>
                <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '40px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                    The video for <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold' }}>{gameName}</span> is now being processed by the AI engine.
                </p>
                <md-filled-button onClick={onUploadComplete} style={{width: '100%'}}>Open Dashboard</md-filled-button>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: '576px',
                margin: '0 auto',
                padding: '32px',
                backgroundColor: 'var(--md-sys-color-surface)',
                borderRadius: '6px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Game Upload
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>
                    Upload raw footage to begin automated event detection.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div
                    style={{
                        position: 'relative',
                        border: '1px dashed',
                        borderRadius: '6px',
                        padding: '48px',
                        textAlign: 'center',
                        borderColor: file ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                        backgroundColor: file
                            ? 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)'
                            : 'var(--md-sys-color-surface-container-high)',
                    }}
                >
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 10,
                            width: '100%',
                            height: '100%',
                        }}
                        disabled={isProcessing}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <md-icon
                            style={{
                                fontSize: '36px',
                                marginBottom: '16px',
                                color: file ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                            }}
                        >
                            {file ? 'video_file' : 'upload_file'}
                        </md-icon>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                            {file ? file.name : 'Select game recording'}
                        </p>
                        <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                            MP4 / MOV / AVI
                        </p>
                    </div>
                </div>

                {/* @ts-ignore */}
                <md-filled-text-field
                    label="Game Title"
                    value={gameName}
                    onInput={(e: any) => setGameName(e.target.value)}
                    style={{ width: '100%', '--md-sys-shape-corner-extra-small': '4px' }}
                    disabled={isProcessing}
                />
            </div>

            {(isProcessing || status === 'FINALIZING') && (
                <div
                    style={{
                        padding: '16px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        borderRadius: '6px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-sys-color-primary)' }}>
                            {progressLabel}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)' }}>
                            {progress}%
                        </span>
                    </div>
                    {/* @ts-ignore */}
                    <md-linear-progress value={progress / 100} style={{ '--md-sys-color-primary': 'var(--md-sys-color-primary)' }} />
                </div>
            )}

            {error && (
                <div
                    style={{
                        padding: '16px',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
                        color: 'var(--md-sys-color-error)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <md-icon style={{ fontSize: '16px' }}>error</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{error}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                <md-text-button onClick={handleCancel}>Cancel</md-text-button>
                
                {isExplicitResume && isResumable ? (
                    <>
                        <md-outlined-button 
                            onClick={handleStartAgain} 
                            disabled={isProcessing}
                        >
                            Start Again
                        </md-outlined-button>
                        <md-filled-button 
                            onClick={handleFastUpload} 
                            disabled={isProcessing || !file}
                        >
                            Resume Upload
                        </md-filled-button>
                    </>
                ) : (
                    <md-filled-button 
                        onClick={handleFastUpload} 
                        disabled={isProcessing || !file}
                    >
                        Upload
                    </md-filled-button>
                )}
            </div>
        </div>
    );
};

export default UploadForm;
