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

interface UploadFormProps {
    onUploadComplete: () => void;
    onCancel: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, onCancel }) => {
    const { getAccessTokenSilently } = useAuth0();

    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [gameName, setGameName] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'READY' | 'UPLOADING' | 'COMPLETE'>('READY');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="flex items-center justify-center h-[400px]"><Loader size="large" /></div>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!gameName) {
                // Pre-fill with a suggestion if name is empty
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
        setProgress(0);
        setStatus('UPLOADING');

        try {
            const token = await getAccessTokenSilently();

            // Step 1: Create Game Record (Draft)
            const createGameResponse = await apiClient.post('/games', {
                name: gameName || undefined,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newGameId = createGameResponse.data.id;
            logger.info(`Draft game created with ID: ${newGameId}`);

            // Step 2: Get Resumable Upload URL
            const urlResponse = await apiClient.get(`/games/${newGameId}/upload-url`, {
                params: {
                    fileName: file.name,
                    contentType: file.type || 'video/mp4'
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            const { uploadUrl, gcsUri } = urlResponse.data;
            logger.info(`Acquired resumable upload URL for game: ${newGameId}`);

            // Step 3: Perform Direct Upload
            // Note: For production GCS, we use simple PUT. 
            // For local dev mock, we use a small FormData helper.
            const isLocal = uploadUrl.includes('localhost') || !uploadUrl.startsWith('http');
            
            if (isLocal) {
                const formData = new FormData();
                formData.append('file', file);
                await apiClient.put(uploadUrl, formData, {
                    onUploadProgress: (p) => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                });
            } else {
                // Direct GCS PUT (Resumable)
                await apiClient.put(uploadUrl, file, {
                    headers: { 'Content-Type': file.type || 'video/mp4' },
                    onUploadProgress: (p) => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                });
            }

            // Step 4: Confirm Upload to Backend
            await apiClient.post(`/games/${newGameId}/upload-complete`, {
                gcsUri
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            logger.info('File upload and confirmation successful.');
            setStatus('COMPLETE');
        } catch (err: any) {
            logger.error('Upload failed:', err);
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
            setStatus('READY'); 
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tx-secondary">Streaming to AI Engine...</span>
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
                    Start Analysis
                </Button>
            </div>
        </div>
    );
};

export default UploadForm;
