import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { UserRepository } from 'src/repositories/user.repository';
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

describe(SyncRequestType.PartnerAssetsV1, () => {
  it('should detect and sync the first partner asset', async () => {
    const { auth, ctx } = await setup();

    const originalFileName = 'firstPartnerAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({
      ownerId: user2.id,
      originalFileName,
      checksum: Buffer.from(checksum, 'base64'),
      thumbhash: Buffer.from(thumbhash, 'base64'),
      fileCreatedAt: date,
      fileModifiedAt: date,
      localDateTime: date,
      deletedAt: null,
      duration: '0:10:00.00000',
      libraryId: null,
    });

    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(response).toEqual([
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
          duration: asset.duration,
          stackId: null,
          livePhotoVideoId: null,
          libraryId: asset.libraryId,
        },
        type: SyncEntityType.PartnerAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should detect and sync a deleted partner asset', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await assetRepo.remove(asset);

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
        },
        type: SyncEntityType.PartnerAssetDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should not sync a deleted partner asset due to a user delete', async () => {
    const { auth, ctx } = await setup();
    const userRepo = ctx.get(UserRepository);

    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await ctx.newAsset({ ownerId: user2.id });
    await userRepo.delete({ id: user2.id }, true);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should not sync a deleted partner asset due to a partner delete (unshare)', async () => {
    const { auth, ctx } = await setup();
    const partnerRepo = ctx.get(PartnerRepository);

    const { user: user2 } = await ctx.newUser();
    await ctx.newAsset({ ownerId: user2.id });
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await expect(ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.PartnerAssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await partnerRepo.remove(partner);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should not sync an asset or asset delete for own user', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);

    await assetRepo.remove(asset);

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should not sync an asset or asset delete for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);

    await assetRepo.remove(asset);

    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should backfill partner assets when a partner shared their library with you', async () => {
    const { auth, ctx } = await setup();

    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });

  it('should only backfill partner assets created prior to the current partner asset checkpoint', async () => {
    const { auth, ctx } = await setup();

    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await wait(2);
    const { asset: asset2User3 } = await ctx.newAsset({ ownerId: user3.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);

    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset2User3.id,
        }),
        type: SyncEntityType.PartnerAssetV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV1]);
  });
});
