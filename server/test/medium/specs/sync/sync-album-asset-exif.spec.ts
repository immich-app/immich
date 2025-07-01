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

describe(SyncRequestType.AlbumAssetExifsV1, () => {
  it('should detect and sync the first album asset exif', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
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
        type: SyncEntityType.AlbumAssetExifV1,
      },
    ]);

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toEqual([]);
  });

  it('should sync album asset exif for own user', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toHaveLength(1);
  });

  it('should not sync album asset exif for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { album } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: user3.id, role: AlbumUserRole.EDITOR });
    const { session } = await ctx.newSession({ userId: user3.id });
    const authUser3 = factory.auth({ session, user: user3 });

    await expect(ctx.syncStream(authUser3, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toHaveLength(0);
  });

  it('should backfill album assets exif when a user shares an album with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset: asset1Owner } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newExif({ assetId: asset1Owner.id, make: 'asset1Owner' });
    await wait(2);
    const { asset: asset1User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset1User2.id, make: 'asset1User2' });
    await wait(2);
    const { asset: asset2User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset2User2.id, make: 'asset2User2' });
    await wait(2);
    const { asset: asset3User2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset3User2.id, make: 'asset3User2' });
    const { album: album1 } = await ctx.newAlbum({ ownerId: user2.id });
    await ctx.newAlbumAsset({ albumId: album1.id, assetId: asset2User2.id });
    await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifV1,
      },
    ]);

    // ack initial album asset exif sync
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
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset1Owner.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
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
      {
        ack: expect.stringContaining(SyncEntityType.AlbumAssetExifBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset3User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifV1,
      },
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toEqual([]);
  });
});
