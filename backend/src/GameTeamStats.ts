import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Game } from "./Game";
import { Team } from "./Team";

@Entity("game_team_stats")
@Unique(["gameId", "teamId"])
export class GameTeamStats {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "game_id" })
    gameId: string;

    @Column({ name: "team_id" })
    teamId: string;

    @Column({ type: "int", default: 0 })
    points: number;

    @Column({ type: "int", default: 0 })
    rebounds: number;

    @Column({ type: "int", default: 0 })
    assists: number;

    @Column({ type: "jsonb", nullable: true })
    details: any; // For future stats

    @ManyToOne(() => Game)
    @JoinColumn({ name: "game_id" })
    game: Game;

    @ManyToOne(() => Team)
    @JoinColumn({ name: "team_id" })
    team: Team;
}
