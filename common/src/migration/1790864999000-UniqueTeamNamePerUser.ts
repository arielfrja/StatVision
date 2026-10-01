import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: UniqueTeamNamePerUser
 *
 * Enforces UNIQUE(user_id, lower(name)) on `teams` so team names are unique
 * per user, case-insensitively.
 *
 * ⚠️ SAFETY CHECKLIST (RUN BEFORE DEPLOY):
 * 1. BACKUP the `teams` table (or the entire database) before running.
 * 2. Verify the backup is restorable.
 * 3. DRY-RUN on a staging copy first — this migration FAILS if duplicate
 *    (user_id, lower(name)) rows already exist. De-duplicate (merge/rename)
 *    before applying. A helper query:
 *      SELECT user_id, lower(name), count(*)
 *      FROM teams GROUP BY user_id, lower(name) HAVING count(*) > 1;
 * 4. Do NOT run ad-hoc against prod — apply via the normal release pipeline.
 *
 * APPLICATION-LEVEL GUARD: until this migration is applied, uniqueness is
 * enforced in TeamService.createTeam/updateTeam (DUPLICATE_TEAM_NAME → 409).
 * After this migration lands, the app guard remains as a friendly fast-path;
 * the unique index is the backstop against races (e.g. rapid triple-POST).
 */
export class UniqueTeamNamePerUser1790864999000 implements MigrationInterface {
    name = "UniqueTeamNamePerUser1790864999000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_teams_user_lower_name" ON "teams" ("user_id", (lower("name")))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_user_lower_name"`);
    }
}
