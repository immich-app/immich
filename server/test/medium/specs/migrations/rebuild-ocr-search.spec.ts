import { Kysely, sql } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { OcrRepository } from 'src/repositories/ocr.repository.js';
import { DB } from 'src/schema/index.js';
import { up } from 'src/schema/migrations/1792437393085-RebuildOcrSearchText.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database: defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, ocr: ctx.get(OcrRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

afterAll(async () => {
  await defaultDatabase.destroy();
});

describe('RebuildOcrSearchText', () => {
  it.each([
    {
      name: 'restore blanked search text',
      boxes: [{ text: 'Hello World' }],
      stored: '',
      expected: 'Hello World',
    },
    {
      name: 'exclude hidden text',
      boxes: [{ text: 'Hello World' }, { text: 'Hidden', isVisible: false }],
      stored: 'Hello World Hidden',
      expected: 'Hello World',
    },
    {
      name: 'keep an empty search row when every box is hidden',
      boxes: [{ text: 'Hidden', isVisible: false }],
      stored: 'Hidden',
      expected: '',
    },
    {
      name: 'restore CJK search tokens',
      boxes: [{ text: '東京タワー' }],
      stored: '東京タワー',
      expected: '東京 京タ タワ ワー',
    },
    {
      name: 'insert a missing search row',
      boxes: [{ text: 'Hello World' }],
      stored: null,
      expected: 'Hello World',
    },
  ])('should $name', async ({ boxes, stored, expected }) => {
    const { ctx, ocr } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocr.upsert(
      asset.id,
      boxes.map((box) => factory.assetOcr({ assetId: asset.id, ...box })),
      stored ?? '',
    );
    if (stored === null) {
      await ctx.database.deleteFrom('ocr_search').where('assetId', '=', asset.id).execute();
    }
    const originalBoxes = await ocr.getByAssetId(asset.id, {});

    await up(ctx.database);

    await expect(
      ctx.database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
    ).resolves.toEqual({ text: expected });
    await expect(ocr.getByAssetId(asset.id, {})).resolves.toEqual(originalBoxes);
  });

  it('should not rewrite correct search text on repeated runs', async () => {
    const { ctx, ocr } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocr.upsert(asset.id, [factory.assetOcr({ assetId: asset.id, text: 'Hello World' })], 'Hello World');

    const query = ctx.database
      .selectFrom('ocr_search')
      .select(['text', sql<string>`ctid::text`.as('ctid')])
      .where('assetId', '=', asset.id);
    const original = await query.executeTakeFirstOrThrow();

    await up(ctx.database);
    await expect(query.executeTakeFirstOrThrow()).resolves.toEqual(original);

    await up(ctx.database);
    await expect(query.executeTakeFirstOrThrow()).resolves.toEqual(original);
  });
});
