import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateChunkStatusEnum1762887400000 implements MigrationInterface {
    name = 'UpdateChunkStatusEnum1762887400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // It's safer to add new values rather than dropping and recreating the type.
        // Note: We are not removing 'PROCESSING' to avoid breaking rollbacks of this migration,
        // even though the new application code doesn't use it.
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" ADD VALUE 'CHUNKING'`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" ADD VALUE 'AWAITING_ANALYSIS'`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" ADD VALUE 'ANALYZING'`);
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" ADD VALUE 'RETRYABLE_FAILED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support easily removing enum values in a transaction.
        // The simplest and safest way to handle a downgrade is to recreate the type
        // with the old values. This is destructive if the new values are in use.
        this.log('Downgrading ChunkStatus enum is a destructive operation. Recreating type.');
        
        // 1. Drop dependent views/constraints if any (none in this case)
        // 2. Rename old type
        await queryRunner.query(`ALTER TYPE "public"."worker_video_analysis_chunks_status_enum" RENAME TO "worker_video_analysis_chunks_status_enum_old"`);
        
        // 3. Create new type with old values
        await queryRunner.query(`CREATE TYPE "public"."worker_video_analysis_chunks_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        
        // 4. Update table to use the new type, casting from old
        await queryRunner.query(`ALTER TABLE "worker_video_analysis_chunks" ALTER COLUMN "status" TYPE "public"."worker_video_analysis_chunks_status_enum" USING "status"::text::"public"."worker_video_analysis_chunks_status_enum"`);
        
        // 5. Drop the old type
        await queryRunner.query(`DROP TYPE "public"."worker_video_analysis_chunks_status_enum_old"`);
    }

    private log(message: string) {
        console.log(`[${this.name}] ${message}`);
    }
}
