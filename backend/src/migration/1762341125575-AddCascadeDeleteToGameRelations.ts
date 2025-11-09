import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToGameRelations1762341125575 implements MigrationInterface {
    name = 'AddCascadeDeleteToGameRelations1762341125575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_team_stats" DROP CONSTRAINT "FK_32bf70b83d8835d675efc33e354"`);
        await queryRunner.query(`ALTER TABLE "game_player_stats" DROP CONSTRAINT "FK_869be150c143225bf1eaed7edb0"`);
        await queryRunner.query(`ALTER TABLE "game_team_stats" ADD CONSTRAINT "FK_32bf70b83d8835d675efc33e354" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_player_stats" ADD CONSTRAINT "FK_869be150c143225bf1eaed7edb0" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_player_stats" DROP CONSTRAINT "FK_869be150c143225bf1eaed7edb0"`);
        await queryRunner.query(`ALTER TABLE "game_team_stats" DROP CONSTRAINT "FK_32bf70b83d8835d675efc33e354"`);
        await queryRunner.query(`ALTER TABLE "game_player_stats" ADD CONSTRAINT "FK_869be150c143225bf1eaed7edb0" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_team_stats" ADD CONSTRAINT "FK_32bf70b83d8835d675efc33e354" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
