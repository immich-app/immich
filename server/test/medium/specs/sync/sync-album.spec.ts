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

describe(SyncRequestType.AlbumsV1, () => {
  it('should sync an album with the correct properties', async () => {
    const { auth, getRepository, testSync } = await setup();
    const albumRepo = getRepository('album');
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [], []);
    await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
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
  });

  it('should detect and sync a new album', async () => {
    const { auth, getRepository, testSync } = await setup();
    const albumRepo = getRepository('album');
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [], []);
    await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
    ]);
  });

  it('should detect and sync an album delete', async () => {
    const { auth, getRepository, testSync } = await setup();
    const albumRepo = getRepository('album');
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [], []);
    await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: album.id,
        }),
        type: SyncEntityType.AlbumV1,
      },
    ]);

    await albumRepo.delete(album.id);
    await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
        },
        type: SyncEntityType.AlbumDeleteV1,
      },
    ]);
  });

  describe('shared albums', () => {
    it('should detect and sync an album create', async () => {
      const { auth, getRepository, testSync } = await setup();
      const albumRepo = getRepository('album');
      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const album = mediumFactory.albumInsert({ ownerId: user2.id });
      await albumRepo.create(album, [], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);
    });

    it('should detect and sync an album share (share before sync)', async () => {
      const { auth, getRepository, testSync } = await setup();
      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const album = mediumFactory.albumInsert({ ownerId: user2.id });
      await albumRepo.create(album, [], []);
      await albumUserRepo.create({ usersId: auth.user.id, albumsId: album.id, role: AlbumUserRole.EDITOR });

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);
    });

    it('should detect and sync an album share (share after sync)', async () => {
      const { auth, getRepository, sut, testSync } = await setup();
      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const userAlbum = mediumFactory.albumInsert({ ownerId: auth.user.id });
      const user2Album = mediumFactory.albumInsert({ ownerId: user2.id });
      await Promise.all([albumRepo.create(user2Album, [], []), albumRepo.create(userAlbum, [], [])]);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumsV1]);

      expect(initialSyncResponse).toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: userAlbum.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      await albumUserRepo.create({ usersId: auth.user.id, albumsId: user2Album.id, role: AlbumUserRole.EDITOR });

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: user2Album.id }),
          type: SyncEntityType.AlbumV1,
        },
      ]);
    });

    it('should detect and sync an album delete`', async () => {
      const { auth, getRepository, testSync, sut } = await setup();
      const albumRepo = getRepository('album');
      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const album = mediumFactory.albumInsert({ ownerId: user2.id });
      await albumRepo.create(album, [], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumsV1]);
      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);

      await albumRepo.delete(album.id);

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
      ]);
    });

    it('should detect and sync an album unshare as an album delete', async () => {
      const { auth, getRepository, testSync, sut } = await setup();
      const albumRepo = getRepository('album');
      const albumUserRepo = getRepository('albumUser');
      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const album = mediumFactory.albumInsert({ ownerId: user2.id });
      await albumRepo.create(album, [], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumsV1]);
      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([]);

      await albumUserRepo.delete({ albumsId: album.id, usersId: auth.user.id });

      await expect(testSync(auth, [SyncRequestType.AlbumsV1])).resolves.toEqual([
        {
          ack: expect.any(String),
          data: { albumId: album.id },
          type: SyncEntityType.AlbumDeleteV1,
        },
      ]);
    });
  });
});
