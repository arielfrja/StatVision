import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Game } from "./Game";
import { Player } from "./Player";

@Entity("game_player_stats")
@Unique(["gameId", "playerId"])
export class GamePlayerStats {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "game_id" })
    gameId: string;

    @Column({ name: "player_id" })
    playerId: string;

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

    @ManyToOne(() => Player)
    @JoinColumn({ name: "player_id" })
    player: Player;
}