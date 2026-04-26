import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusAndChunkIdToGameEvent1765226000000 implements MigrationInterface {
    name = 'AddStatusAndChunkIdToGameEvent1765226000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for game_event status
        await queryRunner.query(`CREATE TYPE "game_events_status_enum" AS ENUM('DRAFT', 'VERIFIED', 'REJECTED')`);
        
        // Add status column with default 'DRAFT'
        await queryRunner.query(`ALTER TABLE "game_events" ADD "status" "game_events_status_enum" NOT NULL DEFAULT 'DRAFT'`);
        
        // Add chunk_id column
        await queryRunner.query(`ALTER TABLE "game_events" ADD "chunk_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_events" DROP COLUMN "chunk_id"`);
        await queryRunner.query(`ALTER TABLE "game_events" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "game_events_status_enum"`);
    }
}
