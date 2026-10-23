import { Kysely, sql } from 'kysely';
import { tokenizeForSearch } from 'src/utils/database.js';

export async function up(db: Kysely<any>): Promise<void> {
  // Edits without a crop and thumbnail regeneration used to replace the search text with only the boxes whose
  // visibility changed, which is usually none, so rebuild it from the visible boxes.
  let lastAssetId: string | undefined;
  while (true) {
    const rows = await db
      .selectFrom('asset_ocr')
      .select(['assetId', sql<string>`coalesce(string_agg(text, ' ') filter (where "isVisible"), '')`.as('text')])
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
      .onConflict((oc) =>
        oc
          .column('assetId')
          .doUpdateSet((eb) => ({ text: eb.ref('excluded.text') }))
          .whereRef('ocr_search.text', 'is distinct from', 'excluded.text'),
      )
      .execute();

    lastAssetId = rows.at(-1)!.assetId;
  }
}

export async function down(): Promise<void> {}
