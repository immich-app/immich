import { Kysely } from 'kysely';
import { randomBytes } from 'node:crypto';
import { AssetIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AssetMetadataKey, SharedLinkType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedLinkAssetRepository } from 'src/repositories/shared-link-asset.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { SharedLinkService } from 'src/services/shared-link.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(SharedLinkService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AssetRepository,
      DatabaseRepository,
      SharedLinkRepository,
      SharedLinkAssetRepository,
      TagRepository,
    ],
    mock: [LoggingRepository, StorageRepository],
  });
};

const nsfwMetadata = (isNsfw: boolean, review?: { action: string; isNsfw: boolean }) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: { explicit: isNsfw ? 0.95 : 0.05 } },
    ...(review ? { review } : {}),
  },
});

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SharedLinkService.name, () => {
  describe('get', () => {
    it('should return the correct dates on the shared link album', async () => {
      const { sut, ctx } = setup();

      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const dates = ['2021-01-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'];

      for (const date of dates) {
        const { asset } = await ctx.newAsset({ fileCreatedAt: date, localDateTime: date, ownerId: user.id });
        await ctx.newExif({ assetId: asset.id, make: 'Canon' });
        await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
      }

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: true,
        type: SharedLinkType.Album,
      });

      await expect(sut.get(auth, sharedLink.id)).resolves.toMatchObject({
        album: expect.objectContaining({
          startDate: '2020-01-01T00:00:00+00:00',
          endDate: '2022-01-01T00:00:00+00:00',
        }),
      });
    });
  });

  it('should share individually assets', async () => {
    const { sut, ctx } = setup();

    const { user } = await ctx.newUser();

    const assets = await Promise.all([
      ctx.newAsset({ ownerId: user.id }),
      ctx.newAsset({ ownerId: user.id }),
      ctx.newAsset({ ownerId: user.id }),
    ]);

    for (const { asset } of assets) {
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    }

    const sharedLinkRepo = ctx.get(SharedLinkRepository);

    const sharedLink = await sharedLinkRepo.create({
      key: randomBytes(16),
      id: factory.uuid(),
      userId: user.id,
      allowUpload: false,
      type: SharedLinkType.Individual,
      assetIds: assets.map(({ asset }) => asset.id),
    });

    await expect(sut.getMine({ user, sharedLink }, [])).resolves.toMatchObject({
      assets: assets.map(({ asset }) => expect.objectContaining({ id: asset.id })),
    });
  });

  it('should hide NSFW assets from public individual shared-link payloads', async () => {
    const { sut, ctx } = setup(await getKyselyDB());
    const { user } = await ctx.newUser();

    const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
    const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });
    const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });

    for (const assetId of [visible.id, unreviewedNsfw.id, markedSafe.id, markedNsfw.id, tagOnly.id]) {
      await ctx.newExif({ assetId, make: 'Canon' });
    }

    await ctx.newMetadata({
      assetId: unreviewedNsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });
    await ctx.newMetadata({
      assetId: markedSafe.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
    });
    await ctx.newMetadata({
      assetId: markedNsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
    });

    const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
    await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

    const sharedLink = await ctx.get(SharedLinkRepository).create({
      key: randomBytes(16),
      id: factory.uuid(),
      userId: user.id,
      allowUpload: false,
      type: SharedLinkType.Individual,
      assetIds: [visible.id, unreviewedNsfw.id, markedSafe.id, markedNsfw.id, tagOnly.id],
    });

    const hiddenResponse = await sut.getMine({ user, sharedLink, hideNsfwAssets: true }, []);
    expect(hiddenResponse.assets.map(({ id }) => id)).toEqual(
      expect.arrayContaining([visible.id, markedSafe.id, tagOnly.id]),
    );
    expect(hiddenResponse.assets.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([unreviewedNsfw.id, markedNsfw.id]),
    );

    const visibleResponse = await sut.getMine({ user, sharedLink }, []);
    expect(visibleResponse.assets.map(({ id }) => id)).toEqual(
      expect.arrayContaining([unreviewedNsfw.id, markedNsfw.id]),
    );
  });

  it('should hide NSFW album assets and thumbnails from public album shared-link payloads', async () => {
    const { sut, ctx } = setup(await getKyselyDB());
    const { user } = await ctx.newUser();

    const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
    const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });

    for (const assetId of [visible.id, unreviewedNsfw.id, markedSafe.id, markedNsfw.id]) {
      await ctx.newExif({ assetId, make: 'Canon' });
    }

    await ctx.newMetadata({
      assetId: unreviewedNsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });
    await ctx.newMetadata({
      assetId: markedSafe.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
    });
    await ctx.newMetadata({
      assetId: markedNsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
    });

    const { album } = await ctx.newAlbum({ ownerId: user.id, albumThumbnailAssetId: unreviewedNsfw.id }, [
      visible.id,
      unreviewedNsfw.id,
      markedSafe.id,
      markedNsfw.id,
    ]);

    const sharedLink = await ctx.get(SharedLinkRepository).create({
      key: randomBytes(16),
      id: factory.uuid(),
      userId: user.id,
      albumId: album.id,
      allowUpload: false,
      type: SharedLinkType.Album,
    });

    const hiddenResponse = await sut.getMine({ user, sharedLink, hideNsfwAssets: true }, []);
    expect(hiddenResponse.album).toEqual(
      expect.objectContaining({ id: album.id, albumThumbnailAssetId: null, assetCount: 2 }),
    );

    const visibleResponse = await sut.getMine({ user, sharedLink }, []);
    expect(visibleResponse.album).toEqual(
      expect.objectContaining({ id: album.id, albumThumbnailAssetId: unreviewedNsfw.id, assetCount: 4 }),
    );
  });

  describe('getAll', () => {
    it('should return all shared links even when they share the same createdAt', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sameTimestamp = '2024-01-01T00:00:00.000Z';

      const link1 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        createdAt: sameTimestamp,
      });

      const link2 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        createdAt: sameTimestamp,
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain(link1.id);
      expect(ids).toContain(link2.id);
    });

    it('should return shared links sorted by createdAt in descending order', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const link1 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        createdAt: '2021-01-01T00:00:00.000Z',
      });

      const link2 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        createdAt: '2023-01-01T00:00:00.000Z',
      });

      const link3 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        createdAt: '2022-01-01T00:00:00.000Z',
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.id)).toEqual([link2.id, link3.id, link1.id]);
    });

    it('should not return shared links belonging to other users', async () => {
      const { sut, ctx } = setup();

      const { user: userA } = await ctx.newUser();
      const { user: userB } = await ctx.newUser();
      const authA = factory.auth({ user: userA });
      const authB = factory.auth({ user: userB });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const linkA = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: userA.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
      });

      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: userB.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
      });

      const resultA = await sut.getAll(authA, {});
      expect(resultA).toHaveLength(1);
      expect(resultA[0].id).toBe(linkA.id);

      const resultB = await sut.getAll(authB, {});
      expect(resultB).toHaveLength(1);
      expect(resultB[0].id).not.toBe(linkA.id);
    });

    it('should filter by albumId', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { album: album1 } = await ctx.newAlbum({ ownerId: user.id });
      const { album: album2 } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const link1 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album1.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album2.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const result = await sut.getAll(auth, { albumId: album1.id });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(link1.id);
    });

    it('should return album shared links with album data', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(1);
      expect(result[0].album).toBeDefined();
      expect(result[0].album!.id).toBe(album.id);
    });

    it('should return multiple album shared links without sql error from json group by', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { album: album1 } = await ctx.newAlbum({ ownerId: user.id });
      const { album: album2 } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const link1 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album1.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const link2 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album2.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain(link1.id);
      expect(ids).toContain(link2.id);
      expect(result[0].album).toBeDefined();
      expect(result[1].album).toBeDefined();
    });

    it('should return mixed album and individual shared links together', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { album } = await ctx.newAlbum({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      const albumLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const albumLink2 = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      const individualLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(3);
      const ids = result.map((r) => r.id);
      expect(ids).toContain(albumLink.id);
      expect(ids).toContain(albumLink2.id);
      expect(ids).toContain(individualLink.id);
    });

    it('should return only the first asset as cover for an individual shared link', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const assets = await Promise.all([
        ctx.newAsset({ ownerId: user.id, fileCreatedAt: '2021-01-01T00:00:00.000Z' }),
        ctx.newAsset({ ownerId: user.id, fileCreatedAt: '2023-01-01T00:00:00.000Z' }),
        ctx.newAsset({ ownerId: user.id, fileCreatedAt: '2022-01-01T00:00:00.000Z' }),
      ]);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);

      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        assetIds: assets.map(({ asset }) => asset.id),
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(1);
      expect(result[0].assets).toHaveLength(1);
      expect(result[0].assets[0].id).toBe(assets[0].asset.id);
    });
  });

  describe('get', () => {
    it('should return an album shared link with assets', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const [{ asset: asset1 }, { asset: asset2 }] = await Promise.all([
        ctx.newAsset({ ownerId: user.id }),
        ctx.newAsset({ ownerId: user.id }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: asset1.id, make: 'Canon' }),
        ctx.newExif({ assetId: asset2.id, make: 'Canon' }),
      ]);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: true,
        type: SharedLinkType.Album,
      });

      await sharedLinkRepo.addAssets(sharedLink.id, [asset1.id, asset2.id]);
      const result = await sut.get(auth, sharedLink.id);
      const assetIds = result.assets.map((asset) => asset.id);

      expect(result).toMatchObject({
        id: sharedLink.id,
        album: expect.objectContaining({ id: album.id }),
      });
      expect(assetIds).toHaveLength(2);
      expect(assetIds).toEqual(expect.arrayContaining([asset1.id, asset2.id]));
    });

    it('should not return trashed assets for an individual shared link', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: visibleAsset.id, make: 'Canon' });

      const { asset: trashedAsset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: trashedAsset.id, make: 'Canon' });
      await ctx.softDeleteAsset(trashedAsset.id);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        assetIds: [visibleAsset.id, trashedAsset.id],
      });

      const result = await sut.get(auth, sharedLink.id);
      expect(result).toBeDefined();
      expect(result!.assets).toHaveLength(1);
      expect(result!.assets[0].id).toBe(visibleAsset.id);
    });

    it('should return empty assets when all individually shared assets are trashed', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      await ctx.softDeleteAsset(asset.id);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
      });

      await expect(sut.get(auth, sharedLink.id)).resolves.toMatchObject({
        assets: [],
      });
    });

    it('should not return trashed assets in a shared album', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: visibleAsset.id, make: 'Canon' });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: visibleAsset.id });

      const { asset: trashedAsset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: trashedAsset.id, make: 'Canon' });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: trashedAsset.id });
      await ctx.softDeleteAsset(trashedAsset.id);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: true,
        type: SharedLinkType.Album,
      });

      await expect(sut.get(auth, sharedLink.id)).resolves.toMatchObject({
        album: expect.objectContaining({ assetCount: 1 }),
      });
    });

    it('should return an empty asset count when all album assets are trashed', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
      await ctx.softDeleteAsset(asset.id);

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      await expect(sut.get(auth, sharedLink.id)).resolves.toMatchObject({
        album: expect.objectContaining({ assetCount: 0 }),
      });
    });

    it('should not return an album shared link when the album is trashed', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      const sharedLink = await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      await ctx.softDeleteAlbum(album.id);

      await expect(sut.get(auth, sharedLink.id)).rejects.toThrow('Shared link not found');
    });
  });

  describe('getAll', () => {
    it('should not return trashed assets as cover for an individual shared link', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const { asset: trashedAsset } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: '2020-01-01T00:00:00.000Z',
      });
      await ctx.softDeleteAsset(trashedAsset.id);

      const { asset: visibleAsset } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: '2021-01-01T00:00:00.000Z',
      });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        allowUpload: false,
        type: SharedLinkType.Individual,
        assetIds: [trashedAsset.id, visibleAsset.id],
      });

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(1);
      expect(result[0].assets).toHaveLength(1);
      expect(result[0].assets[0].id).toBe(visibleAsset.id);
    });

    it('should not return an album shared link when the album is trashed', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const sharedLinkRepo = ctx.get(SharedLinkRepository);
      await sharedLinkRepo.create({
        key: randomBytes(16),
        id: factory.uuid(),
        userId: user.id,
        albumId: album.id,
        allowUpload: false,
        type: SharedLinkType.Album,
      });

      await ctx.softDeleteAlbum(album.id);

      const result = await sut.getAll(auth, {});
      expect(result).toHaveLength(0);
    });
  });

  it('should remove individually shared asset', async () => {
    const { sut, ctx } = setup();

    const { user } = await ctx.newUser();
    const auth = factory.auth({ user });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });

    const sharedLinkRepo = ctx.get(SharedLinkRepository);

    const sharedLink = await sharedLinkRepo.create({
      key: randomBytes(16),
      id: factory.uuid(),
      userId: user.id,
      allowUpload: false,
      type: SharedLinkType.Individual,
      assetIds: [asset.id],
    });

    await expect(sut.getMine({ user, sharedLink }, [])).resolves.toMatchObject({
      assets: [expect.objectContaining({ id: asset.id })],
    });

    await sut.removeAssets(auth, sharedLink.id, {
      assetIds: [asset.id],
    });

    await expect(sut.getMine({ user, sharedLink }, [])).resolves.toHaveProperty('assets', []);
  });

  it('should not remove hidden NSFW assets from individual shared links in hidden mode', async () => {
    const { sut, ctx } = setup(await getKyselyDB());

    const { user } = await ctx.newUser();
    const auth = factory.auth({ user });
    const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
    const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
    const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });
    await Promise.all([
      ctx.newExif({ assetId: visible.id, make: 'Canon' }),
      ctx.newExif({ assetId: unreviewedNsfw.id, make: 'Canon' }),
      ctx.newExif({ assetId: tagOnly.id, make: 'Canon' }),
      ctx.newMetadata({
        assetId: unreviewedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      }),
    ]);

    const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
    await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

    const sharedLink = await ctx.get(SharedLinkRepository).create({
      key: randomBytes(16),
      id: factory.uuid(),
      userId: user.id,
      allowUpload: false,
      type: SharedLinkType.Individual,
      assetIds: [visible.id, unreviewedNsfw.id, tagOnly.id],
    });

    await expect(
      sut.removeAssets({ ...auth, hideNsfwAssets: true }, sharedLink.id, {
        assetIds: [visible.id, unreviewedNsfw.id, tagOnly.id],
      }),
    ).resolves.toEqual([
      { assetId: visible.id, success: true },
      { assetId: unreviewedNsfw.id, success: false, error: AssetIdErrorReason.NO_PERMISSION },
      { assetId: tagOnly.id, success: true },
    ]);

    await expect(sut.get(auth, sharedLink.id)).resolves.toEqual(
      expect.objectContaining({
        assets: [expect.objectContaining({ id: unreviewedNsfw.id })],
      }),
    );
  });
});
