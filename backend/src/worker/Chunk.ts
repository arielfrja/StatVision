import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { VideoAnalysisJob } from "./VideoAnalysisJob";

export enum ChunkStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
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

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
