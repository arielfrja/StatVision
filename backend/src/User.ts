import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Team } from "./Team";
import { Game } from "./Game";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true, name: "provider_uid", type: "varchar" })
    providerUid: string;

    @Column({ type: "varchar", nullable: true })
    email: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToMany(() => Team, team => team.user)
    teams: Team[];

    @OneToMany(() => Game, game => game.user)
    games: Game[];
}
