'use client';
import React from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
    videoUrl: string | null;
    playerRef: React.RefObject<any>;
    onProgress?: (state: any) => void;
    onDuration?: (duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, playerRef, onProgress, onDuration }) => {
    // We use a state to ensure we only render on the client
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!videoUrl) {
        return (
            <div className="w-full min-h-[400px] bg-container-high rounded-xl flex flex-col items-center justify-center p-8 text-center border border-bd-ghost">
                <span className="material-symbols-outlined text-4xl text-tx-dim mb-4 opacity-30">videocam_off</span>
                <p className="text-xs font-medium text-tx-dim uppercase tracking-wider">No video linked or processing in progress.</p>
            </div>
        );
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const absoluteVideoUrl = videoUrl.startsWith('http') ? videoUrl : `${API_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;

    // Cast ReactPlayer to any to bypass strict property checking for dynamic component props
    const Player = ReactPlayer as any;

    return (
        <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-black border border-bd-ghost">
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
