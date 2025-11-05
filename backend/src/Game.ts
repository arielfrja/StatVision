import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { GameEvent } from "./GameEvent";
import { GameTeamStats } from "./GameTeamStats";
import { GamePlayerStats } from "./GamePlayerStats";

export enum GameStatus {
    PENDING = 'PENDING',
    UPLOADED = 'UPLOADED',
    PROCESSING = 'PROCESSING',
    ANALYZED = 'ANALYZED',
    FAILED = 'FAILED',
    ANALYSIS_FAILED_RETRYABLE = 'ANALYSIS_FAILED_RETRYABLE',
    ANALYSIS_FAILED = 'ANALYSIS_FAILED'
}

@Entity("games")
export class Game {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", nullable: true, default: 'Untitled Game' })
    name: string;

    @ManyToOne(() => User, user => user.games)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_id" })
    userId: string;

    @Column({ type: "enum", enum: GameStatus, default: GameStatus.UPLOADED })
    status: GameStatus;

    @Column({ name: "file_path", type: "varchar", nullable: true })
    filePath: string; // Local path to the uploaded video file.

    @Column({ type: "jsonb", nullable: true })
    failedChunkInfo: { chunkPath: string; startTime: number; sequence: number; }[] | null;

    // New Metadata Fields
    @Column({ name: "game_date", type: "date", nullable: true })
    gameDate: Date | null;

    @Column({ type: "varchar", nullable: true })
    location: string | null;

    @Column({ name: "opponent_name", type: "varchar", nullable: true })
    opponentName: string | null;

    @Column({ name: "quarter_duration", type: "int", nullable: true })
    quarterDuration: number | null;

    @Column({ name: "season", type: "varchar", nullable: true })
    season: string | null; // e.g., "2025-2026" or "Summer League 2025"

    // Renamed Team Assignment Fields (Home/Away)
    @ManyToOne(() => Team, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "home_team_id" })
    homeTeam: Team;

    @Column({ name: "home_team_id", type: "uuid", nullable: true })
    homeTeamId: string | null;

    @ManyToOne(() => Team, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "away_team_id" })
    awayTeam: Team;

    @Column({ name: "away_team_id", type: "uuid", nullable: true })
    awayTeamId: string | null;

    @CreateDateColumn({ name: "uploaded_at" })
    uploadedAt: Date;

    @OneToMany(() => GameEvent, gameEvent => gameEvent.game, { cascade: true, onDelete: 'CASCADE' })
    events: GameEvent[];

    @OneToMany(() => GameTeamStats, stats => stats.game, { cascade: true, onDelete: 'CASCADE' })
    teamStats: GameTeamStats[];

    @OneToMany(() => GamePlayerStats, stats => stats.game, { cascade: true, onDelete: 'CASCADE' })
    playerStats: GamePlayerStats[];
}