import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { MemoryRepository } from 'src/repositories/memory.repository';
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

describe(SyncEntityType.MemoryToAssetV1, () => {
  it('should detect and sync a memory to asset relation', async () => {
    const { auth, user, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { memory } = await ctx.newMemory({ ownerId: user.id });
    await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.MemoryToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          memoryId: memory.id,
          assetId: asset.id,
        },
        type: 'MemoryToAssetV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoryToAssetsV1]);
  });

  it('should detect and sync a deleted memory to asset relation', async () => {
    const { auth, user, ctx } = await setup();
    const memoryRepo = ctx.get(MemoryRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { memory } = await ctx.newMemory({ ownerId: user.id });
    await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });
    await memoryRepo.removeAssetIds(memory.id, [asset.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.MemoryToAssetsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
          memoryId: memory.id,
        },
        type: 'MemoryToAssetDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoryToAssetsV1]);
  });

  it('should not sync a memory to asset relation or delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const memoryRepo = ctx.get(MemoryRepository);
    const { auth: auth2, user: user2 } = await ctx.newSyncAuthUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { memory } = await ctx.newMemory({ ownerId: user2.id });
    await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });

    expect(await ctx.syncStream(auth2, [SyncRequestType.MemoryToAssetsV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.MemoryToAssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoryToAssetsV1]);

    await memoryRepo.removeAssetIds(memory.id, [asset.id]);

    expect(await ctx.syncStream(auth2, [SyncRequestType.MemoryToAssetsV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.MemoryToAssetDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoryToAssetsV1]);
  });
});
