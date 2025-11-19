import * as cliProgress from 'cli-progress';

export class ProgressManager {
    private multiBar: cliProgress.MultiBar;
    private jobBars: Map<string, cliProgress.SingleBar> = new Map();
    private ephemeralBar: cliProgress.SingleBar | null = null;
    private static instance: ProgressManager;

    private constructor() {
        this.multiBar = new cliProgress.MultiBar({
            clearOnComplete: true,
            hideCursor: true,
            format: ' {bar} | {percentage}% | {phase} | {details}',
        }, cliProgress.Presets.shades_classic);
    }

    public static getInstance(): ProgressManager {
        if (!ProgressManager.instance) {
            ProgressManager.instance = new ProgressManager();
        }
        return ProgressManager.instance;
    }

    public addJob(jobId: string, totalChunks: number) {
        if (this.jobBars.has(jobId)) return;
        const bar = this.multiBar.create(totalChunks, 0, {
            phase: `Job ${jobId.substring(0,5)}`,
            details: 'Waiting...'
        });
        this.jobBars.set(jobId, bar);
    }

    public updateJob(jobId: string, increment: number, details: string) {
        const bar = this.jobBars.get(jobId);
        if (bar) {
            bar.increment(increment, { details });
        }
    }

    public removeJob(jobId: string) {
        const bar = this.jobBars.get(jobId);
        if (bar) {
            bar.stop();
            this.multiBar.remove(bar);
            this.jobBars.delete(jobId);
        }
    }

    public startChunkBar(total: number, phase: string, details: string) {
        if (this.ephemeralBar) {
            this.multiBar.remove(this.ephemeralBar);
        }
        this.ephemeralBar = this.multiBar.create(total, 0, { phase, details });
    }

    public updateChunkBar(value: number, details?: string) {
        if (this.ephemeralBar) {
            const payload = details ? { details } : {};
            this.ephemeralBar.update(value, payload);
        }
    }
    
    public startIndeterminateBar(phase: string, details: string) {
        if (this.ephemeralBar) {
            this.multiBar.remove(this.ephemeralBar);
        }
        this.ephemeralBar = this.multiBar.create(100, 0, { phase, details });
        this.ephemeralBar.start(100, 0); // This will make it look like it's waiting
    }

    public stopChunkBar() {
        if (this.ephemeralBar) {
            this.ephemeralBar.stop();
            this.multiBar.remove(this.ephemeralBar);
            this.ephemeralBar = null;
        }
    }

    public stopAll() {
        this.multiBar.stop();
    }
}
