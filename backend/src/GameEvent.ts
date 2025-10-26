import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Game } from "./Game";
import { Team } from "./Team";
import { Player } from "./Player";

@Entity("game_events")
export class GameEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "game_id" })
    gameId: string;

    @Column({ name: "assigned_team_id", nullable: true })
    assignedTeamId: string;

    @Column({ name: "assigned_player_id", nullable: true })
    assignedPlayerId: string;

    @Column({ name: "identified_team_color", nullable: true })
    identifiedTeamColor: string;

    @Column({ name: "identified_jersey_number", nullable: true })
    identifiedJerseyNumber: number;

    @Column({ name: "event_type" })
    eventType: string;

    @Column({ type: "jsonb", name: "event_details", nullable: true })
    eventDetails: object;

    @Column({ type: "float", name: "absolute_timestamp" })
    absoluteTimestamp: number;

    @Column({ type: "float", name: "video_clip_start_time" })
    videoClipStartTime: number;

    @Column({ type: "float", name: "video_clip_end_time" })
    videoClipEndTime: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
    
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => Game, game => game.gameEvents)
    @JoinColumn({ name: "game_id" })
    game: Game;

    @ManyToOne(() => Team, team => team.gameEvents)
    @JoinColumn({ name: "assigned_team_id" })
    assignedTeam: Team;

    @ManyToOne(() => Player, player => player.gameEvents)
    @JoinColumn({ name: "assigned_player_id" })
    assignedPlayer: Player;
}
