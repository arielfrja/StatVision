import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";
import { PlayerTeamHistory } from "./PlayerTeamHistory";

@Entity("teams")
export class Team {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "user_id" })
    userId: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ default: false })
    isTemp: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.teams)
    user: User;

    @OneToMany(() => PlayerTeamHistory, history => history.team)
    playerHistory: PlayerTeamHistory[];

    @OneToMany(() => Game, game => game.homeTeam)
    gamesA: Game[];


}
