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
    const pixelsPerSecond = 5; 
    const timelineWidth = Math.max(800, duration * pixelsPerSecond);

    const getEventColor = (event: GameEvent) => {
        const type = event.eventType.toUpperCase();
        if (type.includes('SHOT MADE') || (type.includes('SHOT') && event.isSuccessful)) return '#00E676'; // Success Green
        if (type.includes('SHOT MISSED') || (type.includes('SHOT') && event.isSuccessful === false)) return '#FF5252'; // Failure Red
        if (type.includes('FOUL')) return '#FFD740'; // Warning Yellow
        if (type.includes('TURNOVER')) return '#FFAB40'; // Caution Orange
        if (type.includes('SUBSTITUTION') || type.includes('TIMEOUT')) return 'var(--text-dim)';
        return 'var(--electric)'; // Brand Blue
    };

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
            backgroundColor: 'var(--bg-container-low)', 
            padding: '24px 0',
            borderRadius: '16px',
            border: '1px solid var(--border-ghost)',
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
                    height: '80px', 
                    cursor: 'pointer',
                    margin: '0 40px'
                }}
            >
                {/* Background Track */}
                <div style={{ 
                    position: 'absolute', 
                    top: '38px', 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '2px'
                }}></div>

                {/* Progress Fill */}
                <div style={{ 
                    position: 'absolute', 
                    top: '38px', 
                    width: `${(currentTime / duration) * 100}%`, 
                    height: '4px', 
                    backgroundColor: 'var(--electric)',
                    borderRadius: '2px',
                    boxShadow: '0 0 10px var(--primary-glow)'
                }}></div>

                {/* Event Markers (Heatmap) */}
                {events.map((event) => {
                    const left = event.absoluteTimestamp * pixelsPerSecond;
                    const isActive = Math.abs(currentTime - event.absoluteTimestamp) < 1;
                    const eventColor = getEventColor(event);
                    
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
                                top: isActive ? '30px' : '34px',
                                width: isActive ? '16px' : '10px',
                                height: isActive ? '16px' : '10px',
                                borderRadius: '50%',
                                backgroundColor: eventColor,
                                border: isActive ? '2px solid white' : 'none',
                                transform: 'translateX(-50%)',
                                zIndex: isActive ? 10 : 5,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive ? `0 0 15px ${eventColor}` : 'none',
                                opacity: isActive ? 1 : 0.7
                            }}
                        >
                            {isActive && <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }} />}
                        </div>
                    );
                })}

                {/* Current Time Indicator Handle */}
                <div style={{
                    position: 'absolute',
                    left: `${currentTime * pixelsPerSecond}px`,
                    top: '10px',
                    width: '2px',
                    height: '60px',
                    backgroundColor: 'var(--electric)',
                    transform: 'translateX(-50%)',
                    zIndex: 15,
                    pointerEvents: 'none',
                    boxShadow: '0 0 15px var(--primary-glow)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--electric)',
                        color: 'black',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '900',
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
                        height: '60px',
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        transform: 'translateX(-50%)',
                        zIndex: 14,
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                        }}>
                            {formatTime(hoverTime)}
                        </div>
                    </div>
                )}

                {/* Time Scale Labels (Every 60s) */}
                {Array.from({ length: Math.floor(duration / 60) + 1 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${i * 60 * pixelsPerSecond}px`,
                        top: '60px',
                        fontSize: '9px',
                        fontWeight: '900',
                        color: 'rgba(255,255,255,0.2)',
                        transform: 'translateX(-50%)',
                        letterSpacing: '0.1em'
                    }}>
                        {formatTime(i * 60)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineReview;
