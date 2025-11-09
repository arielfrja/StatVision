import { MigrationInterface, QueryRunner } from "typeorm";

export class ChunkRefactor1762886400000 implements MigrationInterface {
    name = 'ChunkRefactor1762886400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`
            CREATE TABLE "worker_video_analysis_chunks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "job_id" uuid NOT NULL,
                "chunk_path" character varying NOT NULL,
                "start_time" double precision NOT NULL,
                "sequence" integer NOT NULL,
                "status" "public"."worker_video_analysis_chunks_status_enum" NOT NULL DEFAULT 'PENDING',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_some_descriptive_name" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_chunks"
            ADD CONSTRAINT "FK_job_id" FOREIGN KEY ("job_id") REFERENCES "worker_video_analysis_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs" DROP COLUMN "failedChunkInfo"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_jobs"
            ADD "failedChunkInfo" jsonb
        `);
        await queryRunner.query(`
            ALTER TABLE "worker_video_analysis_chunks" DROP CONSTRAINT "FK_job_id"
        `);
        await queryRunner.query(`
            DROP TABLE "worker_video_analysis_chunks"
        `);
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum"`);
    }
}
