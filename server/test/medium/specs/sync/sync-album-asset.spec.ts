import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AlbumUserRole, SyncEntityType, SyncRequestType } from 'src/enum';
import { mediumFactory, newSyncAuthUser, newSyncTest } from 'test/medium.factory';
import { factory } from 'test/small.factory';
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

describe.concurrent(SyncRequestType.AlbumAssetsV1, () => {
  it('should detect and sync the first album asset', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const originalFileName = 'firstAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({
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
    await assetRepo.create(asset);
    await albumRepo.create({ ownerId: user2.id }, [asset.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
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
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumAssetsV1]);

    expect(ackSyncResponse).toEqual([]);
  });

  it('should sync album asset for own user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    await albumRepo.create({ ownerId: auth.user.id }, [asset.id], []);

    await expect(testSync(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toHaveLength(1);
  });

  it('should not sync album asset for unrelated user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    const user3 = mediumFactory.userInsert();
    await userRepo.create(user2);
    await userRepo.create(user3);

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user3.id });
    await assetRepo.create(asset);
    await albumRepo.create({ ownerId: user2.id }, [asset.id], [{ userId: user3.id, role: AlbumUserRole.EDITOR }]);

    const sessionRepo = getRepository('session');
    const session = mediumFactory.sessionInsert({ userId: user3.id });
    await sessionRepo.create(session);

    const authUser3 = factory.auth({ session, user: user3 });

    await expect(testSync(authUser3, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
  });

  it('should backfill album assets when a user shares an album with you', async () => {
    const { auth, sut, testSync, getRepository } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    const user3 = mediumFactory.userInsert();
    await userRepo.create(user2);
    await userRepo.create(user3);

    const assetRepo = getRepository('asset');
    // Asset to check that we do backfill our own assets
    const asset1Owner = mediumFactory.assetInsert({ ownerId: auth.user.id });
    const asset1User2 = mediumFactory.assetInsert({ ownerId: user2.id });
    const asset2User2 = mediumFactory.assetInsert({ ownerId: user2.id });
    const asset3User2 = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset1Owner);
    await wait(2);
    await assetRepo.create(asset1User2);
    await wait(2);
    await assetRepo.create(asset2User2);
    await wait(2);
    await assetRepo.create(asset3User2);

    const albumRepo = getRepository('album');
    const album1 = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(album1, [asset2User2.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const response = await testSync(auth, [SyncRequestType.AlbumAssetsV1]);
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
    const acks = response.map(({ ack }) => ack);
    await sut.setAcks(auth, { acks });

    // create a second album with
    const album2 = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(
      album2,
      [asset1User2.id, asset2User2.id, asset3User2.id, asset1Owner.id],
      [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }],
    );

    // should backfill the album user
    const backfillResponse = await testSync(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(backfillResponse).toEqual([
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

    await sut.setAcks(auth, { acks: [backfillResponse[3].ack, backfillResponse.at(-1).ack] });

    const finalResponse = await testSync(auth, [SyncRequestType.AlbumAssetsV1]);
    expect(finalResponse).toEqual([]);
  });
});
