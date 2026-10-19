import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { OcrRepository } from 'src/repositories/ocr.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(OcrRepository) };
};

const box = { x1: 0.1, y1: 0.2, x2: 0.9, y2: 0.2, x3: 0.9, y3: 0.8, x4: 0.1, y4: 0.8, boxScore: 0.95, textScore: 0.92 };

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(OcrRepository.name, () => {
  describe('updateOcrVisibilities', () => {
    it('should keep the search text when no box changes visibility', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.upsert(asset.id, [{ assetId: asset.id, ...box, text: 'Hello World' }], 'Hello World');

      await sut.updateOcrVisibilities(asset.id, [], [], 'Hello World');

      await expect(
        ctx.database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ text: 'Hello World' });
    });

    it('should hide boxes and set the search text', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.upsert(
        asset.id,
        [
          { assetId: asset.id, ...box, text: 'Hello' },
          { assetId: asset.id, ...box, text: 'World' },
        ],
        'Hello World',
      );
      const ocrs = await sut.getByAssetId(asset.id);
      const world = ocrs.find(({ text }) => text === 'World')!;

      await sut.updateOcrVisibilities(asset.id, [], [world], 'Hello');

      await expect(sut.getByAssetId(asset.id, { isVisible: false })).resolves.toEqual([
        expect.objectContaining({ id: world.id, isVisible: false }),
      ]);
      await expect(
        ctx.database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ text: 'Hello' });
    });
  });
});
