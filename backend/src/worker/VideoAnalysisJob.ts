import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from "../interfaces/video-analysis.interfaces";
import { Chunk } from "./Chunk"; // Import the new Chunk entity

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

    // The failedChunkInfo column is removed as chunk status will be managed in the new Chunk entity
    // @Column({ type: "jsonb", nullable: true })
    // failedChunkInfo: { chunkPath: string; startTime: number; sequence: number; }[] | null;

    @Column({ type: "jsonb", nullable: true })
    processedEvents: ProcessedGameEvent[] | null; // Store raw events from Gemini API

    @Column({ type: "jsonb", nullable: true })
    processedStats: any | null; // Store calculated stats

    @Column({ type: "jsonb", nullable: true }) // New field for identified players
    identifiedPlayers: IdentifiedPlayer[] | null;

    @Column({ type: "jsonb", nullable: true }) // New field for identified teams
    identifiedTeams: IdentifiedTeam[] | null;

    @Column({ name: "failure_reason", type: "text", nullable: true })
    failureReason: string | null;

    @Column({ name: "retry_count", type: "integer", default: 0 })
    retryCount: number;

    @Column({ name: "processing_heartbeat_at", type: "timestamp with time zone", nullable: true })
    processingHeartbeatAt: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToMany(() => Chunk, chunk => chunk.job)
    chunks: Chunk[];
}
