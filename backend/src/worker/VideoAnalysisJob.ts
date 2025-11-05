import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum VideoAnalysisJobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    RETRYABLE_FAILED = 'RETRYABLE_FAILED',
}

@Entity("worker_video_analysis_jobs")
export class VideoAnalysisJob {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "game_id", type: "uuid" })
    gameId: string;

    @Column({ name: "user_id", type: "uuid" })
    userId: string;

    @Column({ name: "file_path", type: "varchar" })
    filePath: string;

    @Column({ type: "enum", enum: VideoAnalysisJobStatus, default: VideoAnalysisJobStatus.PENDING })
    status: VideoAnalysisJobStatus;

    @Column({ type: "jsonb", nullable: true })
    failedChunkInfo: { chunkPath: string; startTime: number; sequence: number; }[] | null;

    @Column({ type: "jsonb", nullable: true })
    processedEvents: any[] | null; // Store raw events from Gemini API

    @Column({ type: "jsonb", nullable: true })
    processedStats: any | null; // Store calculated stats

    @Column({ type: "jsonb", nullable: true }) // New field for identified players
    identifiedPlayers: any[] | null;

    @Column({ type: "jsonb", nullable: true }) // New field for identified teams
    identifiedTeams: any[] | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
