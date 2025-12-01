import { Kysely, sql } from 'kysely';
import { tokenizeForSearch } from 'src/utils/database';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`truncate ${sql.table('ocr_search')}`.execute(db);
  const batch = [];
  for await (const { assetId, text } of db
    .selectFrom('asset_ocr')
    .select(['assetId', sql<string>`string_agg(text, ' ')`.as('text')])
    .groupBy('assetId')
    .stream()) {
    batch.push({ assetId, text: tokenizeForSearch(text).join(' ') });
    if (batch.length >= 5000) {
      await db.insertInto('ocr_search').values(batch).execute();
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await db.insertInto('ocr_search').values(batch).execute();
  }
}

export async function down(): Promise<void> {}
