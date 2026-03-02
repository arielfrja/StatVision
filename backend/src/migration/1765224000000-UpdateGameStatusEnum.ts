import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateGameStatusEnum1765224000000 implements MigrationInterface {
    name = 'UpdateGameStatusEnum1765224000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adding new status values for the Assignment flow
        await queryRunner.query(`ALTER TYPE "public"."games_status_enum" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_PENDING'`);
        await queryRunner.query(`ALTER TYPE "public"."games_status_enum" ADD VALUE IF NOT EXISTS 'COMPLETED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Downgrading enums in Postgres is non-trivial and often unnecessary for simple additions.
    }

}
