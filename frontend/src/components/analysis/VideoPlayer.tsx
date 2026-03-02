'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import '@material/web/icon/icon.js';

// Dynamically import ReactPlayer to avoid SSR issues
const ClientVideoPlayer = dynamic(() => import('react-player'), { ssr: false });

interface VideoPlayerProps {
    videoUrl: string | null;
    playerRef: React.RefObject<any>;
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, playerRef, onProgress, onDuration }) => {
    if (!videoUrl) {
        return (
            <div style={{ height: '100%', minHeight: '300px', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-elevation-1)' }}>
                <md-icon style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)' }}>videocam_off</md-icon>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>No video linked to this game or processing in progress.</p>
            </div>
        );
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const absoluteVideoUrl = videoUrl.startsWith('http') ? videoUrl : `${API_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-elevation-2)' }}>
            <ClientVideoPlayer
                ref={playerRef}
                url={absoluteVideoUrl}
                width='100%'
                height='100%'
                controls={true}
                onProgress={onProgress}
                onDuration={onDuration}
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'anonymous'
                        }
                    }
                }}
            />
        </div>
    );
};

export default VideoPlayer;
