import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "session" SET "isPendingSyncReset" = true
    WHERE EXISTS (
      SELECT 1 FROM "tag_asset"
      JOIN "tag_closure" ON "tag_closure".id_descendant = "tag_asset"."tagId"
      JOIN "tag" ON "tag".id = "tag_closure".id_ancestor
      WHERE "tag"."isPrivate"
    );
  `.execute(db);
}

export async function down(): Promise<void> {}
