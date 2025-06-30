import { Kysely } from 'kysely';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
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

describe(SyncRequestType.AlbumsV1, () => {
  it('should sync an album with the correct properties', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
          name: album.albumName,
          ownerId: album.ownerId,
        }),
        type: SyncEntityType.AlbumV1,
      },
    ]);

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
  });

  it('should detect and sync a new album', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
    ]);

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
  });

  it('should detect and sync an album delete', async () => {
    const { auth, ctx } = await setup();
    const albumRepo = ctx.get(AlbumRepository);
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
    ]);

    await albumRepo.delete(album.id);

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
    expect(newResponse).toHaveLength(1);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
        },
        type: SyncEntityType.AlbumDeleteV1,
      },
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
  });

  describe('shared albums', () => {
    it('should detect and sync an album create', async () => {
      const { auth, ctx } = await setup();
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toHaveLength(1);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
    });

    it('should detect and sync an album share (share before sync)', async () => {
      const { auth, ctx } = await setup();
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toHaveLength(1);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
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
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.newAlbumUser({ userId: auth.user.id, albumId: user2Album.id, role: AlbumUserRole.EDITOR });

      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toHaveLength(1);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: user2Album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
    });

    it('should detect and sync an album delete`', async () => {
      const { auth, ctx } = await setup();
      const albumRepo = ctx.get(AlbumRepository);
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toHaveLength(1);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);

      await albumRepo.delete(album.id);
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toHaveLength(1);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
    });

    it('should detect and sync an album unshare as an album delete', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user2 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user2.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(response).toHaveLength(1);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);

      await albumUserRepo.delete({ albumsId: album.id, usersId: auth.user.id });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumsV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);
    });
  });
});
