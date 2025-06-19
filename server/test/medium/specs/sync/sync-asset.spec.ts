import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { mediumFactory, newSyncAuthUser, newSyncTest } from 'test/medium.factory';
import { factory } from 'test/small.factory';
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

describe.concurrent(SyncEntityType.AssetV1, () => {
  it('should detect and sync the first asset', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const originalFileName = 'firstAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({
      originalFileName,
      ownerId: auth.user.id,
      checksum: Buffer.from(checksum, 'base64'),
      thumbhash: Buffer.from(thumbhash, 'base64'),
      fileCreatedAt: date,
      fileModifiedAt: date,
      localDateTime: date,
      deletedAt: null,
      duration: '0:10:00.00000',
    });
    await assetRepo.create(asset);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

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
          type: 'AssetV1',
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

    expect(ackSyncResponse).toHaveLength(0);
  });

  it('should detect and sync a deleted asset', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    await assetRepo.remove(asset);

    const response = await testSync(auth, [SyncRequestType.AssetsV1]);

    expect(response).toHaveLength(1);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            assetId: asset.id,
          },
          type: 'AssetDeleteV1',
        },
      ]),
    );

    const acks = response.map(({ ack }) => ack);
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

    expect(ackSyncResponse).toHaveLength(0);
  });

  it('should not sync an asset or asset delete for an unrelated user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const sessionRepo = getRepository('session');
    const session = mediumFactory.sessionInsert({ userId: user2.id });
    await sessionRepo.create(session);

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);

    const auth2 = factory.auth({ session, user: user2 });

    expect(await testSync(auth2, [SyncRequestType.AssetsV1])).toHaveLength(1);
    expect(await testSync(auth, [SyncRequestType.AssetsV1])).toHaveLength(0);

    await assetRepo.remove(asset);
    expect(await testSync(auth2, [SyncRequestType.AssetsV1])).toHaveLength(1);
    expect(await testSync(auth, [SyncRequestType.AssetsV1])).toHaveLength(0);
  });
});
