import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Migration: EventTimestampPrecision
 *
 * Adds honesty metadata for AI-estimated event timestamps
 * (see docs/specifications/EVENT_TIMESTAMP_PRECISION_SRD.md).
 * All nullable/defaulted — zero-downtime, no backfill rewrite needed:
 * existing rows read as estimated/unreviewed.
 */
export class EventTimestampPrecision1790000000000 implements MigrationInterface {
    name = "EventTimestampPrecision1790000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("game_events", [
            new TableColumn({ name: "source_fps", type: "float", isNullable: true }),
            new TableColumn({ name: "frame_index", type: "int", isNullable: true }),
            new TableColumn({ name: "time_precision", type: "varchar", length: "16", default: "'estimated'" }),
            new TableColumn({ name: "needs_review", type: "boolean", default: false }),
        ]);
        await queryRunner.addColumn(
            "worker_video_analysis_jobs",
            new TableColumn({ name: "source_fps", type: "float", isNullable: true })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("worker_video_analysis_jobs", "source_fps");
        await queryRunner.dropColumns("game_events", [
            "source_fps",
            "frame_index",
            "time_precision",
            "needs_review",
        ]);
    }
}
