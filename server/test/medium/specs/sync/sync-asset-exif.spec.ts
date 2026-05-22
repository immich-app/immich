import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.AssetExifsV1, () => {
  it('should detect and sync the first asset exif', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetExifsV1]);
    expect(response).toEqual([
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
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetExifsV1]);
  });

  it('should only sync asset exif for own user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { session } = await ctx.newSession({ userId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetExifV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetExifsV1]);
  });
});
