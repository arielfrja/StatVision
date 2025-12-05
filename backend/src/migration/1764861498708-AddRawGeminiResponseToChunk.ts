import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawGeminiResponseToChunk1764861498708 implements MigrationInterface {
    name = 'AddRawGeminiResponseToChunk1764861498708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP CONSTRAINT "UQ_worker_video_analysis_chunks_jobId_sequence"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "thought_signature"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "raw_gemini_response"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "raw_gemini_response" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "raw_gemini_response"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "raw_gemini_response" jsonb`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "thought_signature" text`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD CONSTRAINT "UQ_worker_video_analysis_chunks_jobId_sequence" UNIQUE ("job_id", "sequence")`);
    }

}
