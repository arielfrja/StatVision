import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSportType1765227000000 implements MigrationInterface {
    name = 'AddSportType1765227000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum for worker_video_analysis_jobs
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_jobs_sport_type_enum" AS ENUM('BASKETBALL', 'SOCCER', 'VOLLEYBALL', 'TENNIS')`);
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" ADD "sport_type" "public"."worker_video_analysis_jobs_sport_type_enum" NOT NULL DEFAULT 'BASKETBALL'`);

        // Create enum for games
        await queryRunner.query(`CREATE TYPE "public"."games_sport_type_enum" AS ENUM('BASKETBALL', 'SOCCER', 'VOLLEYBALL', 'TENNIS')`);
        await queryRunner.query(`ALTER TABLE "games" ADD "sport_type" "public"."games_sport_type_enum" NOT NULL DEFAULT 'BASKETBALL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop from games
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "sport_type"`);
        await queryRunner.query(`DROP TYPE "public"."games_sport_type_enum"`);

        // Drop from worker_video_analysis_jobs
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "sport_type"`);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_jobs_sport_type_enum"`);
    }
}
