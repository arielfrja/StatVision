/**
 * Shared timestamp-precision helpers (EVENT_TIMESTAMP_PRECISION_SRD).
 *
 * Pure functions over plain event objects so both the worker
 * (VideoAnalysisResultService) and the API push path can apply identical
 * semantics. Never throws on malformed input — worst case leaves the event
 * flagged for review.
 */

export type TimePrecision = 'estimated' | 'verified';

export interface PrecisionInput {
    absoluteTimestamp?: number | null;
    sourceFps?: number | null;
    eventType?: string | null;
    eventSubType?: string | null;
    isSuccessful?: boolean | null;
    period?: number | null;
    timePrecision?: string | null;
    needsReview?: boolean | null;
    [key: string]: any;
}

/**
 * Attach source fps + derived frame index. Does NOT upgrade precision —
 * only human review (EventEditor "Mark verified") sets `verified`.
 */
export function applyTimestampPrecision<T extends PrecisionInput>(
    events: T[],
    sourceFps: number | null | undefined
): T[] {
    const fps = typeof sourceFps === 'number' && sourceFps > 0 ? sourceFps : null;
    for (const e of events) {
        (e as any).sourceFps = fps;
        const t = typeof e.absoluteTimestamp === 'number' ? e.absoluteTimestamp : NaN;
        (e as any).frameIndex = fps !== null && !isNaN(t) ? Math.round(t * fps) : null;
        if (e.timePrecision !== 'verified') (e as any).timePrecision = 'estimated';
        if (e.needsReview !== true) (e as any).needsReview = false;
    }
    return events;
}

const norm = (v: string | null | undefined) => (v || '').toLowerCase();

function isShot(type: string | null | undefined, sub: string | null | undefined): { shot: boolean; three: boolean } {
    const t = norm(type);
    const s = norm(sub);
    const shot = t.includes('shot') || t.includes('fg');
    const three = t.includes('3pt') || t.includes('3-point') || s.includes('3pt');
    return { shot, three };
}

function isRebound(type: string | null | undefined): boolean {
    return norm(type).includes('rebound');
}

function isFoul(type: string | null | undefined): boolean {
    return norm(type).includes('foul');
}

function isFreeThrow(type: string | null | undefined): boolean {
    const t = norm(type);
    return t.includes('free throw') || t === 'ft' || t.includes(' ft ');
}

/**
 * Flag chronologically impossible sequences for human review (R5).
 * Rules operate on events sorted by absoluteTimestamp within one game:
 * - REBOUND requires a preceding SHOT ATTEMPT/MISS within 8s (same period).
 * - SHOT MADE requires a same-side ATTEMPT within 5s.
 * - FREE_THROW_MADE requires its ATTEMPT within 5s.
 * Mutates needsReview in place; returns the flagged count.
 */
export function flagImpossibleSequences<T extends PrecisionInput>(events: T[]): number {
    const sorted = [...events].sort(
        (a, b) => (a.absoluteTimestamp || 0) - (b.absoluteTimestamp || 0)
    );
    let flagged = 0;
    const flag = (e: T) => {
        if (!(e as any).needsReview) {
            (e as any).needsReview = true;
            flagged++;
        }
    };

    for (let i = 0; i < sorted.length; i++) {
        const e = sorted[i];
        const t = typeof e.absoluteTimestamp === 'number' ? e.absoluteTimestamp : 0;
        const { shot } = isShot(e.eventType, e.eventSubType);
        const ok = !!e.isSuccessful;

        const priorWithin = (secs: number, pred: (p: T) => boolean): boolean => {
            for (let j = i - 1; j >= 0; j--) {
                const p = sorted[j];
                const pt = typeof p.absoluteTimestamp === 'number' ? p.absoluteTimestamp : 0;
                if (t - pt > secs) break;
                if (p.period != null && e.period != null && p.period !== e.period) continue;
                if (pred(p)) return true;
            }
            return false;
        };

        if (isRebound(e.eventType)) {
            const hasMiss = priorWithin(8, (p) => {
                const s = isShot(p.eventType, p.eventSubType);
                return s.shot && !p.isSuccessful;
            });
            if (!hasMiss) flag(e);
        } else if (shot && ok) {
            const hasAttempt = priorWithin(5, (p) => isShot(p.eventType, p.eventSubType).shot);
            if (!hasAttempt) flag(e);
        } else if (norm(e.eventType).includes('free throw made') || (isFreeThrow(e.eventType) && ok && !shot)) {
            const hasAttempt = priorWithin(5, (p) => isFreeThrow(p.eventType) && !p.isSuccessful);
            if (!hasAttempt) flag(e);
        } else if (isFoul(e.eventType)) {
            // Fouls stand alone; nothing to validate.
        }
    }
    return flagged;
}
