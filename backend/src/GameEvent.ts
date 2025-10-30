import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Game } from "./Game";
import { Team } from "./Team";
import { Player } from "./Player";

@Entity("game_events")
export class GameEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Game, game => game.events)
    @JoinColumn({ name: "game_id" })
    game: Game;

    @Column({ name: "game_id" })
    gameId: string;

    @ManyToOne(() => Team)
    @JoinColumn({ name: "assigned_team_id" })
    assignedTeam: Team;

    @Column({ name: "assigned_team_id", nullable: true })
    assignedTeamId: string;

    @ManyToOne(() => Player)
    @JoinColumn({ name: "assigned_player_id" })
    assignedPlayer: Player;

    @Column({ name: "assigned_player_id", nullable: true })
    assignedPlayerId: string;

    @Column({ name: "identified_team_color", nullable: true })
    identifiedTeamColor: string;

    @Column({ name: "identified_jersey_number", nullable: true })
    identifiedJerseyNumber: number;

    @Column({ name: "event_type" })
    eventType: string;

    @Column({ type: "jsonb", name: "event_details", nullable: true })
    eventDetails: any;

    @Column({ name: "absolute_timestamp", type: "float" })
    absoluteTimestamp: number; // Time in seconds from video start

    @Column({ name: "video_clip_start_time", type: "float" })
    videoClipStartTime: number;

    @Column({ name: "video_clip_end_time", type: "float" })
    videoClipEndTime: number;
}
