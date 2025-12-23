import { Kysely, sql } from 'kysely';
import { tokenizeForSearch } from 'src/utils/database';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`truncate ${sql.table('ocr_search')}`.execute(db);

  let lastAssetId: string | undefined;
  while (true) {
    const rows = await db
      .selectFrom('asset_ocr')
      .select(['assetId', sql<string>`string_agg(text, ' ')`.as('text')])
      .$if(lastAssetId !== undefined, (qb) => qb.where('assetId', '>', lastAssetId))
      .groupBy('assetId')
      .orderBy('assetId')
      .limit(5000)
      .execute();

    if (rows.length === 0) {
      break;
    }

    await db
      .insertInto('ocr_search')
      .values(rows.map(({ assetId, text }) => ({ assetId, text: tokenizeForSearch(text).join(' ') })))
      .execute();

    lastAssetId = rows.at(-1)!.assetId;
  }
}

export async function down(): Promise<void> {}
