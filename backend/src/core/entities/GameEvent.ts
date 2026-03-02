import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Game } from "./Game";
import { Team } from "./Team";
import { Player } from "./Player";

@Entity("game_events")
export class GameEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Game, game => game.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "game_id" })
    game: Game;

    @Column({ name: "game_id" })
    gameId: string;

    @ManyToOne(() => Team, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "assigned_team_id" })
    assignedTeam: Team;

    @Column({ name: "assigned_team_id", type: "uuid", nullable: true })
    assignedTeamId: string | null;

    @ManyToOne(() => Player)
    @JoinColumn({ name: "assigned_player_id" })
    assignedPlayer: Player;

    @Column({ name: "assigned_player_id", type: "uuid", nullable: true })
    assignedPlayerId: string | null;

    @Column({ name: "identified_team_color", type: "varchar", nullable: true })
    identifiedTeamColor: string | null;

    @Column({ name: "identified_jersey_number", type: "int", nullable: true })
    identifiedJerseyNumber: number | null;

    @Column({ name: "event_type", type: "varchar" })
    eventType: string;

    // New Granular Fields
    @Column({ name: "event_sub_type", type: "varchar", nullable: true })
    eventSubType: string | null;

    @Column({ name: "is_successful", default: false })
    isSuccessful: boolean;

    @Column({ name: "period", type: "int", nullable: true })
    period: number | null;

    @Column({ name: "time_remaining", type: "float", nullable: true })
    timeRemaining: number | null;

    @Column({ name: "x_coord", type: "float", nullable: true })
    xCoord: number | null;

    @Column({ name: "y_coord", type: "float", nullable: true })
    yCoord: number | null;

    @Column({ name: "related_event_id", type: "uuid", nullable: true })
    relatedEventId: string | null;

    @Column({ name: "on_court_player_ids", type: "simple-array", nullable: true })
    onCourtPlayerIds: string[] | null;

    @Column({ type: "jsonb", name: "event_details", nullable: true })
    eventDetails: any;

    @Column({ name: "absolute_timestamp", type: "float" })
    absoluteTimestamp: number; // Time in seconds from video start

    @Column({ name: "video_clip_start_time", type: "float", nullable: true })
    videoClipStartTime: number | null;

    @Column({ name: "video_clip_end_time", type: "float", nullable: true })
    videoClipEndTime: number | null;
}