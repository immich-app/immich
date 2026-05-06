import { Kysely } from 'kysely';
import { AssetMetadataKey, AssetType, SyncEntityType, SyncRequestType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
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

const nsfwMetadata = (isNsfw: boolean, review?: { action: string; isNsfw: boolean }) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: 0.99, labels: { explicit: 0.99 } },
    ...(review ? { review } : {}),
  },
});

describe(SyncEntityType.AssetV2, () => {
  it('should detect and sync the first asset', async () => {
    const originalFileName = 'firstAsset';
    const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
    const date = new Date().toISOString();

    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({
      originalFileName,
      ownerId: auth.user.id,
      checksum: Buffer.from(checksum, 'base64'),
      thumbhash: Buffer.from(thumbhash, 'base64'),
      fileCreatedAt: date,
      fileModifiedAt: date,
      localDateTime: date,
      deletedAt: null,
      duration: 600_000,
      libraryId: null,
      width: 1920,
      height: 1080,
    });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV2]);
    expect(response).toEqual([
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
          stackId: null,
          livePhotoVideoId: null,
          libraryId: asset.libraryId,
          width: asset.width,
          height: asset.height,
          isEdited: asset.isEdited,
        },
        type: 'AssetV2',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV2]);
  });

  it('should detect and sync a deleted asset', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    await assetRepo.remove(asset);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
        },
        type: 'AssetDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV2]);
  });

  it('should not sync an asset or asset delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const assetRepo = ctx.get(AssetRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetsV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV2]);

    await assetRepo.remove(asset);
    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetsV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV2]);
  });

  it('should hide private NSFW assets from non-elevated sync', async () => {
    const { auth, user, ctx } = await setup();
    const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
    const { asset: nsfw } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });

    await ctx.newMetadata({
      assetId: nsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });
    await ctx.newMetadata({
      assetId: markedSafe.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
    });
    await ctx.newMetadata({
      assetId: markedNsfw.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
    });

    const hiddenResponse = await ctx.syncStream({ ...auth, hideNsfwAssets: true }, [SyncRequestType.AssetsV2]);
    const hiddenAssetIds = hiddenResponse
      .filter(({ type }) => type === SyncEntityType.AssetV2)
      .map(({ data }) => data.id);

    expect(hiddenAssetIds).toEqual(expect.arrayContaining([visible.id, markedSafe.id]));
    expect(hiddenAssetIds).not.toEqual(expect.arrayContaining([nsfw.id, markedNsfw.id]));

    const elevatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetsV2]);
    const elevatedAssetIds = elevatedResponse
      .filter(({ type }) => type === SyncEntityType.AssetV2)
      .map(({ data }) => data.id);

    expect(elevatedAssetIds).toEqual(expect.arrayContaining([visible.id, nsfw.id, markedSafe.id, markedNsfw.id]));
  });

  it('should hide NSFW Live Photo motion IDs from non-elevated sync', async () => {
    const { auth, user, ctx } = await setup();
    const { asset: safeMotion } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
    const { asset: nsfwMotion } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
    const { asset: safePhoto } = await ctx.newAsset({ ownerId: user.id, livePhotoVideoId: safeMotion.id });
    const { asset: nsfwMotionPhoto } = await ctx.newAsset({ ownerId: user.id, livePhotoVideoId: nsfwMotion.id });

    await ctx.newMetadata({
      assetId: nsfwMotion.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });

    const hiddenResponse = await ctx.syncStream({ ...auth, hideNsfwAssets: true }, [SyncRequestType.AssetsV2]);
    const hiddenAssets = hiddenResponse.filter(({ type }) => type === SyncEntityType.AssetV2).map(({ data }) => data);

    expect(hiddenAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: safePhoto.id, livePhotoVideoId: safeMotion.id }),
        expect.objectContaining({ id: nsfwMotionPhoto.id, livePhotoVideoId: null }),
      ]),
    );
    expect(hiddenAssets.map(({ id }) => id)).not.toContain(nsfwMotion.id);

    const elevatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetsV2]);
    expect(elevatedResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ id: nsfwMotionPhoto.id, livePhotoVideoId: nsfwMotion.id }),
          type: SyncEntityType.AssetV2,
        }),
      ]),
    );
  });
});
