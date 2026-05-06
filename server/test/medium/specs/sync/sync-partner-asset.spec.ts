import { Kysely } from 'kysely';
import { AssetMetadataKey, AssetType, SyncEntityType, SyncRequestType } from 'src/enum';
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

const nsfwMetadata = (isNsfw: boolean) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: 0.99, labels: { explicit: 0.99 } },
  },
});

describe(SyncRequestType.PartnerAssetsV2, () => {
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
      duration: 600_000,
      libraryId: null,
    });

    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
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
          isEdited: asset.isEdited,
          stackId: null,
          livePhotoVideoId: null,
          libraryId: asset.libraryId,
          width: null,
          height: null,
        },
        type: SyncEntityType.PartnerAssetV2,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should detect and sync a deleted partner asset', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await assetRepo.remove(asset);

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
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
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should not sync a deleted partner asset due to a user delete', async () => {
    const { auth, ctx } = await setup();
    const userRepo = ctx.get(UserRepository);

    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await ctx.newAsset({ ownerId: user2.id });
    await userRepo.delete({ id: user2.id }, true);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should not sync a deleted partner asset due to a partner delete (unshare)', async () => {
    const { auth, ctx } = await setup();
    const partnerRepo = ctx.get(PartnerRepository);

    const { user: user2 } = await ctx.newUser();
    await ctx.newAsset({ ownerId: user2.id });
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await expect(ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.PartnerAssetV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await partnerRepo.remove(partner);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should not sync an asset or asset delete for own user', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV2])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);

    await assetRepo.remove(asset);

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV2])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should not sync an asset or asset delete for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);

    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetsV2])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);

    await assetRepo.remove(asset);

    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetsV2])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });

  it('should hide NSFW Live Photo motion IDs from non-elevated partner asset sync', async () => {
    const { auth, ctx } = await setup();
    const { user: partner } = await ctx.newUser();
    const { asset: safeMotion } = await ctx.newAsset({ ownerId: partner.id, type: AssetType.Video });
    const { asset: nsfwMotion } = await ctx.newAsset({ ownerId: partner.id, type: AssetType.Video });
    const { asset: safePhoto } = await ctx.newAsset({ ownerId: partner.id, livePhotoVideoId: safeMotion.id });
    const { asset: nsfwMotionPhoto } = await ctx.newAsset({ ownerId: partner.id, livePhotoVideoId: nsfwMotion.id });
    await ctx.newPartner({ sharedById: partner.id, sharedWithId: auth.user.id });
    await ctx.newMetadata({
      assetId: nsfwMotion.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });

    const hiddenResponse = await ctx.syncStream({ ...auth, hideNsfwAssets: true }, [SyncRequestType.PartnerAssetsV2]);
    const hiddenAssets = hiddenResponse
      .filter(({ type }) => type === SyncEntityType.PartnerAssetV2)
      .map(({ data }) => data);

    expect(hiddenAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: safePhoto.id, livePhotoVideoId: safeMotion.id }),
        expect.objectContaining({ id: nsfwMotionPhoto.id, livePhotoVideoId: null }),
      ]),
    );
    expect(hiddenAssets.map(({ id }) => id)).not.toContain(nsfwMotion.id);

    const elevatedResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
    expect(elevatedResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ id: nsfwMotionPhoto.id, livePhotoVideoId: nsfwMotion.id }),
          type: SyncEntityType.PartnerAssetV2,
        }),
      ]),
    );
  });

  it('should backfill partner assets when a partner shared their library with you', async () => {
    const { auth, ctx } = await setup();

    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: assetUser3 } = await ctx.newAsset({ ownerId: user3.id });
    await wait(2);
    const { asset: assetUser2 } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetV2,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetBackfillV2,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetBackfillV2),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
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

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser2.id,
        }),
        type: SyncEntityType.PartnerAssetV2,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);

    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerAssetsV2]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetUser3.id,
        }),
        type: SyncEntityType.PartnerAssetBackfillV2,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerAssetBackfillV2),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: asset2User3.id,
        }),
        type: SyncEntityType.PartnerAssetV2,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerAssetsV2]);
  });
});
