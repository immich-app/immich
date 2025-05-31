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

describe.concurrent(SyncRequestType.PartnerAssetsV1, () => {
  it('should detect and sync the first partner asset', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const originalFileName = 'firstPartnerAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({
      ownerId: user2.id,
      originalFileName,
      checksum: Buffer.from(checksum, 'base64'),
      thumbhash: Buffer.from(thumbhash, 'base64'),
      fileCreatedAt: date,
      fileModifiedAt: date,
      localDateTime: date,
      deletedAt: null,
    });
    await assetRepo.create(asset);

    const partnerRepo = getRepository('partner');
    await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

    const initialSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            id: asset.id,
            ownerId: asset.ownerId,
            originalFileName,
            thumbhash,
            checksum,
            deletedAt: null,
            fileCreatedAt: date,
            fileModifiedAt: date,
            isFavorite: false,
            localDateTime: date,
            type: asset.type,
            visibility: asset.visibility,
          },
          type: SyncEntityType.PartnerAssetV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

    expect(ackSyncResponse).toHaveLength(0);
  });

  it('should detect and sync a deleted partner asset', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });

    const assetRepo = getRepository('asset');
    await assetRepo.create(asset);

    const partnerRepo = getRepository('partner');
    await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });
    await assetRepo.remove(asset);

    const response = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

    expect(response).toHaveLength(1);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            assetId: asset.id,
          },
          type: SyncEntityType.PartnerAssetDeleteV1,
        },
      ]),
    );

    const acks = response.map(({ ack }) => ack);
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

    expect(ackSyncResponse).toHaveLength(0);
  });

  it('should not sync a deleted partner asset due to a user delete', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const partnerRepo = getRepository('partner');
    await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

    const assetRepo = getRepository('asset');
    await assetRepo.create(mediumFactory.assetInsert({ ownerId: user2.id }));

    await userRepo.delete({ id: user2.id }, true);

    const response = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(response).toHaveLength(0);
  });

  it('should not sync a deleted partner asset due to a partner delete (unshare)', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const assetRepo = getRepository('asset');
    await assetRepo.create(mediumFactory.assetInsert({ ownerId: user2.id }));

    const partnerRepo = getRepository('partner');
    const partner = { sharedById: user2.id, sharedWithId: auth.user.id };
    await partnerRepo.create(partner);

    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(1);

    await partnerRepo.remove(partner);

    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
  });

  it('should not sync an asset or asset delete for own user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);

    const partnerRepo = getRepository('partner');
    await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

    await expect(testSync(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);

    await assetRepo.remove(asset);

    await expect(testSync(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
  });

  it('should not sync an asset or asset delete for unrelated user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const sessionRepo = getRepository('session');
    const session = mediumFactory.sessionInsert({ userId: user2.id });
    await sessionRepo.create(session);

    const auth2 = factory.auth({ session, user: user2 });

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);

    await expect(testSync(auth2, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);

    await assetRepo.remove(asset);

    await expect(testSync(auth2, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
  });
});
