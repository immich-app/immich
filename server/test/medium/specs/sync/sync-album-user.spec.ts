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
    const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.Editor });

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
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  describe('owner', () => {
    it('should detect and sync a new shared user', async () => {
      const { auth, ctx } = await setup();
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
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
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user1.id }, { role: AlbumUserRole.Viewer });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumId,
            role: AlbumUserRole.Viewer,
            userId: albumUser.userId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: user1 } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      const { albumUser } = await ctx.newAlbumUser({ albumId: album.id, userId: user1.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);

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
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
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
        role: AlbumUserRole.Editor,
      });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
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
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: owner } = await ctx.newUser();
      const { user: user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toEqual([
        expect.objectContaining({ type: SyncEntityType.AlbumUserV1 }),
        expect.objectContaining({ type: SyncEntityType.AlbumUserV1 }),
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, response);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user.id }, { role: AlbumUserRole.Viewer });
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album.id,
            role: AlbumUserRole.Viewer,
            userId: user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, ctx } = await setup();
      const albumUserRepo = ctx.get(AlbumUserRepository);
      const { user: owner } = await ctx.newUser();
      const { user: user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: auth.user.id, role: AlbumUserRole.Editor });
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toEqual([
        expect.objectContaining({ type: SyncEntityType.AlbumUserV1 }),
        expect.objectContaining({ type: SyncEntityType.AlbumUserV1 }),
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);
      await ctx.syncAckAll(auth, response);

      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
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
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });

    it('should backfill album users when a user shares an album with you', async () => {
      const { auth, ctx } = await setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { album: album1 } = await ctx.newAlbum({ ownerId: user1.id });
      const { album: album2 } = await ctx.newAlbum({ ownerId: user1.id });
      // backfill album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: user1.id, role: AlbumUserRole.Editor });
      await wait(2);
      // initial album user
      await ctx.newAlbumUser({ albumId: album2.id, userId: auth.user.id, role: AlbumUserRole.Editor });
      await wait(2);
      // post checkpoint album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: user2.id, role: AlbumUserRole.Editor });

      const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(response).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album2.id,
            role: AlbumUserRole.Editor,
            userId: auth.user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      // ack initial user
      await ctx.syncAckAll(auth, response);
      // get access to the backfill album user
      await ctx.newAlbumUser({ albumId: album1.id, userId: auth.user.id, role: AlbumUserRole.Editor });

      // should backfill the album user
      const newResponse = await ctx.syncStream(auth, [SyncRequestType.AlbumUsersV1]);
      expect(newResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album1.id,
            role: AlbumUserRole.Editor,
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
            role: AlbumUserRole.Editor,
            userId: user2.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album1.id,
            role: AlbumUserRole.Editor,
            userId: auth.user.id,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]);

      await ctx.syncAckAll(auth, newResponse);
      await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUsersV1]);
    });
  });
});
