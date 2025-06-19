import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { mediumFactory, newSyncAuthUser, newSyncTest } from 'test/medium.factory';
import { getKyselyDB, wait } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const database = db || defaultDatabase;
  const result = newSyncTest({ db: database });
  const { auth, create } = newSyncAuthUser();
  await create(database);
  return { ...result, auth };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.AlbumUsersV1, () => {
  it('should sync an album user with the correct properties', async () => {
    const { auth, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const albumUserRepo = getRepository('albumUser');
    const userRepo = getRepository('user');

    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [], []);

    const user = mediumFactory.userInsert();
    await userRepo.create(user);

    const albumUser = { albumsId: album.id, usersId: user.id, role: AlbumUserRole.EDITOR };
    await albumUserRepo.create(albumUser);

    await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          albumId: albumUser.albumsId,
          role: albumUser.role,
          userId: albumUser.usersId,
        }),
        type: SyncEntityType.AlbumUserV1,
      },
    ]);
  });
  describe('owner', () => {
    it('should detect and sync a new shared user', async () => {
      const { auth, testSync, getRepository } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user1 = mediumFactory.userInsert();
      await userRepo.create(user1);

      const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
      await albumRepo.create(album, [], []);

      const albumUser = { albumsId: album.id, usersId: user1.id, role: AlbumUserRole.EDITOR };
      await albumUserRepo.create(albumUser);

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumsId,
            role: albumUser.role,
            userId: albumUser.usersId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, testSync, getRepository, sut } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user1 = mediumFactory.userInsert();
      await userRepo.create(user1);

      const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
      await albumRepo.create(album, [], []);

      const albumUser = { albumsId: album.id, usersId: user1.id, role: AlbumUserRole.EDITOR };
      await albumUserRepo.create(albumUser);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user1.id }, { role: AlbumUserRole.VIEWER });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumsId,
            role: AlbumUserRole.VIEWER,
            userId: albumUser.usersId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, testSync, getRepository, sut } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user1 = mediumFactory.userInsert();
      await userRepo.create(user1);

      const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
      await albumRepo.create(album, [], []);

      const albumUser = { albumsId: album.id, usersId: user1.id, role: AlbumUserRole.EDITOR };
      await albumUserRepo.create(albumUser);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.delete({ albumsId: album.id, usersId: user1.id });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumsId,
            userId: albumUser.usersId,
          }),
          type: SyncEntityType.AlbumUserDeleteV1,
        },
      ]);
    });
  });

  describe('shared user', () => {
    it('should detect and sync a new shared user', async () => {
      const { auth, testSync, getRepository } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user1 = mediumFactory.userInsert();
      await userRepo.create(user1);

      const album = mediumFactory.albumInsert({ ownerId: user1.id });
      await albumRepo.create(album, [], []);

      const albumUser = { albumsId: album.id, usersId: auth.user.id, role: AlbumUserRole.EDITOR };
      await albumUserRepo.create(albumUser);

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: albumUser.albumsId,
            role: albumUser.role,
            userId: albumUser.usersId,
          }),
          type: SyncEntityType.AlbumUserV1,
        },
      ]);
    });

    it('should detect and sync an updated shared user', async () => {
      const { auth, testSync, getRepository, sut } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const owner = mediumFactory.userInsert();
      const user = mediumFactory.userInsert();
      await Promise.all([userRepo.create(owner), userRepo.create(user)]);

      const album = mediumFactory.albumInsert({ ownerId: owner.id });
      await albumRepo.create(
        album,
        [],
        [
          { userId: auth.user.id, role: AlbumUserRole.EDITOR },
          { userId: user.id, role: AlbumUserRole.EDITOR },
        ],
      );

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      expect(initialSyncResponse).toHaveLength(2);
      const acks = [initialSyncResponse[1].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.update({ albumsId: album.id, usersId: user.id }, { role: AlbumUserRole.VIEWER });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
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
    });

    it('should detect and sync a deleted shared user', async () => {
      const { auth, testSync, getRepository, sut } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const owner = mediumFactory.userInsert();
      const user = mediumFactory.userInsert();
      await Promise.all([userRepo.create(owner), userRepo.create(user)]);

      const album = mediumFactory.albumInsert({ ownerId: owner.id });
      await albumRepo.create(
        album,
        [],
        [
          { userId: auth.user.id, role: AlbumUserRole.EDITOR },
          { userId: user.id, role: AlbumUserRole.EDITOR },
        ],
      );

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      expect(initialSyncResponse).toHaveLength(2);
      const acks = [initialSyncResponse[1].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([]);

      await albumUserRepo.delete({ albumsId: album.id, usersId: user.id });

      await expect(testSync(auth, [SyncRequestType.AlbumUsersV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            albumId: album.id,
            userId: user.id,
          }),
          type: SyncEntityType.AlbumUserDeleteV1,
        },
      ]);
    });

    it('should backfill album users when a user shares an album with you', async () => {
      const { auth, sut, testSync, getRepository } = await setup();

      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user1 = mediumFactory.userInsert();
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user1);
      await userRepo.create(user2);

      const album1 = mediumFactory.albumInsert({ ownerId: user1.id });
      const album2 = mediumFactory.albumInsert({ ownerId: user1.id });
      await albumRepo.create(album1, [], []);
      await albumRepo.create(album2, [], []);

      // backfill album user
      await albumUserRepo.create({ albumsId: album1.id, usersId: user1.id, role: AlbumUserRole.EDITOR });
      await wait(2);
      // initial album user
      await albumUserRepo.create({ albumsId: album2.id, usersId: auth.user.id, role: AlbumUserRole.EDITOR });
      await wait(2);
      // post checkpoint album user
      await albumUserRepo.create({ albumsId: album1.id, usersId: user2.id, role: AlbumUserRole.EDITOR });

      const response = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
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
      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });

      // get access to the backfill album user
      await albumUserRepo.create({ albumsId: album1.id, usersId: auth.user.id, role: AlbumUserRole.EDITOR });

      // should backfill the album user
      const backfillResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      expect(backfillResponse).toEqual([
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

      await sut.setAcks(auth, { acks: [backfillResponse[1].ack, backfillResponse.at(-1).ack] });

      const finalResponse = await testSync(auth, [SyncRequestType.AlbumUsersV1]);
      expect(finalResponse).toEqual([]);
    });
  });
});
