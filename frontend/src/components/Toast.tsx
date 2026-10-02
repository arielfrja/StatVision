'use client';
import React, { useEffect } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    kind?: ToastKind;
    /** Auto-dismiss after ms. 0 disables auto-dismiss. @default 4000 */
    duration?: number;
    onClose: () => void;
}

/**
 * Minimal fixed-position toast. Renders with role="status" so
 * screen readers announce it; no external dependency required.
 */
export const Toast: React.FC<ToastProps> = ({ message, kind = 'info', duration = 4000, onClose }) => {
    useEffect(() => {
        if (!duration) return;
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [duration, onClose, message]);

    const palette =
        kind === 'success'
            ? { bg: 'var(--md-sys-color-tertiary)', fg: 'var(--md-sys-color-on-tertiary)' }
            : kind === 'error'
              ? { bg: 'var(--md-sys-color-error)', fg: 'var(--md-sys-color-on-error)' }
              : { bg: 'var(--md-sys-color-primary)', fg: 'var(--md-sys-color-on-primary)' };

    return (
        <div
            role="status"
            aria-live="polite"
            onClick={onClose}
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2000,
                backgroundColor: palette.bg,
                color: palette.fg,
                fontSize: '13px',
                fontWeight: 600,
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                maxWidth: 'min(90vw, 480px)',
                textAlign: 'center',
            }}
        >
            {message}
        </div>
    );
};

export default Toast;
