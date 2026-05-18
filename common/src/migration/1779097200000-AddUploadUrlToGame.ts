import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUploadUrlToGame1779097200000 implements MigrationInterface {
    name = 'AddUploadUrlToGame1779097200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" ADD "upload_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "upload_url"`);
    }

}
