import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChunkTrackingToGameAndJob1816000000000 implements MigrationInterface {
    name = 'AddChunkTrackingToGameAndJob1816000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" ADD "total_chunks" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "games" ADD "completed_chunks" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ADD "completed_chunks" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "completed_chunks"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "completed_chunks"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "total_chunks"`);
    }

}
