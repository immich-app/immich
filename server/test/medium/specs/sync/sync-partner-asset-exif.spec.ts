import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB, wait } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncRequestType.PartnerAssetExifsV1, () => {
  it('should detect and sync the first partner asset exif', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
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
        type: SyncEntityType.PartnerAssetExifV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });

  it('should not sync partner asset exif for own user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetExifV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });

  it('should not sync partner asset exif for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    const { asset } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: asset.id, make: 'Canon' });
    const { session } = await ctx.newSession({ userId: user3.id });
    const authUser3 = factory.auth({ session, user: user3 });

    await expect(ctx.syncStream(authUser3, [SyncRequestType.AssetExifsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetExifV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });

  it('should backfill partner asset exif when a partner shared their library with you', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: assetUser3.id, make: 'Canon' });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: assetUser2.id, make: 'Canon' });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: expect.objectContaining({
            assetId: assetUser2.id,
          }),
          type: SyncEntityType.PartnerAssetExifV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetExifBackfillV1,
      },
      {
        ack: expect.any(String),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });

  it('should handle partners with users ids lower than a uuidv7', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser({ id: '00d4c0af-7695-4cf2-85e6-415eeaf449cb' });
    const { user: user3 } = await ctx.newUser({ id: '00e4c0af-7695-4cf2-85e6-415eeaf449cb' });
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: assetUser3.id, make: 'assetUser3' });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: assetUser2.id, make: 'assetUser2' });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetExifV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    // This checks that our ack upsert is correct
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.stringMatching(new RegExp(`${SyncEntityType.PartnerAssetExifBackfillV1}\\|.+?\\|.+`)),
        data: expect.objectContaining({
          assetId: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetExifBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetExifBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });

  it('should only backfill partner assets created prior to the current partner asset checkpoint', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: assetUser3.id, make: 'assetUser3' });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newExif({ assetId: assetUser2.id, make: 'assetUser2' });
    await wait(2);
    const { asset: asset2User3 } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newExif({ assetId: asset2User3.id, make: 'asset2User3' });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetExifV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetExifsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.stringMatching(new RegExp(`${SyncEntityType.PartnerAssetExifBackfillV1}\\|.+?\\|.+`)),
        data: expect.objectContaining({
          assetId: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetExifBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetExifBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          assetId: asset2User3.id,
        }),
        type: SyncEntityType.PartnerAssetExifV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetExifsV1]);
  });
});
