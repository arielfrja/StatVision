import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsTempAndNullableVideoClipTimes1762264184728 implements MigrationInterface {
    name = 'AddIsTempAndNullableVideoClipTimes1762264184728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" ADD "isTemp" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "isTemp" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "isTemp"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "isTemp"`);
    }

}
