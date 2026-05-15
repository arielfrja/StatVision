import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProgressToJob1778928000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs"
            ADD "progress" integer NOT NULL DEFAULT 0,
            ADD "current_phase" varchar(50) NOT NULL DEFAULT 'PENDING',
            ADD "total_chunks" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs"
            DROP COLUMN "progress",
            DROP COLUMN "current_phase",
            DROP COLUMN "total_chunks"
        `);
    }

}
