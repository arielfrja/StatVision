import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { GameEvent } from "./GameEvent";
import { GameTeamStats } from "./GameTeamStats";
import { GamePlayerStats } from "./GamePlayerStats";

export enum GameStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    ANALYZED = "ANALYZED",
    ASSIGNMENT_PENDING = "ASSIGNMENT_PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

@Entity("games")
export class Game {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User, user => user.games)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_id" })
    userId: string;

    @Column({ type: "enum", enum: GameStatus, default: GameStatus.UPLOADED })
    status: GameStatus;

    @Column({ name: "video_url", nullable: true })
    videoUrl: string; // Local path or GCS URL

    @ManyToOne(() => Team)
    @JoinColumn({ name: "assigned_team_a_id" })
    assignedTeamA: Team;

    @Column({ name: "assigned_team_a_id", nullable: true })
    assignedTeamAId: string;

    @ManyToOne(() => Team)
    @JoinColumn({ name: "assigned_team_b_id" })
    assignedTeamB: Team;

    @Column({ name: "assigned_team_b_id", nullable: true })
    assignedTeamBId: string;

    @CreateDateColumn({ name: "uploaded_at" })
    uploadedAt: Date;

    @OneToMany(() => GameEvent, gameEvent => gameEvent.game)
    events: GameEvent[];

    @OneToMany(() => GameTeamStats, stats => stats.game)
    teamStats: GameTeamStats[];

    @OneToMany(() => GamePlayerStats, stats => stats.game)
    playerStats: GamePlayerStats[];
}
