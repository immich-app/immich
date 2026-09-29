import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DELETE FROM "shared_link_asset"
    USING "shared_link"
    WHERE "shared_link_asset"."sharedLinkId" = "shared_link"."id" AND "shared_link"."type" = 'ALBUM';
`.execute(db);
}

export async function down(): Promise<void> {
  // noop
}
