import { Kysely } from 'kysely';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { getKyselyDB, wait } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.AlbumToAssetsV1, () => {
  it('should detect and sync the first album to asset relation', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should sync album to asset for owned albums', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should detect and sync the album to asset for shared albums', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should not sync album to asset for an album owned by another user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should backfill album to assets when a user shares an album with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: album1Asset } = await ctx.newAsset({ ownerId: user2.id });
    const { asset: album2Asset } = await ctx.newAsset({ ownerId: auth.user.id });
    // Backfill album
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album2.id, assetId: album2Asset.id });
    await wait(2);
    const { album: album1 } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: album1Asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album1.id,
          assetId: album1Asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    // ack initial album to asset sync
    await ctx.syncAckAll(auth, response);

    // add user to backfill album
    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });

    // should backfill the album to asset relation
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          albumId: album2.id,
          assetId: album2Asset.id,
        }),
        type: SyncEntityType.AlbumToAssetBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.AlbumToAssetBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should detect and sync a deleted album to asset relation', async () => {
    const { auth, ctx } = await setup();
    const albumRepo = ctx.get(AlbumRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await albumRepo.removeAssetIds(album.id, [asset.id]);
    await wait(2);

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should detect and sync a deleted album to asset relation when an asset is deleted', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await assetRepo.remove({ id: asset.id });
    await wait(2);

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });

  it('should not sync a deleted album to asset relation when the album is deleted', async () => {
    const { auth, ctx } = await setup();
    const albumRepo = ctx.get(AlbumRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await albumRepo.delete(album.id);
    await wait(2);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumToAssetsV1]);
  });
});
