import { MigrationInterface, QueryRunner } from "typeorm";

export class DirectVideoRefactor1780047000000 implements MigrationInterface {
    name = 'DirectVideoRefactor1780047000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add gemini_file_uri and gemini_file_name to worker_video_analysis_jobs
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ADD "gemini_file_uri" character varying`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ADD "gemini_file_name" character varying`);
        
        // Add end_time to worker_video_analysis_chunks
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ADD "end_time" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" DROP COLUMN "end_time"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "gemini_file_name"`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "gemini_file_uri"`);
    }

}
