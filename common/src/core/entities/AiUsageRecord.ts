import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User";

export enum AiUsageType {
    TOKEN = 'TOKEN',
    VIDEO_SECONDS = 'VIDEO_SECONDS'
}

@Entity("ai_usage_records")
export class AiUsageRecord {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Index()
    @Column({ name: "user_id" })
    userId: string;

    @Column({ type: "enum", enum: AiUsageType })
    type: AiUsageType;

    @Column({ type: "float" })
    amount: number;

    @Column({ name: "input_tokens", type: "float", nullable: true })
    inputTokens: number | null;

    @Column({ name: "output_tokens", type: "float", nullable: true })
    outputTokens: number | null;

    @Column({ type: "varchar", nullable: true })
    model: string | null;

    @Column({ name: "resource_id", type: "varchar", nullable: true })
    resourceId: string | null; // e.g. gameId or chunkId

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}
