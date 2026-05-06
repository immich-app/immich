import { Kysely } from 'kysely';
import { AlbumUserRole, AssetMetadataKey, SyncEntityType, SyncRequestType } from 'src/enum';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const nsfwMetadata = (isNsfw: boolean) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: 0.99, labels: { explicit: 0.99 } },
  },
});

describe(SyncRequestType.AlbumsV1, () => {
  it('should sync an album with the correct properties', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
          name: album.albumName,
        }),
        type: SyncEntityType.AlbumV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
  });

  it('should detect and sync a new album', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
  });

  it('should hide NSFW album thumbnails from non-elevated sync without hiding the album', async () => {
    const { auth, user, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { album } = await ctx.newAlbum({ ownerId: user.id, albumThumbnailAssetId: asset.id });
    await ctx.newMetadata({
      assetId: asset.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });

    const hiddenResponse = await ctx.syncStream({ ...auth, hideNsfwAssets: true }, [SyncRequestType.AlbumsV1]);
    expect(hiddenResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
          thumbnailAssetId: null,
        }),
        type: SyncEntityType.AlbumV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    const elevatedResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(elevatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
          thumbnailAssetId: asset.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should detect and sync an album delete', async () => {
    const { auth, ctx } = await setup();
    const albumRepo = ctx.get(AlbumRepository);
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await albumRepo.delete(album.id);

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
        },
        type: SyncEntityType.AlbumDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
  });

  describe('shared albums', () => {
    it('should detect and sync an album create', async () => {
      const { auth, ctx } = await setup();
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
    });

    it('should detect and sync an album share (share before sync)', async () => {
      const { auth, ctx } = await setup();
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
    });

    it('should detect and sync an album share (share after sync)', async () => {
      const { auth, ctx } = await setup();
      const { user: user2 } = await ctx.newUser();
      const { album: userAlbum } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { album: user2Album } = await ctx.newAlbum({ ownerId: user2.id });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: userAlbum.id }),
          type: SyncEntityType.AlbumV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.newAlbumUser({ userId: auth.user.id, albumId: user2Album.id, role: AlbumUserRole.Editor });

      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: user2Album.id }),
          type: SyncEntityType.AlbumV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
    });

    it('should detect and sync an album delete`', async () => {
      const { auth, ctx } = await setup();
      const albumRepo = ctx.get(AlbumRepository);
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toEqual([
        expect.objectContaining({ type: SyncEntityType.AlbumV1 }),
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);

      await albumRepo.delete(album.id);
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
    });

    it('should detect and sync an album unshare as an album delete', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toEqual([
        expect.objectContaining({ type: SyncEntityType.AlbumV1 }),
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);

      await albumUserRepo.delete({ albumId: album.id, userId: auth.user.id });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumsV1]);
    });
  });
});
