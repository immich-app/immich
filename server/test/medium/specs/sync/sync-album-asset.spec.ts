import { Kysely } from 'kysely';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
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
    });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
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
        },
        type: SyncEntityType.AlbumAssetV1,
      },
    ]);

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([]);
  });

  it('should sync album asset for own user', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toHaveLength(1);
  });

  it('should not sync album asset for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user3.id });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: user3.id, role: AlbumUserRole.EDITOR });
    const { session } = await ctx.newSession({ userId: user3.id });
    const authUser3 = factory.auth({ session, user: user3 });

    await expect(ctx.syncStream(authUser3, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toHaveLength(0);
  });

  it('should backfill album assets when a user shares an album with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: asset1Owner } = await ctx.newAsset({ ownerId: auth.user.id });
    await wait(2);
    const { asset: asset1User2 } = await ctx.newAsset({ ownerId: user2.id });
    await wait(2);
    const { asset: asset2User2 } = await ctx.newAsset({ ownerId: user2.id });
    await wait(2);
    const { asset: asset3User2 } = await ctx.newAsset({ ownerId: user2.id });
    await wait(2);
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: asset2User2.id });
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetV1,
      },
    ]);

    // ack initial album asset sync
    await ctx.syncAckAll(auth, response);

    // create a second album
    const { album: album2 } = await ctx.newAlbum({ ownerId: user2.id });
    await Promise.all(
      [asset1User2.id, asset2User2.id, asset3User2.id, asset1Owner.id].map((assetId) =>
        ctx.newAlbumAsset({ albumId: album2.id, assetId }),
      ),
    );
    await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

    // should backfill the album user
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset1Owner.id,
        }),
        type: SyncEntityType.AlbumAssetBackfillV1,
      },
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
      {
        ack: expect.stringContaining(SyncEntityType.AlbumAssetBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset3User2.id,
        }),
        type: SyncEntityType.AlbumAssetV1,
      },
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([]);
  });
});
