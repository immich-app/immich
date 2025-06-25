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

describe.concurrent(SyncRequestType.AlbumAssetExifsV1, () => {
  it('should detect and sync the first album asset exif', async () => {
    const { auth, sut, getRepository, testSync } = await setup();

    const userRepo = getRepository('user');
    const user2 = mediumFactory.userInsert();
    await userRepo.create(user2);

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: user2.id });
    await assetRepo.create(asset);
    await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });
    await albumRepo.create({ ownerId: user2.id }, [asset.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const initialSyncResponse = await testSync(auth, [SyncRequestType.AlbumAssetExifsV1]);

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
          type: SyncEntityType.AlbumAssetExifV1,
        },
      ]),
    );

    const acks = [initialSyncResponse[0].ack];
    await sut.setAcks(auth, { acks });

    const ackSyncResponse = await testSync(auth, [SyncRequestType.AlbumAssetExifsV1]);

    expect(ackSyncResponse).toEqual([]);
  });

  it('should sync album asset exif for own user', async () => {
    const { auth, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');
    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);
    await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });
    await albumRepo.create({ ownerId: auth.user.id }, [asset.id], []);

    await expect(testSync(auth, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.AlbumAssetExifsV1])).resolves.toHaveLength(1);
  });

  it('should not sync album asset exif for unrelated user', async () => {
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
    await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });
    await albumRepo.create({ ownerId: user2.id }, [asset.id], [{ userId: user3.id, role: AlbumUserRole.EDITOR }]);

    const sessionRepo = getRepository('session');
    const session = mediumFactory.sessionInsert({ userId: user3.id });
    await sessionRepo.create(session);

    const authUser3 = factory.auth({ session, user: user3 });

    await expect(testSync(authUser3, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
    await expect(testSync(auth, [SyncRequestType.PartnerAssetExifsV1])).resolves.toHaveLength(0);
  });

  it('should backfill album assets exif when a user shares an album with you', async () => {
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
    await assetRepo.upsertExif({ assetId: asset1Owner.id, make: 'asset1Owner' });
    await wait(2);
    await assetRepo.create(asset1User2);
    await assetRepo.upsertExif({ assetId: asset1User2.id, make: 'asset1User2' });
    await wait(2);
    await assetRepo.create(asset2User2);
    await assetRepo.upsertExif({ assetId: asset2User2.id, make: 'asset2User2' });
    await wait(2);
    await assetRepo.create(asset3User2);
    await assetRepo.upsertExif({ assetId: asset3User2.id, make: 'asset3User2' });

    const albumRepo = getRepository('album');
    const album1 = mediumFactory.albumInsert({ ownerId: user2.id });
    await albumRepo.create(album1, [asset2User2.id], [{ userId: auth.user.id, role: AlbumUserRole.EDITOR }]);

    const response = await testSync(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifV1,
      },
    ]);

    // ack initial album asset exif sync
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
    const backfillResponse = await testSync(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(backfillResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset1Owner.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset1User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.AlbumAssetExifBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset3User2.id,
        }),
        type: SyncEntityType.AlbumAssetExifV1,
      },
    ]);

    await sut.setAcks(auth, { acks: [backfillResponse[3].ack, backfillResponse.at(-1).ack] });

    const finalResponse = await testSync(auth, [SyncRequestType.AlbumAssetExifsV1]);
    expect(finalResponse).toEqual([]);
  });
});
