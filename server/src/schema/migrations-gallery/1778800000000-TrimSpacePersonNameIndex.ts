import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "shared_space_person_space_name_idx"`.execute(db);

  await sql`CREATE INDEX "shared_space_person_space_name_idx" ON "shared_space_person" ("spaceId", "isHidden", NULLIF(BTRIM("name"), ''), (CASE WHEN NULLIF(BTRIM("name"), '') IS NULL THEN "assetCount" END) DESC, "id")`.execute(
    db,
  );

  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_shared_space_person_space_name_idx'`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_shared_space_person_space_name_idx', '{"type":"index","name":"shared_space_person_space_name_idx","sql":"CREATE INDEX \\"shared_space_person_space_name_idx\\" ON \\"shared_space_person\\" (\\"spaceId\\", \\"isHidden\\", NULLIF(BTRIM(\\"name\\"), ''''), (CASE WHEN NULLIF(BTRIM(\\"name\\"), '''') IS NULL THEN \\"assetCount\\" END) DESC, \\"id\\");"}'::jsonb)`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "shared_space_person_space_name_idx"`.execute(db);

  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_shared_space_person_space_name_idx'`.execute(db);
  await sql`CREATE INDEX "shared_space_person_space_name_idx" ON "shared_space_person" ("spaceId", "isHidden", NULLIF("name", ''), (CASE WHEN "name" = '' THEN "assetCount" END) DESC, "id")`.execute(
    db,
  );

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_shared_space_person_space_name_idx', '{"type":"index","name":"shared_space_person_space_name_idx","sql":"CREATE INDEX \\"shared_space_person_space_name_idx\\" ON \\"shared_space_person\\" (\\"spaceId\\", \\"isHidden\\", NULLIF(\\"name\\", ''''), (CASE WHEN \\"name\\" = '''' THEN \\"assetCount\\" END) DESC, \\"id\\");"}'::jsonb)`.execute(
    db,
  );
}
