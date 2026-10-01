/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@/app/user-provider';
import axios from 'axios';
import apiClient from '@/utils/apiClient';
import { appLogger as logger } from '@/utils/Logger';
import { Game, GameStatus } from '@/types/game';
import { Team } from '@/types/team';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/linear-progress.js';

interface UploadFormProps {
    onUploadComplete: () => void;
    onCancel: () => void;
    initialGameId?: string;
}

const ACCEPT = 'video/*,.webm,.mp4,.mov,.avi';
const ALLOWED_EXTS = ['mp4', 'webm', 'mov', 'avi'];
const MIN_FILE_BYTES = 1024; // reject empty/placeholder files pre-POST
const NEW_TEAM = '__new__';

const todayLocal = () => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
};

const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, onCancel, initialGameId }) => {
    const { getAccessTokenSilently } = useAuth0();

    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [gameName, setGameName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [gameDate, setGameDate] = useState(todayLocal());
    const [league, setLeague] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [homePick, setHomePick] = useState('');
    const [awayPick, setAwayPick] = useState('');
    const [homeNew, setHomeNew] = useState('');
    const [awayNew, setAwayNew] = useState('');
    const [teamsError, setTeamsError] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [loadedBytes, setLoadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [rateBps, setRateBps] = useState(0);
    const [progressLabel, setProgressLabel] = useState('Initializing...');
    const [status, setStatus] = useState<'READY' | 'UPLOADING' | 'FINALIZING' | 'ERROR' | 'COMPLETE'>('READY');

    // Persistence state
    const [activeGameId, setActiveGameId] = useState<string | null>(initialGameId || null);
    const [activeGcsUri, setActiveGcsUri] = useState<string | null>(null);
    const [isResumable, setIsResumable] = useState(false);
    const [resumableFileMetadata, setResumableFileMetadata] = useState<{name: string, size: number} | null>(null);
    const [isExplicitResume, setIsExplicitResume] = useState(!!initialGameId);
    // Backend no longer returns game.uploadUrl: a resume only means the game
    // still hasPendingUpload; the session URL is always re-issued via
    // GET /games/:id/upload-url. Anything else is an expired session that
    // requires the user to re-pick their file.
    const [sessionExpired, setSessionExpired] = useState(false);

    const abortControllerRef = React.useRef<AbortController | null>(null);
    const uploadStartRef = React.useRef<number>(0);

    const clearPersistedSession = () => {
        localStorage.removeItem('statvision_active_upload_id');
        localStorage.removeItem('statvision_active_upload_filename');
        localStorage.removeItem('statvision_active_upload_filesize');
    };

    const expireSession = (reason: string) => {
        setActiveGameId(null);
        setActiveGcsUri(null);
        setIsResumable(false);
        setResumableFileMetadata(null);
        setIsExplicitResume(false);
        clearPersistedSession();
        // Require an explicit re-pick: a stale File object must not auto-submit.
        setFile(null);
        setFileInputKey((k) => k + 1);
        setProgress(0);
        setLoadedBytes(0);
        setTotalBytes(0);
        setSessionExpired(true);
        setError(reason);
        setStatus('ERROR');
    };

    useEffect(() => {
        setMounted(true);
        const savedId = localStorage.getItem('statvision_active_upload_id') || initialGameId;
        const savedName = localStorage.getItem('statvision_active_upload_filename');
        const savedSize = localStorage.getItem('statvision_active_upload_filesize');

        if (savedId) {
            setActiveGameId(savedId);
        }

        if (savedName && savedSize) {
            setResumableFileMetadata({ name: savedName, size: parseInt(savedSize, 10) });
        }

        const loadTeams = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await apiClient.get('/teams', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeams(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to load teams for pickers:', err);
            }
        };
        loadTeams();
    }, []);

    useEffect(() => {
        const fetchExistingUpload = async () => {
            if (activeGameId && mounted) {
                try {
                    const token = await getAccessTokenSilently();
                    const gameResponse = await apiClient.get(`/games/${activeGameId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const game: Game = gameResponse.data;

                    // Resume gate: backend stripped game.uploadUrl, so the ONLY
                    // resume signal is hasPendingUpload (status PENDING).
                    const resumable = (game.hasPendingUpload ?? game.status === GameStatus.PENDING)
                        && game.status === GameStatus.PENDING;
                    if (!resumable) {
                        expireSession('Upload session expired — this game already has its video. Pick your file again to start a fresh upload.');
                        return;
                    }

                    if (!gameName) setGameName(game.name);
                    setStatus('READY');
                    setSessionExpired(false);
                } catch (err: any) {
                    console.error('Failed to restore upload session:', err);
                    if (err?.response?.status === 404) {
                        expireSession('Upload session expired — the draft game no longer exists. Pick your file again to start over.');
                    }
                }
            }
        };

        fetchExistingUpload();
    }, [activeGameId, mounted]);

    if (!mounted) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}><md-circular-progress indeterminate></md-circular-progress></div>;

    /**
     * Pre-POST client validation: extension + MIME allowlist, minimum size,
     * and a duration probe so text files (or corrupt clips) are rejected
     * before any game record or upload session is created.
     */
    const probeDuration = (f: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(f);
            const el = document.createElement('video');
            el.preload = 'metadata';
            el.onloadedmetadata = () => {
                const d = el.duration;
                URL.revokeObjectURL(url);
                resolve(d);
            };
            el.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('unreadable'));
            };
            el.src = url;
            // Safety timeout: some containers never fire metadata events.
            setTimeout(() => {
                URL.revokeObjectURL(url);
                reject(new Error('timeout'));
            }, 15000);
        });
    };

    const validateFile = async (selectedFile: File): Promise<string | null> => {
        const ext = (selectedFile.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXTS.includes(ext)) {
            return `Unsupported file type ".${ext || '?'}". Please choose a video file (MP4, WebM, MOV, or AVI) — text and document files are rejected before upload.`;
        }
        if (selectedFile.type && !selectedFile.type.startsWith('video/')) {
            return `This file reports type "${selectedFile.type}", not video. Please choose a real video file (MP4, WebM, MOV, or AVI).`;
        }
        if (selectedFile.size <= MIN_FILE_BYTES) {
            return 'This file is empty or too small (under 1 KB). Please choose the actual game recording.';
        }
        try {
            const duration = await probeDuration(selectedFile);
            // WebM from some recorders reports Infinity — metadata loaded, accept.
            if (!Number.isFinite(duration) && duration !== Infinity) {
                return 'Could not read this video (no playable duration). Please choose a working recording.';
            }
            if (duration <= 0) {
                return 'This video has zero duration. Please choose the actual game recording.';
            }
        } catch {
            return 'Could not preview this file as video. Please choose a playable recording (MP4, WebM, MOV, or AVI).';
        }
        return null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setSessionExpired(false);
            setError(null);
            setStatus('READY');
            setProgress(0);
            setLoadedBytes(0);
            setTotalBytes(selectedFile.size);

            // NOTE: no filename → title autofill (demo-era behavior). The
            // Title field below is required and must be typed by the user.
            const validationError = await validateFile(selectedFile);
            if (validationError) {
                setFile(null);
                setFileInputKey((k) => k + 1);
                setError(validationError);
                setStatus('ERROR');
                setIsResumable(false);
                return;
            }

            setFile(selectedFile);

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
        setActiveGcsUri(null);
        setIsResumable(false);
        setResumableFileMetadata(null);
        setIsExplicitResume(false);
        setSessionExpired(false);
        clearPersistedSession();
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        onCancel();
    };

    const resolveTeamId = async (pick: string, freshName: string, token: string): Promise<string | undefined> => {
        if (!pick) return undefined;
        if (pick !== NEW_TEAM) return pick;
        const trimmed = freshName.trim();
        if (!trimmed) throw new Error('New team name is required.');
        const res = await apiClient.post('/teams', { name: trimmed }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const created: Team = res.data;
        setTeams((prev) => (prev.some((t) => t.id === created.id) ? prev : [...prev, created]));
        return created.id;
    };

    /**
     * Confirm handshake: POST { fileName, gcsUri } — fileName is REQUIRED
     * (A2 path-confusion protection; gcsUri-only bodies 400). A 404 here is
     * honest (bytes never landed) and must NOT be retried as "pending".
     */
    const finalizeUpload = async (gameId: string, fileName: string, gcsUri: string, attempt = 1): Promise<boolean> => {
        if (attempt > 10) return false;
        setProgressLabel(`FINALIZING ${attempt}/10 — confirming cloud persistence...`);

        try {
            const token = await getAccessTokenSilently();
            const response = await apiClient.post(`/games/${gameId}/upload-complete`, { fileName, gcsUri }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'SUCCESS') {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
            return await finalizeUpload(gameId, fileName, gcsUri, attempt + 1);
        } catch (err: any) {
            const statusCode = err?.response?.status;
            const code = err?.response?.data?.code;
            // Honest 404: the bytes are not in storage — re-upload required.
            if (statusCode === 404 || code === '404_STORAGE_MISSING') {
                throw new Error('Video file not found in storage. Please re-upload the file.');
            }
            console.warn(`Finalization attempt ${attempt} failed:`, err);
            if (attempt < 10) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await finalizeUpload(gameId, fileName, gcsUri, attempt + 1);
            }
            return false;
        }
    };

    const handleFastUpload = async () => {
        const trimmedName = gameName.trim();
        if (trimmedName.length < 3) {
            setNameError('Title is required (minimum 3 characters).');
            return;
        }
        setNameError(null);

        if (homePick === NEW_TEAM && !homeNew.trim()) {
            setTeamsError('Please name the new home team or pick an existing squad.');
            return;
        }
        if (awayPick === NEW_TEAM && !awayNew.trim()) {
            setTeamsError('Please name the new away team or pick an existing squad.');
            return;
        }
        setTeamsError(null);

        if (!file) {
            setError('Please select a video file to begin.');
            return;
        }

        // Re-validate at submit time (file may predate a session expiry).
        const lateError = await validateFile(file);
        if (lateError) {
            setError(lateError);
            setStatus('ERROR');
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
            // The session URL itself is ALWAYS re-issued below via
            // GET /games/:id/upload-url (never read from the game record).
            const shouldResume = isExplicitResume && isResumable;

            let gameId = shouldResume ? activeGameId : null;
            let gcsUri = shouldResume ? activeGcsUri : null;

            // Step 1: Create Game Record if not resuming
            if (!gameId) {
                setProgressLabel('Establishing game record...');
                const homeTeamId = await resolveTeamId(homePick, homeNew, token);
                const awayTeamId = await resolveTeamId(awayPick, awayNew, token);
                const createGameResponse = await apiClient.post('/games', {
                    name: trimmedName,
                    gameDate,
                    homeTeamId,
                    awayTeamId,
                    // Optional league label; closest persistent field is `season`.
                    // NOTE: gameRoutes currently allowlists POST fields, so this
                    // is forward-compatible and flagged for backend (W1/A2).
                    season: league.trim() || undefined,
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

            // Step 2: (Re-)issue the resumable upload URL for this gameId.
            setProgressLabel('Securing cloud upload link...');
            const urlResponse = await apiClient.get(`/games/${gameId}/upload-url`, {
                params: {
                    fileName: file.name,
                    contentType: file.type || 'video/mp4'
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            const uploadUrl: string = urlResponse.data.uploadUrl;
            gcsUri = urlResponse.data.gcsUri;
            setActiveGcsUri(gcsUri);

            // Step 3: Perform Direct Upload (99% hold until confirmed)
            uploadStartRef.current = Date.now();
            setLoadedBytes(0);
            setTotalBytes(file.size);
            setRateBps(0);
            const reportProgress = (loaded: number, total: number) => {
                const elapsedSec = Math.max((Date.now() - uploadStartRef.current) / 1000, 0.1);
                const rate = loaded / elapsedSec;
                setLoadedBytes(loaded);
                setRateBps(rate);
                // Hold at 99% during stream; 100% only after confirm handshake.
                const percent = Math.min(99, Math.round((loaded * 99) / total));
                setProgress(percent);
                setProgressLabel(`Streaming video to cloud — ${formatMB(loaded)} / ${formatMB(total)}`);
            };

            const isLocal = uploadUrl!.includes('localhost') || !uploadUrl!.startsWith('http');

            if (isLocal) {
                setProgressLabel(`Streaming video (local) — 0.0 / ${formatMB(file.size)}`);
                const formData = new FormData();
                formData.append('file', file);
                await apiClient.put(uploadUrl!, formData, {
                    signal: abortControllerRef.current?.signal,
                    onUploadProgress: (p) => {
                        if (p.total) reportProgress(p.loaded, p.total);
                    }
                });
            } else {
                setProgressLabel(`Streaming video to cloud — 0.0 / ${formatMB(file.size)}`);
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
                            reportProgress(startByte + p.loaded, file.size);
                        }
                    }
                });
            }

            // Step 4: Confirm Handshake (FINALIZING X/10)
            setStatus('FINALIZING');
            setProgress(99);

            const success = await finalizeUpload(gameId!, file.name, gcsUri!);

            if (success) {
                setProgress(100);
                clearPersistedSession();
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

    const etaText = () => {
        if (!file || rateBps <= 0 || loadedBytes <= 0) return '';
        const remaining = Math.max(totalBytes - loadedBytes, 0);
        const etaSec = Math.round(remaining / rateBps);
        const rateMB = (rateBps / (1024 * 1024)).toFixed(1);
        return ` · ${rateMB} MB/s · ETA ${etaSec}s`;
    };

    const renderTeamPicker = (
        label: string,
        pick: string,
        setPick: (v: string) => void,
        freshName: string,
        setFreshName: (v: string) => void,
    ) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {label} <span style={{ opacity: 0.6 }}>(optional)</span>
            </label>
            <select
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                disabled={isProcessing}
                aria-label={`${label} team`}
                style={{
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '14px',
                    width: '100%',
                }}
            >
                <option value="">No team</option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value={NEW_TEAM}>+ Create new team…</option>
            </select>
            {pick === NEW_TEAM && (
                <input
                    type="text"
                    value={freshName}
                    onChange={(e) => setFreshName(e.target.value)}
                    placeholder={`New ${label.toLowerCase()} team name`}
                    disabled={isProcessing}
                    aria-label={`New ${label.toLowerCase()} team name`}
                    style={{
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '14px',
                        width: '100%',
                    }}
                />
            )}
        </div>
    );

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
                <md-icon>check_circle</md-icon>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>Upload Successful</h3>
                <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '40px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                    The video for <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold' }}>{gameName}</span> is now being processed by the AI engine.
                </p>
                <md-filled-button onClick={onUploadComplete}>Open Dashboard</md-filled-button>
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

            {sessionExpired && (
                <div
                    role="alert"
                    style={{
                        padding: '16px',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent)',
                        color: 'var(--md-sys-color-on-surface)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <md-icon>history</md-icon>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Previous upload session expired. Please re-pick your video file to start fresh.</span>
                </div>
            )}

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
                        key={fileInputKey}
                        type="file"
                        accept={ACCEPT}
                        onChange={handleFileChange}
                        aria-label="Select game recording video file"
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
                        >
                            {file ? 'video_file' : 'upload_file'}
                        </md-icon>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                            {file ? file.name : 'Select game recording'}
                        </p>
                        <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                            MP4 / WebM / MOV / AVI
                        </p>
                    </div>
                </div>

                {/* @ts-ignore */}
                <md-outlined-text-field
                    label="Game Title *"
                    value={gameName}
                    onInput={(e: any) => { setGameName(e.target.value); if (nameError) setNameError(null); }}
                    style={{ width: '100%', '--md-sys-shape-corner-extra-small': '4px' }}
                    disabled={isProcessing}
                />
                {nameError && (
                    <span role="alert" style={{ fontSize: '12px', color: 'var(--md-sys-color-error)', marginTop: '-16px' }}>{nameError}</span>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
                        <label htmlFor="upload-game-date" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Game date
                        </label>
                        <input
                            id="upload-game-date"
                            type="date"
                            value={gameDate}
                            onChange={(e) => setGameDate(e.target.value || todayLocal())}
                            disabled={isProcessing}
                            style={{
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                backgroundColor: 'var(--md-sys-color-surface)',
                                color: 'var(--md-sys-color-on-surface)',
                                fontSize: '14px',
                                width: '100%',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
                        <label htmlFor="upload-league" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            League <span style={{ opacity: 0.6 }}>(optional)</span>
                        </label>
                        <input
                            id="upload-league"
                            type="text"
                            value={league}
                            onChange={(e) => setLeague(e.target.value)}
                            placeholder="e.g. City League"
                            disabled={isProcessing}
                            style={{
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                backgroundColor: 'var(--md-sys-color-surface)',
                                color: 'var(--md-sys-color-on-surface)',
                                fontSize: '14px',
                                width: '100%',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {renderTeamPicker('Home', homePick, setHomePick, homeNew, setHomeNew)}
                    {renderTeamPicker('Away', awayPick, setAwayPick, awayNew, setAwayNew)}
                </div>
                {teamsError && (
                    <span role="alert" style={{ fontSize: '12px', color: 'var(--md-sys-color-error)', marginTop: '-16px' }}>{teamsError}</span>
                )}
            </div>

            {(isProcessing || status === 'FINALIZING') && (
                <div
                    role="status"
                    aria-live="polite"
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
                            {progressLabel}{status !== 'FINALIZING' ? etaText() : ''}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)' }}>
                            {file ? `${formatMB(loadedBytes)} / ${formatMB(totalBytes)} · ` : ''}{progress}%
                        </span>
                    </div>
                    {/* @ts-ignore */}
                    <md-linear-progress value={progress / 100} />
                </div>
            )}

            {error && (
                <div
                    role="alert"
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
                    <md-icon>error</md-icon>
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
