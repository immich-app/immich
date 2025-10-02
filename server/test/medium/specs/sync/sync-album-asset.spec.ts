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
  ack: expect.stringContaining(SyncEntityType.AlbumAssetUpdateV1),
  data: {},
  type: SyncEntityType.SyncAckV1,
};

const backfillSyncAck = {
  ack: expect.stringContaining(SyncEntityType.AlbumAssetBackfillV1),
  data: {},
  type: SyncEntityType.SyncAckV1,
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.AlbumAssetsV1, () => {
  it('should detect and sync the first album asset', async () => {
    const originalFileName = 'firstAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({
      originalFileName,
      ownerId: user2.id,
      checksum: Buffer.from(checksum, 'base64'),
      thumbhash: Buffer.from(thumbhash, 'base64'),
      fileCreatedAt: date,
      fileModifiedAt: date,
      localDateTime: date,
      deletedAt: null,
      duration: '0:10:00.00000',
      livePhotoVideoId: null,
      stackId: null,
      libraryId: null,
    });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: {
          id: asset.id,
          originalFileName,
          ownerId: asset.ownerId,
          thumbhash,
          checksum,
          deletedAt: asset.deletedAt,
          fileCreatedAt: asset.fileCreatedAt,
          fileModifiedAt: asset.fileModifiedAt,
          isFavorite: asset.isFavorite,
          localDateTime: asset.localDateTime,
          type: asset.type,
          visibility: asset.visibility,
          duration: asset.duration,
          livePhotoVideoId: asset.livePhotoVideoId,
          stackId: asset.stackId,
          libraryId: asset.libraryId,
        },
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetsV1]);
  });

  it('should sync album asset for own user', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.SyncAckV1 }),
      expect.objectContaining({ type: SyncEntityType.AlbumAssetCreateV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should not sync album asset for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user3.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: user3.id, role: AlbumUserRole.Editor });
    const { session } = await ctx.newSession({ userId: user3.id });
    const authUser3 = factory.auth({ session, user: user3 });

    await expect(ctx.syncStream(authUser3, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetsV1]);
  });

  it('should backfill album assets when a user shares an album with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    const { asset: asset1User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset1User2.id });
    await wait(2);
    const { asset: asset2User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset2User2.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: asset2User2.id });
    await wait(2);
    const { asset: asset3User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset3User2.id });
    await wait(2);
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    // ack initial album asset sync
    await ctx.syncAckAll(auth, response);

    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    // should backfill the album user
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset1User2.id,
        }),
        type: SyncEntityType.AlbumAssetBackfillV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetBackfillV1,
      },
      backfillSyncAck,
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset3User2.id,
        }),
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetsV1]);
  });

  it('should sync old assets when a user adds them to an album they share you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: firstAsset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'firstAsset' });
    const { asset: secondAsset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'secondAsset' });
    const { asset: album1Asset } = await ctx.newAsset({ ownerId: user2.id, originalFileName: 'album1Asset' });
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: firstAsset.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: album1Asset.id });
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const firstAlbumResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(firstAlbumResponse).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album1Asset.id,
        }),
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, firstAlbumResponse);

    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: firstAsset.id,
        }),
        type: SyncEntityType.AlbumAssetBackfillV1,
      },
      backfillSyncAck,
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    //  ack initial album asset sync
    await ctx.syncAckAll(auth, response);

    await ctx.newAlbumAsset({ albumId: album2.id, assetId: secondAsset.id });
    await wait(2);

    // should backfill the new asset even though it's older than the first asset
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(newResponse).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: secondAsset.id,
        }),
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumAssetsV1]);
  });

  it('should sync asset updates for an album shared with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id, isFavorite: false });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await wait(2);
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toEqual([
      updateSyncAck,
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset.id,
        }),
        type: SyncEntityType.AlbumAssetCreateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    // update the asset
    const assetRepository = ctx.get(AssetRepository);
    await assetRepository.update({
      id: asset.id,
      isFavorite: true,
    });

    const updateResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(updateResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset.id,
          isFavorite: true,
        }),
        type: SyncEntityType.AlbumAssetUpdateV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
