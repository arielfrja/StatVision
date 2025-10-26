import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from "typeorm";
import { Team } from "./Team";
import { GameEvent } from "./GameEvent";

@Entity("players")
@Unique(["teamId", "jerseyNumber"])
export class Player {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "team_id" })
    teamId: string;

    @Column()
    name: string;

    @Column({ name: "jersey_number" })
    jerseyNumber: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => Team, team => team.players)
    team: Team;

    @OneToMany(() => GameEvent, gameEvent => gameEvent.assignedPlayer)
    gameEvents: GameEvent[];
}
