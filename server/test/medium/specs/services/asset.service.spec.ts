import { Kysely } from 'kysely';
import { JobName, SharedLinkType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedLinkAssetRepository } from 'src/repositories/shared-link-asset.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { AssetService } from 'src/services/asset.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AssetService, {
    database: db || defaultDatabase,
    real: [AssetRepository, AlbumRepository, AccessRepository, SharedLinkAssetRepository, StackRepository],
    mock: [LoggingRepository, JobRepository, StorageRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetService.name, () => {
  describe('getStatistics', () => {
    it('should return stats as numbers, not strings', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte: 12_345 });
      const auth = factory.auth({ user: { id: user.id } });
      await expect(sut.getStatistics(auth, {})).resolves.toEqual({ images: 1, total: 1, videos: 0 });
    });
  });

  describe('copy', () => {
    it('should copy albums', async () => {
      const { sut, ctx } = setup();
      const albumRepo = ctx.get(AlbumRepository);

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      const { album } = await ctx.newAlbum({ ownerId: user.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: oldAsset.id });

      const auth = factory.auth({ user: { id: user.id } });
      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });

      await expect(albumRepo.getAssetIds(album.id, [oldAsset.id, newAsset.id])).resolves.toEqual(
        new Set([oldAsset.id, newAsset.id]),
      );
    });

    it('should copy shared links', async () => {
      const { sut, ctx } = setup();
      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: oldAsset.id, description: 'foo' });
      await ctx.newExif({ assetId: newAsset.id, description: 'bar' });

      const { id: sharedLinkId } = await sharedLinkRepo.create({
        allowUpload: false,
        key: Buffer.from('123'),
        type: SharedLinkType.Individual,
        userId: user.id,
        assetIds: [oldAsset.id],
      });

      const auth = factory.auth({ user: { id: user.id } });

      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });
      await expect(sharedLinkRepo.get(user.id, sharedLinkId)).resolves.toEqual(
        expect.objectContaining({
          assets: [expect.objectContaining({ id: oldAsset.id }), expect.objectContaining({ id: newAsset.id })],
        }),
      );
    });

    it('should merge stacks', async () => {
      const { sut, ctx } = setup();
      const stackRepo = ctx.get(StackRepository);

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });

      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: oldAsset.id, description: 'foo' });
      await ctx.newExif({ assetId: asset1.id, description: 'bar' });
      await ctx.newExif({ assetId: newAsset.id, description: 'bar' });
      await ctx.newExif({ assetId: asset2.id, description: 'foo' });

      await ctx.newStack({ ownerId: user.id }, [oldAsset.id, asset1.id]);

      const {
        stack: { id: newStackId },
      } = await ctx.newStack({ ownerId: user.id }, [newAsset.id, asset2.id]);

      const auth = factory.auth({ user: { id: user.id } });
      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });

      await expect(stackRepo.getById(oldAsset.id)).resolves.toEqual(undefined);

      const newStack = await stackRepo.getById(newStackId);
      expect(newStack).toEqual(
        expect.objectContaining({
          primaryAssetId: newAsset.id,
          assets: expect.arrayContaining([expect.objectContaining({ id: asset2.id })]),
        }),
      );
      expect(newStack!.assets.length).toEqual(4);
    });

    it('should copy stack', async () => {
      const { sut, ctx } = setup();
      const stackRepo = ctx.get(StackRepository);

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });

      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: oldAsset.id, description: 'foo' });
      await ctx.newExif({ assetId: asset1.id, description: 'bar' });
      await ctx.newExif({ assetId: newAsset.id, description: 'bar' });

      const {
        stack: { id: stackId },
      } = await ctx.newStack({ ownerId: user.id }, [oldAsset.id, asset1.id]);

      const auth = factory.auth({ user: { id: user.id } });
      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });

      const stack = await stackRepo.getById(stackId);
      expect(stack).toEqual(
        expect.objectContaining({
          primaryAssetId: oldAsset.id,
          assets: expect.arrayContaining([expect.objectContaining({ id: newAsset.id })]),
        }),
      );
      expect(stack!.assets.length).toEqual(3);
    });

    it('should copy favorite status', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id, isFavorite: true });
      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: oldAsset.id, description: 'foo' });
      await ctx.newExif({ assetId: newAsset.id, description: 'bar' });

      const auth = factory.auth({ user: { id: user.id } });
      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });

      await expect(assetRepo.getById(newAsset.id)).resolves.toEqual(expect.objectContaining({ isFavorite: true }));
    });
    it('should copy sidecar file', async () => {
      const { sut, ctx } = setup();
      const storageRepo = ctx.getMock(StorageRepository);
      const jobRepo = ctx.getMock(JobRepository);

      storageRepo.copyFile.mockResolvedValue();
      jobRepo.queue.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id, sidecarPath: '/path/to/my/sidecar.xmp' });
      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: oldAsset.id, description: 'foo' });
      await ctx.newExif({ assetId: newAsset.id, description: 'bar' });

      const auth = factory.auth({ user: { id: user.id } });

      await sut.copy(auth, { from: oldAsset.id, to: newAsset.id });

      expect(storageRepo.copyFile).toHaveBeenCalledWith('/path/to/my/sidecar.xmp', `${newAsset.originalPath}.xmp`);

      expect(jobRepo.queue).toHaveBeenCalledWith({
        name: JobName.AssetExtractMetadata,
        data: { id: newAsset.id },
      });
    });
  });
});
