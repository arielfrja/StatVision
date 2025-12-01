import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawGeminiResponseToChunk1764502315146 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "worker_video_analysis_chunks" ADD "raw_gemini_response" jsonb');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "raw_gemini_response"');
    }

}
