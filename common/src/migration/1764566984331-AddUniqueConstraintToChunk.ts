import { MigrationInterface, QueryRunner, TableUnique } from "typeorm";

export class AddUniqueConstraintToChunk1764566984331 implements MigrationInterface {
    name = 'AddUniqueConstraintToChunk1764566984331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createUniqueConstraint(
            "worker_video_analysis_chunks",
            new TableUnique({
                name: "UQ_worker_video_analysis_chunks_jobId_sequence",
                columnNames: ["job_id", "sequence"]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint("worker_video_analysis_chunks", "UQ_worker_video_analysis_chunks_jobId_sequence");
    }

}
