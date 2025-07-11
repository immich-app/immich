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

describe(SyncEntityType.SyncResetV1, () => {
  it('should work', async () => {
    const { auth, ctx } = await setup();

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    expect(response).toEqual([]);
  });

  it('should detect a pending sync reset', async () => {
    const { auth, ctx } = await setup();

    auth.session!.isPendingSyncReset = true;

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    expect(response).toEqual([{ type: SyncEntityType.SyncResetV1, data: {} }]);
  });

  it('should not send other dtos when a reset is pending', async () => {
    const { auth, user, ctx } = await setup();

    await ctx.newAsset({ ownerId: user.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);

    auth.session!.isPendingSyncReset = true;

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      { type: SyncEntityType.SyncResetV1, data: {} },
    ]);
  });

  it('should allow resetting a pending reset when requesting changes ', async () => {
    const { auth, user, ctx } = await setup();

    await ctx.newAsset({ ownerId: user.id });

    auth.session!.isPendingSyncReset = true;

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1], true)).resolves.toEqual([
      expect.objectContaining({
        type: SyncEntityType.AssetV1,
      }),
    ]);
  });
});
