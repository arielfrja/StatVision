import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Player } from "./Player";
import { Team } from "./Team";

@Entity("player_team_history")
@Unique(["playerId", "teamId"])
export class PlayerTeamHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "player_id" })
    playerId: string;

    @Column({ name: "team_id" })
    teamId: string;

    @Column({ name: "jersey_number", type: "integer", nullable: true })
    jerseyNumber: number | null;

    @Column({ name: "description", type: "text", nullable: true })
    description: string | null;

    @Column({ name: "start_date", type: "date", nullable: true })
    startDate: Date | null;

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate: Date | null;

    @ManyToOne(() => Player, player => player.teamHistory)
    @JoinColumn({ name: "player_id" })
    player: Player;

    @ManyToOne(() => Team, team => team.playerHistory)
    @JoinColumn({ name: "team_id" })
    team: Team;
}
