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
 * Self-deduping: up() renames all but the newest row per
 * (user_id, lower(name)) to `name (archived <id8>)` before creating the
 * index, so it applies cleanly on junkyard datasets. Application-level
 * guard in TeamService remains the friendly fast-path.
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
        // Prod carries pre-uniqueness duplicates (e.g. TRITON x5 for one
        // user). De-duplicate BEFORE creating the index or Postgres aborts
        // with 23505. Keep the newest row per (user_id, lower(name)); rename
        // the rest with an id-derived suffix (collision-proof).
        await queryRunner.query(`
            UPDATE "teams" t SET "name" = t."name" || ' (archived ' || left(t."id"::text, 8) || ')'
            WHERE t."id" IN (
                SELECT "id" FROM (
                    SELECT "id", ROW_NUMBER() OVER (
                        PARTITION BY "user_id", lower("name")
                        ORDER BY "created_at" DESC, "id" DESC
                    ) AS "rn" FROM "teams"
                ) s WHERE s."rn" > 1
            )
        `);
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_teams_user_lower_name" ON "teams" ("user_id", (lower("name")))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_user_lower_name"`);
    }
}
