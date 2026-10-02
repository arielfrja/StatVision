import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Game } from "./Game";
import { Team } from "./Team";
import { Player } from "./Player";

export enum GameEventStatus {
    DRAFT = 'DRAFT',       // AI detected, not yet reviewed
    VERIFIED = 'VERIFIED', // Human confirmed
    REJECTED = 'REJECTED'  // Human marked as incorrect
}

@Entity("game_events")
export class GameEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Game, game => game.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "game_id" })
    game: Game;

    @Column({ name: "game_id" })
    gameId: string;

    @Column({ name: "chunk_id", type: "uuid", nullable: true })
    chunkId: string | null;

    @Column({
        type: "enum",
        enum: GameEventStatus,
        default: GameEventStatus.DRAFT
    })
    status: GameEventStatus;

    @ManyToOne(() => Team, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "assigned_team_id" })
    assignedTeam: Team;

    @Column({ name: "assigned_team_id", type: "uuid", nullable: true })
    assignedTeamId: string | null;

    @ManyToOne(() => Player)
    @JoinColumn({ name: "assigned_player_id" })
    assignedPlayer: Player;

    @Column({ name: "assigned_player_id", type: "uuid", nullable: true })
    assignedPlayerId: string | null;

    @Column({ name: "identified_team_color", type: "varchar", nullable: true })
    identifiedTeamColor: string | null;

    @Column({ name: "identified_jersey_number", type: "int", nullable: true })
    identifiedJerseyNumber: number | null;

    @Column({ name: "event_type", type: "varchar" })
    eventType: string;

    // New Granular Fields
    @Column({ name: "event_sub_type", type: "varchar", nullable: true })
    eventSubType: string | null;

    @Column({ name: "is_successful", type: "boolean", nullable: true, default: false })
    isSuccessful: boolean | null;

    @Column({ name: "period", type: "int", nullable: true })
    period: number | null;

    @Column({ name: "time_remaining", type: "float", nullable: true })
    timeRemaining: number | null;

    @Column({ name: "x_coord", type: "float", nullable: true })
    xCoord: number | null;

    @Column({ name: "y_coord", type: "float", nullable: true })
    yCoord: number | null;

    @Column({ name: "related_event_id", type: "uuid", nullable: true })
    relatedEventId: string | null;

    @Column({ name: "on_court_player_ids", type: "simple-array", nullable: true })
    onCourtPlayerIds: string[] | null;

    @Column({ type: "jsonb", name: "event_details", nullable: true })
    eventDetails: any;

    @Column({ name: "absolute_timestamp", type: "float" })
    absoluteTimestamp: number; // Time in seconds from video start

    @Column({ name: "video_clip_start_time", type: "float", nullable: true })
    videoClipStartTime: number | null;

    @Column({ name: "video_clip_end_time", type: "float", nullable: true })
    videoClipEndTime: number | null;

    @Column({ name: "player_certainty", type: "float", nullable: true })
    playerCertainty: number | null;

    @Column({ name: "event_type_certainty", type: "float", nullable: true })
    eventTypeCertainty: number | null;

    // Timestamp precision (EVENT_TIMESTAMP_PRECISION_SRD): absoluteTimestamp
    // is AI-estimated at ANALYSIS_FPS granularity. sourceFps + frameIndex
    // record what we know; timePrecision labels honesty; needsReview flags
    // chronologically impossible sequences for human review.
    @Column({ name: "source_fps", type: "float", nullable: true })
    sourceFps: number | null;

    @Column({ name: "frame_index", type: "int", nullable: true })
    frameIndex: number | null;

    @Column({ name: "time_precision", type: "varchar", length: 16, default: 'estimated' })
    timePrecision: string;

    @Column({ name: "needs_review", type: "boolean", default: false })
    needsReview: boolean;

    // Clip export (infra-ready, disabled by default — see CLIP docs).
    // CLIPS_ENABLED=false: columns stay null, endpoint returns 501.
    @Column({ name: "clip_status", type: "varchar", length: 16, default: 'none' })
    clipStatus: string;

    @Column({ name: "clip_url", type: "varchar", nullable: true })
    clipUrl: string | null;

    @Column({ name: "clip_error", type: "varchar", nullable: true })
    clipError: string | null;
}