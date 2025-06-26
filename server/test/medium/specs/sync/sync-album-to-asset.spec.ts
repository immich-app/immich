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

describe.concurrent(SyncRequestType.AlbumToAssetsV1, () => {
  it('should detect and sync the first album to asset relation', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(album, [asset.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            albumId: album.id,
            assetId: asset.id,
          },
          type: SyncEntityType.AlbumToAssetV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(ackSyncResponse).toEqual([]);
  });

  it('should sync album to asset for owned albums', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            albumId: album.id,
            assetId: asset.id,
          },
          type: SyncEntityType.AlbumToAssetV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(ackSyncResponse).toEqual([]);
  });

  it('should detect and sync the album to asset for shared albums', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(album, [asset.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            albumId: album.id,
            assetId: asset.id,
          },
          type: SyncEntityType.AlbumToAssetV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(ackSyncResponse).toEqual([]);
  });

  it('should not sync album to asset for an album owned by another user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);
    await albumRepo.create({ ownerId: user2.id }, [asset.id], []);

    await expect(testSync(auth, [SyncRequestType.AlbumToAssetsV1])).resolves.toHaveLength(0);
  });

  it('should backfill album to assets when a user shares an album with you', async () => {
    const { auth, sut, testSync, getRepository } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const assetRepo = getRepository('asset');
    const album1Asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(album1Asset);
    const album2Asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(album2Asset);

    // Backfill album
    const albumRepo = getRepository('album');
    const album2 = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(album2, [album2Asset.id], []);

    await wait(2);

    const album1 = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album1, [album1Asset.id], []);

    const response = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album1.id,
          assetId: album1Asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
    ]);

    // ack initial album to asset sync
    const acks = response.map(({ ack }) => ack);
    await sut.setAcks(auth, { acks });

    // add user to backfill album
    const albumUserRepo = getRepository('albumUser');
    await albumUserRepo.create({ albumsId: album2.id, usersId: auth.user.id, role: AlbumUserRole.EDITOR });

    // should backfill the album to asset relation
    const backfillResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(backfillResponse).toEqual([
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
    ]);

    await sut.setAcks(auth, { acks: [backfillResponse[1].ack] });

    const finalResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(finalResponse).toEqual([]);
  });

  it('should detect and sync a deleted album to asset relation', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
    ]);

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    await albumRepo.removeAssetIds(album.id, [asset.id]);

    await wait(2);

    const syncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(syncResponse).toHaveLength(1);
    expect(syncResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetDeleteV1,
      },
    ]);

    await sut.setAcks(auth, { acks: [syncResponse[0].ack] });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(ackSyncResponse).toEqual([]);
  });

  it('should detect and sync a deleted album to asset relation when an asset is deleted', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
    ]);

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    await assetRepo.remove({ id: asset.id });

    await wait(2);

    const syncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(syncResponse).toHaveLength(1);
    expect(syncResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetDeleteV1,
      },
    ]);

    await sut.setAcks(auth, { acks: [syncResponse[0].ack] });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(ackSyncResponse).toEqual([]);
  });

  it('should not sync a deleted album to asset relation when the album is deleted', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumToAssetV1,
      },
    ]);

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    await albumRepo.delete(album.id);

    await wait(2);

    const syncResponse = await testSync(auth, [SyncRequestType.AlbumToAssetsV1]);
    expect(syncResponse).toHaveLength(0);
    expect(syncResponse).toEqual([]);
  });
});
