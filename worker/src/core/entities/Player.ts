import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { GameEvent } from "./GameEvent";
import { PlayerTeamHistory } from "./PlayerTeamHistory";

@Entity("players")
export class Player {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ default: false })
    isTemp: boolean;

    @Column({ type: "enum", enum: ["PG", "SG", "SF", "PF", "C"], nullable: true })
    position: string | null;

    @Column({ type: "int", nullable: true })
    height: number | null; // in cm

    @Column({ type: "int", nullable: true })
    weight: number | null; // in kg

    @Column({ name: "is_active", default: true })
    isActive: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToMany(() => PlayerTeamHistory, history => history.player)
    teamHistory: PlayerTeamHistory[];

    @OneToMany(() => GameEvent, gameEvent => gameEvent.assignedPlayer)
    gameEvents: GameEvent[];
}