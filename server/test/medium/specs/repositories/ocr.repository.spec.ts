import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { OcrRepository } from 'src/repositories/ocr.repository.js';
import { DB } from 'src/schema/index.js';
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
  return { ctx, sut: ctx.get(OcrRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

afterAll(async () => {
  await defaultDatabase.destroy();
});

describe(OcrRepository.name, () => {
  describe('updateOcrVisibilities', () => {
    it('should keep the search text when no box changes visibility', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.upsert(asset.id, [factory.assetOcr({ assetId: asset.id, text: 'Hello World' })], 'Hello World');

      await sut.updateOcrVisibilities(asset.id, [], [], 'Hello World');

      await expect(
        ctx.database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ text: 'Hello World' });
    });

    it('should hide boxes and set the search text', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const visible = factory.assetOcr({ assetId: asset.id, text: 'Hello' });
      const hidden = factory.assetOcr({ assetId: asset.id, text: 'World' });
      await sut.upsert(asset.id, [visible, hidden], 'Hello World');

      await sut.updateOcrVisibilities(asset.id, [], [hidden], 'Hello');

      await expect(sut.getByAssetId(asset.id, { isVisible: false })).resolves.toEqual([
        expect.objectContaining({ id: hidden.id, isVisible: false }),
      ]);
      await expect(
        ctx.database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ text: 'Hello' });
    });
  });
});
