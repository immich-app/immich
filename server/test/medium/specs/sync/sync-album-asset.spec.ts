import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { SyncEntityType, SyncRequestType } from 'src/enum';
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

describe(SyncRequestType.AlbumAssetsV1, () => {
  it('should sync an album asset with the correct properties', async () => {
    const { auth, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');

    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);

    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    await expect(testSync(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          albumId: album.id,
          assetId: asset.id,
        }),
        type: SyncEntityType.AlbumAssetV1,
      }
    ]);
  });

  it('should detect and sync an album asset delete', async () => {
    const { auth, getRepository, testSync } = await setup();

    const albumRepo = getRepository('album');
    const assetRepo = getRepository('asset');

    const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
    await assetRepo.create(asset);

    const album = mediumFactory.albumInsert({ ownerId: auth.user.id });
    await albumRepo.create(album, [asset.id], []);

    await expect(testSync(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          albumId: album.id,
          assetId: asset.id,
        }),
        type: SyncEntityType.AlbumAssetV1,
      }
    ]);

    await albumRepo.removeAssetIds(album.id, [asset.id]);
    await expect(testSync(auth, [SyncRequestType.AlbumAssetsV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          assetId: asset.id,
        },
        type: SyncEntityType.AlbumAssetDeleteV1,
      },
    ]);
  });
});
