import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class AddAiUsageTracking1817000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "ai_usage_records",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid"
                },
                {
                    name: "user_id",
                    type: "uuid"
                },
                {
                    name: "type",
                    type: "enum",
                    enum: ["TOKEN", "VIDEO_SECONDS"],
                    enumName: "ai_usage_type_enum"
                },
                {
                    name: "amount",
                    type: "float"
                },
                {
                    name: "model",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "resource_id",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        await queryRunner.createForeignKey("ai_usage_records", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        await queryRunner.createIndex("ai_usage_records", new TableIndex({
            name: "idx_ai_usage_user_id",
            columnNames: ["user_id"]
        }));

        await queryRunner.createIndex("ai_usage_records", new TableIndex({
            name: "idx_ai_usage_created_at",
            columnNames: ["created_at"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("ai_usage_records");
        await queryRunner.query(`DROP TYPE "ai_usage_type_enum"`);
    }

}
