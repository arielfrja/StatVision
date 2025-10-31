'use client';

import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { appLogger as logger } from '@/utils/Logger';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/icon/icon.js';

interface UploadFormProps {
    onUploadComplete: () => void;
    onCancel: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, onCancel }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [file, setFile] = useState<File | null>(null);
    const [gameName, setGameName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !gameName) {
            setError('Please provide a game name and select a video file.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setProgress(0);

        try {
            const token = await getAccessTokenSilently();
            const API_BASE_URL = 'http://localhost:3000'; // Should be moved to config

            // Step 1: Create a new Game record to get a gameId
            // NOTE: This assumes a POST /games endpoint exists to create a new game record.
            const createGameResponse = await axios.post(`${API_BASE_URL}/games`, {
                name: gameName,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const gameId = createGameResponse.data.id;
            logger.info(`Game record created with ID: ${gameId}`);

            // Step 2: Upload the file using the gameId
            const formData = new FormData();
            formData.append('video', file);
            formData.append('gameId', gameId);

            await axios.post(`${API_BASE_URL}/games/upload`, formData, {
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
            onUploadComplete();
        } catch (err: any) {
            logger.error('Upload failed:', err);
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
            setIsUploading(false);
            setProgress(0);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid var(--md-sys-color-outline)', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface-container-low)' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--md-sys-color-primary)' }}>Analyze New Game</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <md-filled-text-field
                    label="Game Name (e.g., Lakers vs Celtics - 2025-10-29)"
                    value={gameName}
                    onInput={(e: any) => setGameName(e.target.value)}
                    required
                    style={{ width: '100%' }}
                ></md-filled-text-field>

                <div style={{ border: '1px dashed var(--md-sys-color-outline)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="video-file-input"
                    />
                    <label htmlFor="video-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                        <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-primary)' }}>video_file</md-icon>
                        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px' }}>
                            {file ? `Selected: ${file.name}` : 'Click to select video file'}
                        </p>
                    </label>
                </div>

                {isUploading && (
                    <div style={{ width: '100%', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '10px',
                                backgroundColor: 'var(--md-sys-color-primary)',
                                transition: 'width 0.3s ease-in-out',
                            }}
                        ></div>
                        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', padding: '4px 0' }}>
                            Uploading... {progress}%
                        </p>
                    </div>
                )}

                {error && (
                    <p style={{ color: 'var(--md-sys-color-error)', textAlign: 'center' }}>{error}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <md-filled-button type="button" onClick={onCancel} disabled={isUploading} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-surface-container-high)' }}>
                        Cancel
                    </md-filled-button>
                    <md-filled-button type="submit" disabled={isUploading || !file || !gameName}>
                        <md-icon slot="icon">cloud_upload</md-icon>
                        {isUploading ? 'Uploading...' : 'Start Analysis'}
                    </md-filled-button>
                </div>
            </form>
        </div>
    );
};

export default UploadForm;