import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { VideoAnalysisJob } from "./VideoAnalysisJob";

export enum ChunkStatus {
    PENDING = 'PENDING', // Placeholder record exists
    CHUNKING = 'CHUNKING', // The ffmpeg process is creating the chunk file
    AWAITING_ANALYSIS = 'AWAITING_ANALYSIS', // Chunk file created, ready for analysis worker
    ANALYZING = 'ANALYZING', // Analysis worker is processing the chunk
    COMPLETED = 'COMPLETED', // Analysis is complete
    FAILED = 'FAILED', // A permanent failure occurred at any step
    RETRYABLE_FAILED = 'RETRYABLE_FAILED' // A temporary failure occurred
}

@Entity("worker_video_analysis_chunks")
export class Chunk {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "job_id", type: "uuid" })
    jobId: string;

    @ManyToOne(() => VideoAnalysisJob, job => job.chunks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "job_id" })
    job: VideoAnalysisJob;

    @Column({ name: "chunk_path", type: "varchar" })
    chunkPath: string;

    @Column({ name: "start_time", type: "float" })
    startTime: number;

    @Column({ type: "integer" })
    sequence: number;

    @Column({ type: "enum", enum: ChunkStatus, default: ChunkStatus.PENDING })
    status: ChunkStatus;

    @Column({ name: "failure_reason", type: "text", nullable: true })
    failureReason: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
