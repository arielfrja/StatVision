import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePGVector1765228000000 implements MigrationInterface {
    name = 'EnablePGVector1765228000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        
        // Add embedding column to game_events
        // vector(1536) matches OpenAI's text-embedding-3-small and Gemini's text-embedding-004
        await queryRunner.query(`ALTER TABLE "game_events" ADD "embedding" vector(1536)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_events" DROP COLUMN "embedding"`);
    }
}
