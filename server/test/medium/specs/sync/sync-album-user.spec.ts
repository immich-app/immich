import { Kysely } from 'kysely';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
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

describe(SyncRequestType.AlbumUsersV1, () => {
  it('should sync an album user with the correct properties', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
    const { user } = await ctx.newUser();
    const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.EDITOR });

    await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          albumId: albumUser.albumId,
          role: albumUser.role,
          userId: albumUser.userId,
        }),
        type: SyncEntityType.AlbumUserV1,
      },
    ]);
  });

  describe('owner', () => {
    it('should detect and sync a new shared user', async () => {
      const { auth, ctx } = await setup();
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(1);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumId,
            role: albumUser.role,
            userId: albumUser.userId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user1.id }, { role: AlbumUserRole.VIEWER });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toHaveLength(1);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumId,
            role: AlbumUserRole.VIEWER,
            userId: albumUser.userId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(1);
      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.delete({ albumsId: album.id, usersId: user1.id });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumId,
            userId: albumUser.userId,
          }),
          type: SyncEntityType.AlbumUserDeleteV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });
  });

  describe('shared user', () => {
    it('should detect and sync a new shared user', async () => {
      const { auth, ctx } = await setup();
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user1.id });
      const { albumUser } = await ctx.newAlbumUser({
        albumId: album.id,
        userId: auth.user.id,
        role: AlbumUserRole.EDITOR,
      });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(1);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumId,
            role: albumUser.role,
            userId: albumUser.userId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: owner } = await ctx.newUser();
      const { user: user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(2);

      await ctx.syncAckAll(auth, response);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user.id }, { role: AlbumUserRole.VIEWER });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album.id,
            role: AlbumUserRole.VIEWER,
            userId: user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: owner } = await ctx.newUser();
      const { user: user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(2);
      await ctx.syncAckAll(auth, response);

      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
      await albumUserRepo.delete({ albumsId: album.id, usersId: user.id });

      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album.id,
            userId: user.id,
          }),
          type: SyncEntityType.AlbumUserDeleteV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });

    it('should backfill album users when a user shares an album with you', async () => {
      const { auth, ctx } = await setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { album: album1 } = await ctx.newAlbum({ ownerId: user1.id });
      const { album: album2 } = await ctx.newAlbum({ ownerId: user1.id });
      // backfill album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: user1.id, role: AlbumUserRole.EDITOR });
      await wait(2);
      // initial album user
      await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });
      await wait(2);
      // post checkpoint album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: user2.id, role: AlbumUserRole.EDITOR });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toHaveLength(1);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album2.id,
            role: AlbumUserRole.EDITOR,
            userId: auth.user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      // ack initial user
      await ctx.syncAckAll(auth, response);
      // get access to the backfill album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.EDITOR });

      // should backfill the album user
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album1.id,
            role: AlbumUserRole.EDITOR,
            userId: user1.id,
          }),
          type: SyncEntityType.AlbumUserBackfillV1,
        },
        {
          ack: expect.stringContaining(SyncEntityType.AlbumUserBackfillV1),
          data: {},
          type: SyncEntityType.SyncAckV1,
        },
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album1.id,
            role: AlbumUserRole.EDITOR,
            userId: user2.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album1.id,
            role: AlbumUserRole.EDITOR,
            userId: auth.user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await expect(ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);
    });
  });
});
