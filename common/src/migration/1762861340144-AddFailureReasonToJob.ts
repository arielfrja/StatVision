import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFailureReasonToJob1762861340144 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs"
            ADD "failure_reason" text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs"
            DROP COLUMN "failure_reason"
        `);
    }

}
