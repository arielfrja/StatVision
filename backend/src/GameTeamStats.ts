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

    @Column({ type: "varchar", nullable: true })
    type: string | null; // e.g., 'home', 'away', 'opponent'

    @Column({ type: "varchar", nullable: true })
    color: string | null; // e.g., '#FF0000' or 'red'

    @Column({ type: "varchar", nullable: true })
    description: string | null; // Additional description for the identified team in this game

    // Core Stats (Existing)
    @Column({ type: "int", default: 0 })
    points: number;

    @Column({ type: "int", default: 0 })
    assists: number;

    // Detailed Stats (New)
    @Column({ name: "offensive_rebounds", type: "int", default: 0 })
    offensiveRebounds: number;

    @Column({ name: "defensive_rebounds", type: "int", default: 0 })
    defensiveRebounds: number;

    @Column({ name: "field_goals_made", type: "int", default: 0 })
    fieldGoalsMade: number;

    @Column({ name: "field_goals_attempted", type: "int", default: 0 })
    fieldGoalsAttempted: number;

    @Column({ name: "three_pointers_made", type: "int", default: 0 })
    threePointersMade: number;

    @Column({ name: "three_pointers_attempted", type: "int", default: 0 })
    threePointersAttempted: number;

    @Column({ name: "free_throws_made", type: "int", default: 0 })
    freeThrowsMade: number;

    @Column({ name: "free_throws_attempted", type: "int", default: 0 })
    freeThrowsAttempted: number;

    @Column({ type: "int", default: 0 })
    steals: number;

    @Column({ type: "int", default: 0 })
    blocks: number;

    @Column({ type: "int", default: 0 })
    turnovers: number;

    @Column({ type: "int", default: 0 })
    fouls: number;

    @Column({ name: "effective_field_goal_percentage", type: "float", default: 0 })
    effectiveFieldGoalPercentage: number;

    @Column({ name: "true_shooting_percentage", type: "float", default: 0 })
    trueShootingPercentage: number;

    @Column({ type: "jsonb", nullable: true })
    details: any; // For future stats

    @ManyToOne(() => Game)
    @JoinColumn({ name: "game_id" })
    game: Game;

    @ManyToOne(() => Team)
    @JoinColumn({ name: "team_id" })
    team: Team;
}