import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMissingColumnsFinal1777190493423 implements MigrationInterface {
    name = 'FixMissingColumnsFinal1777190493423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP CONSTRAINT "UQ_worker_video_analysis_chunks_jobId_sequence"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "processedEvents" jsonb`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "identifiedPlayers" jsonb`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "identifiedTeams" jsonb`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ADD "chat_history" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."games_game_type_enum" AS ENUM('FULL_COURT', 'THREE_X_THREE', 'STREET_BALL', 'ONE_X_ONE')`);
        await queryRunner.query(`ALTER TABLE "games" ADD "game_type" "public"."games_game_type_enum" NOT NULL DEFAULT 'FULL_COURT'`);
        await queryRunner.query(`CREATE TYPE "public"."games_identity_mode_enum" AS ENUM('JERSEY_COLORS', 'INTERACTION_BASED')`);
        await queryRunner.query(`ALTER TABLE "games" ADD "identity_mode" "public"."games_identity_mode_enum" NOT NULL DEFAULT 'JERSEY_COLORS'`);
        await queryRunner.query(`ALTER TABLE "games" ADD "ruleset" jsonb`);
        await queryRunner.query(`ALTER TABLE "games" ADD "visual_context" jsonb`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" RENAME TO "worker_video_analysis_chunks_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum" AS ENUM('PENDING', 'CHUNKING', 'AWAITING_ANALYSIS', 'ANALYZING', 'COMPLETED', 'FAILED', 'RETRYABLE_FAILED')`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" TYPE "public"."worker_video_analysis_chunks_status_enum" USING "status"::"text"::"public"."worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP CONSTRAINT "FK_f33d579840a12033320f4aacb11"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD CONSTRAINT "FK_f33d579840a12033320f4aacb11" FOREIGN KEY ("job_id") REFERENCES "worker_video_analysis_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP CONSTRAINT "FK_f33d579840a12033320f4aacb11"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD CONSTRAINT "FK_f33d579840a12033320f4aacb11" FOREIGN KEY ("job_id") REFERENCES "worker_video_analysis_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum_old" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CHUNKING', 'AWAITING_ANALYSIS', 'ANALYZING', 'RETRYABLE_FAILED')`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" TYPE "public"."worker_video_analysis_chunks_status_enum_old" USING "status"::"text"::"public"."worker_video_analysis_chunks_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum_old" RENAME TO "worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "visual_context"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "ruleset"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "identity_mode"`);
        await queryRunner.query(`DROP TYPE "public"."games_identity_mode_enum"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "game_type"`);
        await queryRunner.query(`DROP TYPE "public"."games_game_type_enum"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "chat_history"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "identifiedTeams"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "identifiedPlayers"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "processedEvents"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD CONSTRAINT "UQ_worker_video_analysis_chunks_jobId_sequence" UNIQUE ("job_id", "sequence")`);
    }

}
