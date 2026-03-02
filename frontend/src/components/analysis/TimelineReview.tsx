'use client';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GameEvent } from '@/types/gameEvent';
import '@material/web/icon/icon.js';

interface TimelineReviewProps {
    events: GameEvent[];
    duration: number;
    currentTime: number;
    onEventClick: (event: GameEvent) => void;
    onTimelineClick: (time: number) => void;
}

const TimelineReview: React.FC<TimelineReviewProps> = ({ events, duration, currentTime, onEventClick, onTimelineClick }) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [hoverTime, setHoverTime] = useState<number | null>(null);

    // Calculate pixels per second based on container width or a fixed scale
    // Let's use a scale that makes the timeline readable, maybe 10px per second?
    // Or just 100% width if duration is small.
    const pixelsPerSecond = 5; 
    const timelineWidth = Math.max(800, duration * pixelsPerSecond);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = x / pixelsPerSecond;
        setHoverTime(Math.min(duration, Math.max(0, time)));
    };

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = x / pixelsPerSecond;
        onTimelineClick(Math.min(duration, Math.max(0, time)));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ 
            width: '100%', 
            overflowX: 'auto', 
            backgroundColor: 'var(--md-sys-color-surface-container)', 
            padding: '16px 0',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-elevation-1)',
            marginBottom: '24px'
        }}>
            <div 
                ref={timelineRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverTime(null)}
                onClick={handleTimelineClick}
                style={{ 
                    position: 'relative', 
                    width: `${timelineWidth}px`, 
                    height: '60px', 
                    cursor: 'pointer',
                    margin: '0 20px'
                }}
            >
                {/* Background Track */}
                <div style={{ 
                    position: 'absolute', 
                    top: '28px', 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: 'var(--md-sys-color-outline-variant)',
                    borderRadius: '2px'
                }}></div>

                {/* Progress Fill */}
                <div style={{ 
                    position: 'absolute', 
                    top: '28px', 
                    width: `${(currentTime / duration) * 100}%`, 
                    height: '4px', 
                    backgroundColor: 'var(--md-sys-color-primary)',
                    borderRadius: '2px'
                }}></div>

                {/* Event Markers */}
                {events.map((event) => {
                    const left = event.absoluteTimestamp * pixelsPerSecond;
                    const isActive = Math.abs(currentTime - event.absoluteTimestamp) < 1;
                    
                    return (
                        <div
                            key={event.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                            }}
                            title={`${event.eventType} @ ${formatTime(event.absoluteTimestamp)}`}
                            style={{
                                position: 'absolute',
                                left: `${left}px`,
                                top: '20px',
                                width: isActive ? '20px' : '12px',
                                height: isActive ? '20px' : '12px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-primary-container)',
                                border: `2px solid ${isActive ? 'white' : 'var(--md-sys-color-primary)'}`,
                                transform: 'translateX(-50%)',
                                zIndex: isActive ? 10 : 5,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {isActive && <md-icon style={{ fontSize: '14px', color: 'white' }}>priority_high</md-icon>}
                        </div>
                    );
                })}

                {/* Current Time Indicator Handle */}
                <div style={{
                    position: 'absolute',
                    left: `${currentTime * pixelsPerSecond}px`,
                    top: '10px',
                    width: '2px',
                    height: '40px',
                    backgroundColor: 'var(--md-sys-color-secondary)',
                    transform: 'translateX(-50%)',
                    zIndex: 15,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--md-sys-color-secondary)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        whiteSpace: 'nowrap'
                    }}>
                        {formatTime(currentTime)}
                    </div>
                </div>

                {/* Hover Indicator */}
                {hoverTime !== null && (
                    <div style={{
                        position: 'absolute',
                        left: `${hoverTime * pixelsPerSecond}px`,
                        top: '10px',
                        width: '1px',
                        height: '40px',
                        backgroundColor: 'var(--md-sys-color-outline)',
                        opacity: 0.5,
                        transform: 'translateX(-50%)',
                        zIndex: 14,
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            whiteSpace: 'nowrap'
                        }}>
                            {formatTime(hoverTime)}
                        </div>
                    </div>
                )}

                {/* Time Scale Labels (Every 30s) */}
                {Array.from({ length: Math.floor(duration / 30) + 1 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${i * 30 * pixelsPerSecond}px`,
                        top: '45px',
                        fontSize: '10px',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        transform: 'translateX(-50%)'
                    }}>
                        {formatTime(i * 30)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineReview;
