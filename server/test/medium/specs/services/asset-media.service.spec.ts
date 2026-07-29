import { Kysely } from 'kysely';
import { randomBytes } from 'node:crypto';
import { AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AssetMediaSize } from 'src/dtos/asset-media.dto';
import { AssetFileType, JobName, SharedLinkType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
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
    real: [AccessRepository, AlbumRepository, AssetRepository, SharedLinkRepository, UserRepository],
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

      const fileSizeInByte = 12_345;

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte });
      const auth = factory.auth({ user: { id: user.id } });

      await expect(
        sut.uploadAsset(
          auth,
          {
            fileModifiedAt: new Date(),
            fileCreatedAt: new Date(),
            assetData: Buffer.from('some data'),
          },
          mediumFactory.uploadFile({ size: fileSizeInByte }),
        ),
      ).resolves.toEqual({
        id: expect.any(String),
        status: AssetMediaStatus.CREATED,
      });

      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AssetCreate', {
        asset: expect.objectContaining({}),
        file: expect.objectContaining({ size: fileSizeInByte }),
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

    it('should remove the created asset and its sidecar record when a post-create step fails', async () => {
      const { sut, ctx } = setup();

      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();
      // the sidecar utimes succeeds, the main file's utimes fails
      ctx.getMock(StorageRepository).utimes.mockResolvedValueOnce().mockRejectedValueOnce(new Error('utimes failed'));

      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });
      const dto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };
      const file = mediumFactory.uploadFile({ originalPath: '/path/to/main.jpg' });
      const sidecar = mediumFactory.uploadFile({ originalPath: '/path/to/main.jpg.xmp' });

      await expect(sut.uploadAsset(auth, dto, file, sidecar)).rejects.toThrow('utimes failed');

      await expect(
        ctx.database.selectFrom('asset').selectAll().where('ownerId', '=', user.id).execute(),
      ).resolves.toHaveLength(0);
      await expect(
        ctx.database.selectFrom('asset_file').selectAll().where('path', '=', '/path/to/main.jpg.xmp').execute(),
      ).resolves.toHaveLength(0);
      expect(ctx.getMock(JobRepository).queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/path/to/main.jpg', '/path/to/main.jpg.xmp'] },
      });
      expect(ctx.getMock(EventRepository).emit).not.toHaveBeenCalled();
    });

    it('should upload cleanly when the same file is retried after a post-create failure', async () => {
      const { sut, ctx } = setup();

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      // the first upload fails to queue its metadata job
      ctx.getMock(JobRepository).queue.mockRejectedValueOnce(new Error('queue down')).mockResolvedValue();

      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });
      const dto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };
      const file = mediumFactory.uploadFile({ originalPath: '/path/to/first.jpg' });

      await expect(sut.uploadAsset(auth, dto, file)).rejects.toThrow('queue down');

      // nothing survives the failed attempt
      await expect(
        ctx.database.selectFrom('asset').selectAll().where('ownerId', '=', user.id).execute(),
      ).resolves.toHaveLength(0);
      expect(ctx.getMock(JobRepository).queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/path/to/first.jpg', undefined] },
      });
      expect(ctx.getMock(EventRepository).emit).not.toHaveBeenCalled();

      const retryFile = mediumFactory.uploadFile({ originalPath: '/path/to/second.jpg', checksum: file.checksum });
      await expect(sut.uploadAsset(auth, dto, retryFile)).resolves.toEqual({
        id: expect.any(String),
        status: AssetMediaStatus.CREATED,
      });

      const [asset] = await ctx.database.selectFrom('asset').selectAll().where('ownerId', '=', user.id).execute();
      expect(asset).toMatchObject({ checksum: retryFile.checksum, originalPath: retryFile.originalPath });
      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledTimes(1);
      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AssetCreate', {
        asset: expect.objectContaining({ id: asset.id }),
        file: expect.objectContaining({ size: retryFile.size }),
      });
    });

    it('should add to a shared link', async () => {
      const { sut, ctx } = setup();

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const { user } = await ctx.newUser();

      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(50),
        type: SharedLinkType.Individual,
        description: 'Shared link description',
        userId: user.id,
        allowDownload: true,
        allowUpload: true,
      });

      const auth = factory.auth({ user: { id: user.id }, sharedLink });
      const file = mediumFactory.uploadFile();
      const uploadDto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };

      const response = await sut.uploadAsset(auth, uploadDto, file);
      expect(response).toEqual({ id: expect.any(String), status: AssetMediaStatus.CREATED });

      const update = await sharedLinkRepo.get(user.id, sharedLink.id);
      const assets = update!.assets;
      expect(assets).toHaveLength(1);
      expect(assets[0]).toMatchObject({ id: response.id });
    });

    it('should handle adding a duplicate asset to a shared link', async () => {
      const { sut, ctx } = setup();

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte: 12_345 });

      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(50),
        type: SharedLinkType.Individual,
        description: 'Shared link description',
        userId: user.id,
        allowDownload: true,
        allowUpload: true,
        assetIds: [asset.id],
      });

      const auth = factory.auth({ user: { id: user.id }, sharedLink });
      const uploadDto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };

      const response = await sut.uploadAsset(auth, uploadDto, mediumFactory.uploadFile({ checksum: asset.checksum }));
      expect(response).toEqual({ id: expect.any(String), status: AssetMediaStatus.DUPLICATE });

      const update = await sharedLinkRepo.get(user.id, sharedLink.id);
      const assets = update!.assets;
      expect(assets).toHaveLength(1);
      expect(assets[0]).toMatchObject({ id: response.id });
    });

    it('should add to an album shared link', async () => {
      const { sut, ctx } = setup();

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(50),
        type: SharedLinkType.Album,
        albumId: album.id,
        description: 'Shared link description',
        userId: user.id,
        allowDownload: true,
        allowUpload: true,
      });

      const auth = factory.auth({ user: { id: user.id }, sharedLink });
      const uploadDto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };

      const response = await sut.uploadAsset(auth, uploadDto, mediumFactory.uploadFile());
      expect(response).toEqual({ id: expect.any(String), status: AssetMediaStatus.CREATED });

      const result = await ctx.get(AlbumRepository).getAssetIds(album.id, [response.id]);
      const assets = [...result];
      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual(response.id);

      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: album.id,
        userIds: [user.id],
        recipientIds: [user.id],
      });
    });

    it('should handle adding a duplicate asset to an album shared link', async () => {
      const { sut, ctx } = setup();

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [asset.id]);
      // await ctx.newExif({ assetId: asset.id, fileSizeInByte: 12_345 });

      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(50),
        type: SharedLinkType.Album,
        albumId: album.id,
        description: 'Shared link description',
        userId: user.id,
        allowDownload: true,
        allowUpload: true,
      });

      const auth = factory.auth({ user: { id: user.id }, sharedLink });
      const uploadDto = {
        fileModifiedAt: new Date(),
        fileCreatedAt: new Date(),
        assetData: Buffer.from('some data'),
      };

      const response = await sut.uploadAsset(auth, uploadDto, mediumFactory.uploadFile({ checksum: asset.checksum }));
      expect(response).toEqual({ id: expect.any(String), status: AssetMediaStatus.DUPLICATE });

      const result = await ctx.get(AlbumRepository).getAssetIds(album.id, [response.id]);
      const assets = [...result];
      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual(response.id);
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
