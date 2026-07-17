import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Migration: AddCertaintyColumnsToGameEvent
 *
 * ⚠️ SAFETY CHECKLIST (RUN BEFORE DEPLOY):
 * 1. BACKUP the `game_events` table (or the entire database) before running this migration.
 * 2. Verify the backup is restorable.
 *
 * SAFETY GUARANTEES:
 * - Both new columns are NULLABLE → existing rows are NOT modified, no default values applied.
 * - Only ADD COLUMN operations — no data transformation, no type changes, no constraints.
 * - Zero impact on existing data, queries, or application behavior until the new code is deployed.
 * - Rollback (down) simply DROPS the columns — data-safe if no new code has written to them yet.
 */
export class AddCertaintyColumnsToGameEvent1784270848000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("game_events", new TableColumn({
            name: "player_certainty",
            type: "float",
            isNullable: true
        }));

        await queryRunner.addColumn("game_events", new TableColumn({
            name: "event_type_certainty",
            type: "float",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("game_events", "event_type_certainty");
        await queryRunner.dropColumn("game_events", "player_certainty");
    }

}
