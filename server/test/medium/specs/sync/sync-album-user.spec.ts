import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { mediumFactory, newSyncAuthUser, newSyncTest } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

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
  });
});
