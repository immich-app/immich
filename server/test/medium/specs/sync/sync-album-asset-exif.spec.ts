import { Kysely } from 'kysely';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB, wait } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

const updateSyncAck = {
  ack: expect.stringContaining(SyncEntityType.AlbumAssetExifUpdateV1),
  data: {},
  type: SyncEntityType.SyncAckV1,
};

const backfillSyncAck = {
  ack: expect.stringContaining(SyncEntityType.AlbumAssetExifBackfillV1),
  data: {},
  type: SyncEntityType.SyncAckV1,
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.AlbumAssetExifsV1, () => {
  it('should detect and sync the first album asset exif', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
          city: null,
          country: null,
          dateTimeOriginal: null,
          description: '',
          exifImageHeight: null,
          exifImageWidth: null,
          exposureTime: null,
          fNumber: null,
          fileSizeInByte: null,
          focalLength: null,
          fps: null,
          iso: null,
          latitude: null,
          lensModel: null,
          longitude: null,
          make: 'Canon',
          model: null,
          modifyDate: null,
          orientation: null,
          profileDescription: null,
          projectionType: null,
          rating: null,
          state: null,
          timeZone: null,
        },
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetExifsV1]);
  });

  it('should sync album asset exif for own user', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetExifV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.SyncAckV1 }),
      expect.objectContaining({ type: SyncEntityType.AlbumAssetExifCreateV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should not sync album asset exif for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: user3.id, role: AlbumUserRole.Editor });
    const { session } = await ctx.newSession({ userId: user3.id });
    const authUser3 = factory.auth({ session, user: user3 });

    await expect(ctx.syncStream(authUser3, [SyncRequestType.AssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetExifV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetExifsV1]);
  });

  it('should backfill album assets exif when a user shares an album with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    const { asset: asset1User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset1User2.id, make: 'asset1User2' });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset1User2.id });
    await wait(2);
    const { asset: asset2User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset2User2.id, make: 'asset2User2' });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset2User2.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: asset2User2.id });
    await wait(2);
    const { asset: asset3User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset3User2.id });
    await ctx.newExif({ assetId: asset3User2.id, make: 'asset3User2' });
    await wait(2);
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    // ack initial album asset exif sync
    await ctx.syncAckAll(auth, response);

    // create a second album
    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    // should backfill the album user
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset1User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      backfillSyncAck,
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset3User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetExifsV1]);
  });

  it('should sync old asset exif when a user adds them to an album they share you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: firstAsset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'firstAsset' });
    await ctx.newExif({ assetId: firstAsset.id, make: 'firstAsset' });
    const { asset: secondAsset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'secondAsset' });
    await ctx.newExif({ assetId: secondAsset.id, make: 'secondAsset' });
    const { asset: album1Asset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'album1Asset' });
    await ctx.newExif({ assetId: album1Asset.id, make: 'album1Asset' });
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: firstAsset.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: album1Asset.id });
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const firstAlbumResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(firstAlbumResponse).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: album1Asset.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, firstAlbumResponse);

    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: firstAsset.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      backfillSyncAck,
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    //  ack initial album asset sync
    await ctx.syncAckAll(auth, response);

    await ctx.newAlbumAsset({ albumId: album2.id, assetId: secondAsset.id });
    await wait(2);

    // should backfill the new asset even though it's older than the first asset
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(newResponse).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: secondAsset.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetExifsV1]);
  });

  it('should sync asset exif updates for an album shared with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset.id, make: 'asset' });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    // update the asset
    const assetRepository = ctx.get(AssetRepository);
    await assetRepository.upsertExif({
      assetId: asset.id,
      city: 'New City',
    });

    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset.id,
          city: 'New City',
        }),
        type: SyncEntityType.AlbumAssetExifUpdateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should sync delayed asset exif creates for an album shared with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: assetWithExif } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: assetWithExif.id, make: 'assetWithExif' });
    const { asset: assetDelayedExif } = await ctx.newAsset({ ownerId: user2.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    const { asset: newerAsset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: newerAsset.id, make: 'newerAsset' });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: assetWithExif.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album.id, assetId: assetDelayedExif.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album.id, assetId: newerAsset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: assetWithExif.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: newerAsset.id,
        }),
        type: SyncEntityType.AlbumAssetExifCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    // update the asset
    const assetRepository = ctx.get(AssetRepository);
    await assetRepository.upsertExif({
      assetId: assetDelayedExif.id,
      city: 'Delayed Exif',
    });

    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: assetDelayedExif.id,
          city: 'Delayed Exif',
        }),
        type: SyncEntityType.AlbumAssetExifUpdateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
