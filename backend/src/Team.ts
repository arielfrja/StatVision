import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Player } from "./Player";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";

@Entity("teams")
export class Team {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "user_id" })
    userId: string;

    @Column()
    name: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.teams)
    user: User;

    @OneToMany(() => Player, player => player.team)
    players: Player[];

    @OneToMany(() => Game, game => game.assignedTeamA)
    gamesA: Game[];

    @OneToMany(() => Game, game => game.assignedTeamB)
    gamesB: Game[];

    @OneToMany(() => GameEvent, gameEvent => gameEvent.assignedTeam)
    gameEvents: GameEvent[];
}
