import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFailureReasonToChunk1763115814418 implements MigrationInterface {
    name = 'AddFailureReasonToChunk1763115814418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "failure_reason" text`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" RENAME TO "worker_video_analysis_chunks_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum" AS ENUM('PENDING', 'CHUNKING', 'AWAITING_ANALYSIS', 'ANALYZING', 'COMPLETED', 'FAILED', 'RETRYABLE_FAILED')`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" TYPE "public"."worker_video_analysis_chunks_status_enum" USING "status"::"text"::"public"."worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum_old" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CHUNKING', 'AWAITING_ANALYSIS', 'ANALYZING', 'RETRYABLE_FAILED')`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" TYPE "public"."worker_video_analysis_chunks_status_enum_old" USING "status"::"text"::"public"."worker_video_analysis_chunks_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum_old" RENAME TO "worker_video_analysis_chunks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "failure_reason"`);
    }

}
