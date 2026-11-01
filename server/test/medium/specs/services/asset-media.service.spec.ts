import { Kysely } from 'kysely';
import { randomBytes } from 'node:crypto';
import { AssetMediaStatus, AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-media-response.dto.js';
import { AssetMediaSize } from 'src/dtos/asset-media.dto.js';
import { AssetFileType, AssetType, AssetVisibility, SharedLinkType } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AlbumUserRepository } from 'src/repositories/album-user.repository.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { TagRepository } from 'src/repositories/tag.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { AssetMediaService } from 'src/services/asset-media.service.js';
import { AssetService } from 'src/services/asset.service.js';
import { ImmichFileResponse } from 'src/utils/file.js';
import { mediumFactory, newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

// eslint-disable-next-line unicorn/no-unnecessary-parameters
const setup = (db?: Kysely<DB>) => {
  return newMediumService(AssetMediaService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AlbumRepository,
      AlbumUserRepository,
      AssetRepository,
      SharedLinkRepository,
      TagRepository,
      UserRepository,
    ],
    mock: [EventRepository, LoggingRepository, JobRepository, ResourceRepository, StorageRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetService.name, () => {
  it('should hide private thumbnails from album members', async () => {
    const { sut, ctx } = setup();
    const { album, asset, owner, sharedWith } = await ctx.newSharedAlbum();
    await ctx.get(AssetRepository).upsertFile({
      assetId: asset.id,
      path: 'thumbnail.jpg',
      type: AssetFileType.Thumbnail,
      isEdited: false,
      isProgressive: false,
      isTransparent: false,
    });
    const member = factory.auth({ user: sharedWith });
    await expect(sut.viewThumbnail(member, asset.id, {})).resolves.toBeInstanceOf(ImmichFileResponse);

    const tag = await ctx.get(TagRepository).create({ userId: owner.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });

    await expect(sut.viewThumbnail(member, asset.id, {})).rejects.toThrow('asset.view');
    await ctx.database.updateTable('album').set({ includePrivateAssets: true }).where('id', '=', album.id).execute();
    await expect(sut.viewThumbnail(member, asset.id, {})).resolves.toBeInstanceOf(ImmichFileResponse);
    await expect(sut.viewThumbnail(factory.auth({ user: owner }), asset.id, {})).rejects.toThrow('asset.view');
    const elevated = factory.auth({ user: owner, session: { hasElevatedPermission: true } });
    await expect(sut.viewThumbnail(elevated, asset.id, {})).resolves.toBeInstanceOf(ImmichFileResponse);
  });

  it('should confirm only submitted, account-owned uploads without returning metadata', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { user: other } = await ctx.newUser();
    const { asset: ownAsset } = await ctx.newAsset({
      ownerId: user.id,
      deletedAt: new Date(),
      checksum: randomBytes(20),
    });
    const { asset: otherAsset } = await ctx.newAsset({ ownerId: other.id, checksum: randomBytes(20) });
    const tag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [ownAsset.id] });

    const assets = [
      { id: 'own-photo', checksum: ownAsset.checksum.toString('base64') },
      { id: 'other-photo', checksum: otherAsset.checksum.toString('base64') },
    ];
    const auth = factory.auth({ user });
    await expect(sut.bulkUploadCheck(auth, { assets, presenceOnly: true })).resolves.toEqual({
      results: [
        { id: 'own-photo', action: AssetUploadAction.REJECT, reason: AssetRejectReason.DUPLICATE },
        { id: 'other-photo', action: AssetUploadAction.ACCEPT },
      ],
    });
    await expect(sut.bulkUploadCheck(auth, { assets })).resolves.toEqual({
      results: [
        { id: 'own-photo', action: AssetUploadAction.ACCEPT },
        { id: 'other-photo', action: AssetUploadAction.ACCEPT },
      ],
    });
  });

  describe('uploadAsset', () => {
    it('should create an asset and its private tag membership together', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const tag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      const elevated = factory.auth({ user, session: { hasElevatedPermission: true } });
      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const response = await sut.uploadAsset(
        elevated,
        {
          fileCreatedAt: new Date(),
          fileModifiedAt: new Date(),
          privateTagId: tag.id,
        },
        mediumFactory.uploadFile(),
      );

      expect(response.status).toBe(AssetMediaStatus.CREATED);
      await expect(sut.viewThumbnail(factory.auth({ user }), response.id, {})).rejects.toThrow('asset.view');
      await expect(ctx.get(TagRepository).getAssetIds(tag.id, [response.id])).resolves.toEqual(new Set([response.id]));
    });

    it('should let the still control the uploaded Live Photo pair’s private tag', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(StorageRepository).utimes.mockResolvedValue();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queue.mockResolvedValue();
      const { user } = await ctx.newUser();
      const tags = ctx.get(TagRepository);
      const assets = ctx.get(AssetRepository);
      const tag = await tags.getOrCreateSystemTag({
        userId: user.id,
        value: 'locked',
        systemKey: 'locked',
        isPrivate: true,
      });
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      const motion = await sut.uploadAsset(
        auth,
        {
          fileCreatedAt: new Date(),
          fileModifiedAt: new Date(),
          privateTagId: tag.id,
          privateLivePhotoMotion: true,
          visibility: AssetVisibility.Hidden,
        },
        mediumFactory.uploadFile({ originalPath: '/upload/motion.mov' }),
      );

      const still = await sut.uploadAsset(
        auth,
        {
          fileCreatedAt: new Date(),
          fileModifiedAt: new Date(),
          privateTagId: tag.id,
          livePhotoVideoId: motion.id,
        },
        mediumFactory.uploadFile(),
      );

      await expect(tags.getAssetIds(tag.id, [still.id, motion.id])).resolves.toEqual(new Set([still.id, motion.id]));
      await expect(assets.isPrivate(motion.id)).resolves.toBe(true);
      await expect(assets.getStatistics(user.id, { visibility: AssetVisibility.Locked })).resolves.toEqual({
        [AssetType.Image]: 1,
        [AssetType.Video]: 0,
        [AssetType.Audio]: 0,
        [AssetType.Other]: 0,
      });
      await tags.removeAssetIds(tag.id, [still.id]);
      await expect(assets.isPrivate(motion.id)).resolves.toBe(false);
    });

    it('should preserve a motion tag that was applied independently', async () => {
      const { ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset: motion } = await ctx.newAsset({
        ownerId: user.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Hidden,
      });
      const { asset: still } = await ctx.newAsset({ ownerId: user.id, livePhotoVideoId: motion.id });
      const tags = ctx.get(TagRepository);
      const tag = await tags.create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [still.id, motion.id] });

      await tags.removeAssetIds(tag.id, [still.id]);

      await expect(tags.getAssetIds(tag.id, [still.id, motion.id])).resolves.toEqual(new Set([motion.id]));
    });

    it('should retain motion privacy when unlinking a private Live Photo', async () => {
      const { ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset: motion } = await ctx.newAsset({
        ownerId: user.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Hidden,
      });
      const { asset: still } = await ctx.newAsset({ ownerId: user.id, livePhotoVideoId: motion.id });
      const tags = ctx.get(TagRepository);
      const assets = ctx.get(AssetRepository);
      const tag = await tags.create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [still.id] });

      await assets.update({ id: still.id, livePhotoVideoId: null });
      await expect(tags.getAssetIds(tag.id, [still.id, motion.id])).resolves.toEqual(new Set([still.id, motion.id]));
      await expect(assets.isPrivate(motion.id)).resolves.toBe(true);
    });

    it('should preserve and unlink the previous clip when a private duplicate is uploaded with a new clip', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const videos = { ownerId: user.id, type: AssetType.Video, visibility: AssetVisibility.Hidden };
      const { asset: oldMotion } = await ctx.newAsset(videos);
      const { asset: newMotion } = await ctx.newAsset(videos);
      const { asset: still } = await ctx.newAsset({ ownerId: user.id, livePhotoVideoId: oldMotion.id });
      const tags = ctx.get(TagRepository);
      const assets = ctx.get(AssetRepository);
      const tag = await tags.create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.database
        .insertInto('tag_asset')
        .values({ tagId: tag.id, assetId: newMotion.id, isLivePhotoCompanion: true })
        .execute();
      const { user: viewer } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [oldMotion.id]);
      await ctx.newAlbumUser({ albumId: album.id, userId: viewer.id });
      const { session } = await ctx.newSession({ userId: viewer.id });
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      await expect(
        sut.uploadAsset(
          auth,
          {
            fileCreatedAt: new Date(),
            fileModifiedAt: new Date(),
            privateTagId: tag.id,
            livePhotoVideoId: newMotion.id,
          },
          mediumFactory.uploadFile({ checksum: still.checksum }),
        ),
      ).resolves.toEqual({ id: still.id, status: AssetMediaStatus.DUPLICATE });

      await expect(assets.getById(still.id)).resolves.toMatchObject({ livePhotoVideoId: newMotion.id });
      await expect(assets.getById(oldMotion.id)).resolves.toMatchObject({ visibility: AssetVisibility.Timeline });
      await expect(assets.isPrivate(oldMotion.id)).resolves.toBe(true);
      await expect(
        ctx.database.selectFrom('session').select('isPendingSyncReset').where('id', '=', session.id).executeTakeFirst(),
      ).resolves.toEqual({ isPendingSyncReset: true });
      await tags.removeAssetIds(tag.id, [still.id]);
      await expect(assets.isPrivate(newMotion.id)).resolves.toBe(false);
      await expect(assets.isPrivate(oldMotion.id)).resolves.toBe(true);
    });

    it('should add an existing upload to the requested private tag', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      ctx.getMock(JobRepository).queue.mockResolvedValue();

      const dto = { fileCreatedAt: new Date(), fileModifiedAt: new Date(), privateTagId: tag.id };
      const file = mediumFactory.uploadFile({ checksum: asset.checksum });
      await expect(sut.uploadAsset(auth, dto, file)).resolves.toEqual({
        id: asset.id,
        status: AssetMediaStatus.DUPLICATE,
      });
      await expect(ctx.get(TagRepository).getAssetIds(tag.id, [asset.id])).resolves.toEqual(new Set([asset.id]));
    });

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
