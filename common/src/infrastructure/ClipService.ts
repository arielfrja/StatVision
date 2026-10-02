import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { IStorageProvider } from '../core/interfaces/IStorageProvider';
import { ILogger } from '../core/interfaces/ILogger';

export interface ClipRequest {
    /** GCS URI (gs://bucket/path) or local path of the full game video. */
    sourceVideo: string;
    /** Event time in seconds from video start. */
    timestamp: number;
    /** Seconds before the event to include (0..10). */
    padStart?: number;
    /** Seconds after the event to include (0..10). */
    padEnd?: number;
    /** Destination prefix, e.g. `clips/{gameId}`. */
    destPrefix: string;
    /** Filename without extension. */
    clipName: string;
    /** Signed-URL lifetime in seconds. */
    urlTtlSeconds?: number;
}

export interface ClipResult {
    gcsUri: string;
    clipUrl: string;
    expiresIn: number;
    durationSeconds: number;
}

const clampPad = (v: number | undefined, fallback: number) => {
    if (typeof v !== 'number' || isNaN(v)) return fallback;
    return Math.min(10, Math.max(0, v));
};

/**
 * Clip export service (infra-ready, flag-gated).
 *
 * Downloads the source (when remote), slices [t-padStart, t+padEnd] with
 * ffmpeg, uploads the mp4 under `destPrefix`, and returns a signed URL.
 * Callers MUST check CLIPS_ENABLED first and own the tmp lifecycle —
 * this service always cleans its own tmp files, success or failure.
 */
export class ClipService {
    constructor(
        private storageProvider: IStorageProvider,
        private logger?: ILogger,
    ) {}

    public static isEnabled(): boolean {
        return process.env.CLIPS_ENABLED === 'true';
    }

    public async exportClip(req: ClipRequest): Promise<ClipResult> {
        const padStart = clampPad(req.padStart, 3);
        const padEnd = clampPad(req.padEnd, 4);
        const ttl = req.urlTtlSeconds && req.urlTtlSeconds > 0 ? req.urlTtlSeconds : 3600;

        const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sv-clip-'));
        const cleanup = async () => {
            try {
                await fs.promises.rm(workDir, { recursive: true, force: true });
            } catch {
                /* best-effort */
            }
        };
        try {
            let localSource = req.sourceVideo;
            if (req.sourceVideo.startsWith('gs://')) {
                const remotePath = req.sourceVideo.replace(/^gs:\/\/[^/]+\//, '');
                localSource = path.join(workDir, 'source.mp4');
                await this.storageProvider.downloadFile(remotePath, localSource);
            }
            if (!fs.existsSync(localSource)) {
                throw new Error('Source video not available for clipping.');
            }

            const start = Math.max(0, req.timestamp - padStart);
            const duration = padStart + padEnd + 2;
            const localClip = path.join(workDir, 'clip.mp4');
            await this.slice(localClip, localSource, start, duration);

            const destPath = `${req.destPrefix}/${req.clipName}.mp4`;
            const gcsUri = await this.storageProvider.uploadFile(localClip, destPath);
            const remoteOut = gcsUri.replace(/^gs:\/\/[^/]+\//, '');
            const clipUrl = await this.storageProvider.getSignedUrl(remoteOut, ttl);
            return { gcsUri, clipUrl, expiresIn: ttl, durationSeconds: duration };
        } finally {
            await cleanup();
        }
    }

    private slice(outPath: string, inPath: string, start: number, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const args = [
                '-y', '-v', 'error',
                '-ss', String(start),
                '-t', String(duration),
                '-i', inPath,
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
                '-c:a', 'aac',
                outPath,
            ];
            const child = spawn('ffmpeg', args);
            let stderr = '';
            child.stderr.on('data', (d) => { stderr += d.toString(); });
            child.on('error', (e) => reject(new Error(`ffmpeg spawn failed: ${e.message}`)));
            child.on('close', (code) => {
                if (code === 0 && fs.existsSync(outPath)) resolve();
                else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(0, 300)}`));
            });
        });
    }
}
