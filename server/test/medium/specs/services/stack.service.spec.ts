import { Kysely } from 'kysely';
import { AssetMetadataKey } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { StackService } from 'src/services/stack.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(StackService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AssetRepository, StackRepository, UserRepository],
    mock: [EventRepository, LoggingRepository],
  });
};

const nsfwMetadata = (isNsfw: boolean) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: [] },
  },
});

describe(StackService.name, () => {
  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('nsfw privacy', () => {
    it('filters hidden NSFW stack children and denies stacks with hidden NSFW primary assets', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { asset: safePrimary } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfwChild } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfwPrimary } = await ctx.newAsset({ ownerId: user.id });
      const { asset: safeChild } = await ctx.newAsset({ ownerId: user.id });

      await Promise.all([
        ctx.newExif({ assetId: safePrimary.id, make: 'Canon' }),
        ctx.newExif({ assetId: nsfwChild.id, make: 'Canon' }),
        ctx.newExif({ assetId: nsfwPrimary.id, make: 'Canon' }),
        ctx.newExif({ assetId: safeChild.id, make: 'Canon' }),
        ctx.newMetadata({
          assetId: nsfwChild.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
        ctx.newMetadata({
          assetId: nsfwPrimary.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
      ]);

      const {
        stack: { id: safePrimaryStackId },
      } = await ctx.newStack({ ownerId: user.id }, [safePrimary.id, nsfwChild.id]);
      const {
        stack: { id: nsfwPrimaryStackId },
      } = await ctx.newStack({ ownerId: user.id }, [nsfwPrimary.id, safeChild.id]);

      const hiddenAuth = { ...auth, hideNsfwAssets: true };
      const hiddenStacks = await sut.search(hiddenAuth, {});
      expect(hiddenStacks).toEqual([
        expect.objectContaining({
          id: safePrimaryStackId,
          primaryAssetId: safePrimary.id,
          assets: [expect.objectContaining({ id: safePrimary.id })],
        }),
      ]);
      await expect(sut.get(hiddenAuth, nsfwPrimaryStackId)).rejects.toThrow('Not found or no stack.read access');

      const elevatedStacks = await sut.search(auth, {});
      expect(elevatedStacks.map(({ id }) => id)).toEqual(
        expect.arrayContaining([safePrimaryStackId, nsfwPrimaryStackId]),
      );
      expect(elevatedStacks.find(({ id }) => id === safePrimaryStackId)?.assets.map(({ id }) => id)).toEqual(
        expect.arrayContaining([safePrimary.id, nsfwChild.id]),
      );
    });
  });
});
