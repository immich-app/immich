import { Kysely } from 'kysely';
import { AssetMetadataKey, SyncEntityType, SyncRequestType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
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

describe(SyncEntityType.AssetMetadataV1, () => {
  it('should detect and sync new asset metadata', async () => {
    const { auth, user, ctx } = await setup();

    const assetRepo = ctx.get(AssetRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await assetRepo.upsertMetadata(asset.id, [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: 'abc123' } }]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetMetadataV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          key: AssetMetadataKey.MobileApp,
          assetId: asset.id,
          value: { iCloudId: 'abc123' },
        },
        type: 'AssetMetadataV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetMetadataV1]);
  });

  it('should update asset metadata', async () => {
    const { auth, user, ctx } = await setup();

    const assetRepo = ctx.get(AssetRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await assetRepo.upsertMetadata(asset.id, [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: 'abc123' } }]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetMetadataV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          key: AssetMetadataKey.MobileApp,
          assetId: asset.id,
          value: { iCloudId: 'abc123' },
        },
        type: 'AssetMetadataV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await assetRepo.upsertMetadata(asset.id, [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: 'abc456' } }]);

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetMetadataV1]);
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          key: AssetMetadataKey.MobileApp,
          assetId: asset.id,
          value: { iCloudId: 'abc456' },
        },
        type: 'AssetMetadataV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetMetadataV1]);
  });
});

describe(SyncEntityType.AssetMetadataDeleteV1, () => {
  it('should delete and sync asset metadata', async () => {
    const { auth, user, ctx } = await setup();

    const assetRepo = ctx.get(AssetRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await assetRepo.upsertMetadata(asset.id, [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: 'abc123' } }]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetMetadataV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          key: AssetMetadataKey.MobileApp,
          assetId: asset.id,
          value: { iCloudId: 'abc123' },
        },
        type: 'AssetMetadataV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await assetRepo.deleteMetadataByKey(asset.id, AssetMetadataKey.MobileApp);

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetMetadataV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
          key: AssetMetadataKey.MobileApp,
        },
        type: 'AssetMetadataDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
