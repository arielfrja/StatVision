'use client';
import React from 'react';
import ReactPlayer from 'react-player';
import '@material/web/icon/icon.js';

interface VideoPlayerProps {
    videoUrl: string | null;
    /** Game status — lets the empty state stay honest when analysis exists without video. */
    status?: string | null;
    playerRef: React.RefObject<any>;
    onProgress?: (state: any) => void;
    onDuration?: (duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, status, playerRef, onProgress, onDuration }) => {
    // We use a state to ensure we only render on the client
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!videoUrl) {
        const analyzedWithoutVideo = status === 'ANALYZED' || status === 'COMPLETED';
        return (
            <div
                style={{
                    width: '100%',
                    minHeight: '400px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    textAlign: 'center',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    gap: '12px',
                }}
            >
                {analyzedWithoutVideo && (
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: 'var(--md-sys-color-tertiary)',
                        border: '1px solid color-mix(in srgb, var(--md-sys-color-tertiary) 40%, transparent)',
                        backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary) 12%, transparent)',
                        borderRadius: '4px',
                        padding: '4px 12px',
                    }}>
                        Analyzed
                    </span>
                )}
                <md-icon>videocam_off</md-icon>
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                    {analyzedWithoutVideo
                        ? 'Analysis is complete — no video attached to this game.'
                        : 'No video linked or processing in progress.'}
                </p>
            </div>
        );
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const absoluteVideoUrl = videoUrl.startsWith('http') ? videoUrl : `${API_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;

    // Cast ReactPlayer to any to bypass strict property checking for dynamic component props
    const Player = ReactPlayer as any;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#000',
                border: '1px solid var(--md-sys-color-outline-variant)',
            }}
        >
            {isClient && (
                <Player
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
            )}
        </div>
    );
};

export default VideoPlayer;
