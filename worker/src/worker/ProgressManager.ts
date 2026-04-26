import * as cliProgress from 'cli-progress';

export class ProgressManager {
    private multiBar: cliProgress.MultiBar;
    private jobBars: Map<string, cliProgress.SingleBar> = new Map();
    private subTaskBars: Map<string, cliProgress.SingleBar> = new Map(); // Replaced ephemeralBar
    private static instance: ProgressManager;

    private constructor() {
        this.multiBar = new cliProgress.MultiBar({
            clearOnComplete: false, // Set to false to see final state
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

    // Updated to handle multiple bars
    public startChunkBar(id: string, total: number, phase: string, details: string) {
        if (this.subTaskBars.has(id)) {
            this.stopChunkBar(id);
        }
        const bar = this.multiBar.create(total, 0, { phase, details });
        this.subTaskBars.set(id, bar);
    }

    // Updated to handle multiple bars
    public updateChunkBar(options: { id?: string; value: number; details?: string; }) {
        const { id, value, details } = options;
        if (!id) return;
        const bar = this.subTaskBars.get(id);
        if (bar) {
            const payload = details ? { details } : {};
            bar.update(value, payload);
        }
    }
    
    // Updated to handle multiple bars
    public startIndeterminateBar(id: string, phase: string, details: string) {
        if (this.subTaskBars.has(id)) {
            this.stopChunkBar(id);
        }
        const bar = this.multiBar.create(100, 0, { phase, details });
        this.subTaskBars.set(id, bar);
        bar.start(100, 0); // This will make it look like it's waiting
    }

    // Updated to handle multiple bars
    public stopChunkBar(id?: string) {
        if (!id) return;
        const bar = this.subTaskBars.get(id);
        if (bar) {
            bar.stop();
            this.multiBar.remove(bar);
            this.subTaskBars.delete(id);
        }
    }

    public stopAll() {
        this.multiBar.stop();
    }
}
