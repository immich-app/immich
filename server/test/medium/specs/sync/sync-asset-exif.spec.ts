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

describe.concurrent(SyncRequestType.AssetExifsV1, () => {
  it('should detect and sync the first asset exif', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AssetExifsV1]);

    expect(initialSyncResponse).toHaveLength(1);
    expect(initialSyncResponse).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            assetId: asset.id,
            city: null,
            country: null,
            dateTimeOriginal: null,
            description: '',
            exifImageHeight: null,
            exifImageWidth: null,
            exposureTime: null,
            fNumber: null,
            fileSizeInByte: null,
            focalLength: null,
            fps: null,
            iso: null,
            latitude: null,
            lensModel: null,
            longitude: null,
            make: 'Canon',
            model: null,
            modifyDate: null,
            orientation: null,
            profileDescription: null,
            projectionType: null,
            rating: null,
            state: null,
            timeZone: null,
          },
          type: SyncEntityType.AssetExifV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetExifsV1]);

    expect(ackSyncResponse).toHaveLength(0);
  });

  it('should only sync asset exif for own user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const partnerRepo = getRepository('partner');
    await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);
    await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

    const sessionRepo = getRepository('session');
    const session = mediumFactory.sessionInsert({ userId: user2.id });
    await sessionRepo.create(session);

    const auth2 = factory.auth({ session, user: user2 });
    await expect(testSync(auth2, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(0);
  });
});
