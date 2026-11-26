import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ViewRepository } from 'src/repositories/view-repository.js';
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
  return { ctx, sut: ctx.get(ViewRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(ViewRepository.name, () => {
  describe('getAssetsByOriginalPath', () => {
    it('should only return assets directly in the folder', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath: '/photos/a_b/1.jpg' });
      await ctx.newAsset({ ownerId: user.id, originalPath: '/photos/a_b/sub/2.jpg' });
      await ctx.newAsset({ ownerId: user.id, originalPath: '/photos/a-b/3.jpg' });
      await ctx.newAsset({ ownerId: user.id, originalPath: '/backup/photos/a_b/4.jpg' });
      const { asset: rootAsset } = await ctx.newAsset({ ownerId: user.id, originalPath: '/5.jpg' });

      const getIds = async (path: string) => {
        const assets = await sut.getAssetsByOriginalPath(user.id, path);
        return assets.map(({ id }) => id);
      };

      for (const path of ['/photos/a_b', '/photos/a_b/', 'photos/a_b']) {
        await expect(getIds(path)).resolves.toEqual([asset.id]);
      }
      await expect(getIds('/')).resolves.toEqual([rootAsset.id]);
    });
  });
});
