import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
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

// Reproduction for https://github.com/immich-app/immich/issues/22772
//
// The mobile client inserts every `MemoryToAssetV1` link into `memory_asset_entity`,
// whose FK constraints require both the memory row and the asset row to already exist
// locally. If the server streams a link whose asset was never delivered to that client,
// the insert fails with SqliteException(787). `updateMemoryAssetsV1` rethrows, the
// checkpoint is never advanced, and the entire remote-sync loop permanently jams
// (memories stay empty; People/faces/OCR ordered after it never sync either).
//
// Invariant under test: the server must never stream a memory->asset link for an asset
// it does not also deliver to the same client in the same sync.
//
describe('MemoryToAssetV1 FK ordering (issue #22772)', () => {
  it('should not sync a memory-to-asset link for an asset the client never receives', async () => {
    const { auth, user, ctx } = await setup();

    // A different, non-partnered user owns an asset. `auth` will never receive this
    // asset via AssetsV2 (filtered by ownerId) nor PartnerAssetsV2 (no partnership).
    const { user: otherUser } = await ctx.newSyncAuthUser();
    const { asset: undeliverableAsset } = await ctx.newAsset({ ownerId: otherUser.id });

    // ...but a memory owned by `user` links to it.
    const { memory } = await ctx.newMemory({ ownerId: user.id });
    await ctx.newMemoryAsset({ memoryId: memory.id, assetId: undeliverableAsset.id });

    // Full sync, in the same dependency order the mobile client requests.
    const response = await ctx.syncStream(auth, [
      SyncRequestType.AssetsV2,
      SyncRequestType.MemoriesV1,
      SyncRequestType.MemoryToAssetsV1,
    ]);

    const deliveredAssetIds = new Set(
      response
        .filter((event) => event.type === SyncEntityType.AssetV2)
        .map((event) => (event.data as { id: string }).id),
    );
    const linkedAssetIds = response
      .filter((event) => event.type === SyncEntityType.MemoryToAssetV1)
      .map((event) => (event.data as { assetId: string }).assetId);

    // Every linked asset must have been delivered in the same stream, otherwise the
    // client hits a foreign-key violation inserting into memory_asset_entity.
    for (const assetId of linkedAssetIds) {
      expect(deliveredAssetIds).toContain(assetId);
    }
  });
});
