import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Migration: EventClipColumns
 *
 * Clip-export bookkeeping on game_events. Infra-ready only:
 * CLIPS_ENABLED defaults to false, so these columns stay null and the
 * endpoint returns 501 until retention + enablement land.
 */
export class EventClipColumns1790000000001 implements MigrationInterface {
    name = "EventClipColumns1790000000001";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("game_events", [
            new TableColumn({ name: "clip_status", type: "varchar", length: "16", default: "'none'" }),
            new TableColumn({ name: "clip_url", type: "varchar", isNullable: true }),
            new TableColumn({ name: "clip_error", type: "varchar", isNullable: true }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("game_events", ["clip_status", "clip_url", "clip_error"]);
    }
}
