import { Kysely } from 'kysely';
import { AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AssetMediaSize } from 'src/dtos/asset-media.dto';
import { AssetFileType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { AssetMediaService } from 'src/services/asset-media.service';
import { AssetService } from 'src/services/asset.service';
import { ImmichFileResponse } from 'src/utils/file';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AssetMediaService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AssetRepository, UserRepository],
    mock: [EventRepository, LoggingRepository, JobRepository, StorageRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetService.name, () => {
  describe('uploadAsset', () => {
    it('should work', async () => {
      const { sut, ctx } = setup();

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte: 12_345 });
      const auth = factory.auth({ user: { id: user.id } });
      const file = mediumFactory.uploadFile();

      await expect(
        sut.uploadAsset(
          auth,
          {
            deviceId: 'some-id',
            deviceAssetId: 'some-id',
            fileModifiedAt: new Date(),
            fileCreatedAt: new Date(),
            assetData: Buffer.from('some data'),
          },
          file,
        ),
      ).resolves.toEqual({
        id: expect.any(String),
        status: AssetMediaStatus.CREATED,
      });

      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AssetCreate', {
        asset: expect.objectContaining({ deviceAssetId: 'some-id' }),
      });
    });

    it('should work with an empty metadata list', async () => {
      const { sut, ctx } = setup();

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte: 12_345 });
      const auth = factory.auth({ user: { id: user.id } });
      const file = mediumFactory.uploadFile();

      await expect(
        sut.uploadAsset(
          auth,
          {
            deviceId: 'some-id',
            deviceAssetId: 'some-id',
            fileModifiedAt: new Date(),
            fileCreatedAt: new Date(),
            assetData: Buffer.from('some data'),
            metadata: [],
          },
          file,
        ),
      ).resolves.toEqual({
        id: expect.any(String),
        status: AssetMediaStatus.CREATED,
      });
    });
  });

  describe('viewThumbnail', () => {
    it('should return original thumbnail by default when both exist', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create both original and edited thumbnails
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/original/preview.jpg',
        isEdited: false,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/edited/preview.jpg',
        isEdited: true,
      });

      const auth = factory.auth({ user: { id: user.id } });
      const result = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.PREVIEW });

      expect(result).toBeInstanceOf(ImmichFileResponse);
      expect((result as ImmichFileResponse).path).toBe('/original/preview.jpg');
    });

    it('should return edited thumbnail when edited=true', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create both original and edited thumbnails
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/original/preview.jpg',
        isEdited: false,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/edited/preview.jpg',
        isEdited: true,
      });

      const auth = factory.auth({ user: { id: user.id } });
      const result = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.PREVIEW, edited: true });

      expect(result).toBeInstanceOf(ImmichFileResponse);
      expect((result as ImmichFileResponse).path).toBe('/edited/preview.jpg');
    });

    it('should return original thumbnail when edited=false', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create both original and edited thumbnails
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/original/preview.jpg',
        isEdited: false,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/edited/preview.jpg',
        isEdited: true,
      });

      const auth = factory.auth({ user: { id: user.id } });
      const result = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.PREVIEW, edited: false });

      expect(result).toBeInstanceOf(ImmichFileResponse);
      expect((result as ImmichFileResponse).path).toBe('/original/preview.jpg');
    });

    it('should return original thumbnail when only original exists and edited=false', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create only original thumbnail
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/original/preview.jpg',
        isEdited: false,
      });

      const auth = factory.auth({ user: { id: user.id } });
      const result = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.PREVIEW, edited: false });

      expect(result).toBeInstanceOf(ImmichFileResponse);
      expect((result as ImmichFileResponse).path).toBe('/original/preview.jpg');
    });

    it('should return original thumbnail when only original exists and edited=true', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create only original thumbnail
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: '/original/preview.jpg',
        isEdited: false,
      });

      const auth = factory.auth({ user: { id: user.id } });
      const result = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.PREVIEW, edited: true });

      expect(result).toBeInstanceOf(ImmichFileResponse);
      expect((result as ImmichFileResponse).path).toBe('/original/preview.jpg');
    });

    it('should work with thumbnail size', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create both original and edited thumbnails
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Thumbnail,
        path: '/original/thumbnail.jpg',
        isEdited: false,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Thumbnail,
        path: '/edited/thumbnail.jpg',
        isEdited: true,
      });

      const auth = factory.auth({ user: { id: user.id } });

      // Test default (should get original)
      const resultDefault = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.THUMBNAIL });
      expect(resultDefault).toBeInstanceOf(ImmichFileResponse);
      expect((resultDefault as ImmichFileResponse).path).toBe('/original/thumbnail.jpg');

      // Test edited=true (should get edited)
      const resultEdited = await sut.viewThumbnail(auth, asset.id, { size: AssetMediaSize.THUMBNAIL, edited: true });
      expect(resultEdited).toBeInstanceOf(ImmichFileResponse);
      expect((resultEdited as ImmichFileResponse).path).toBe('/edited/thumbnail.jpg');
    });
  });
});
