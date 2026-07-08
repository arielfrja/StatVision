import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddInputOutputTokensToAiUsage1818000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("ai_usage_records", new TableColumn({
            name: "input_tokens",
            type: "float",
            isNullable: true
        }));

        await queryRunner.addColumn("ai_usage_records", new TableColumn({
            name: "output_tokens",
            type: "float",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("ai_usage_records", "output_tokens");
        await queryRunner.dropColumn("ai_usage_records", "input_tokens");
    }

}
