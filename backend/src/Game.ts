import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { GameEvent } from "./GameEvent";

export enum GameStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    PENDING_ASSIGNMENT = "PENDING_ASSIGNMENT",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED",
}

@Entity("games")
export class Game {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "user_id" })
    userId: string;

    @Column({
        type: "enum",
        enum: GameStatus,
        default: GameStatus.UPLOADED,
    })
    status: GameStatus;

    @Column({ name: "video_url" })
    videoUrl: string;

    @Column({ name: "assigned_team_a_id", nullable: true })
    assignedTeamAId: string;

    @Column({ name: "assigned_team_b_id", nullable: true })
    assignedTeamBId: string;

    @CreateDateColumn({ name: "uploaded_at" })
    uploadedAt: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.games)
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Team, team => team.gamesA)
    @JoinColumn({ name: "assigned_team_a_id" })
    assignedTeamA: Team;

    @ManyToOne(() => Team, team => team.gamesB)
    @JoinColumn({ name: "assigned_team_b_id" })
    assignedTeamB: Team;

    @OneToMany(() => GameEvent, gameEvent => gameEvent.game)
    gameEvents: GameEvent[];
}
