import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { SessionRepository } from 'src/repositories/session.repository';
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

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV1]);
  });

  it('should detect a pending sync reset', async () => {
    const { auth, ctx } = await setup();

    await ctx.get(SessionRepository).update(auth.session!.id, {
      isPendingSyncReset: true,
    });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    expect(response).toEqual([{ type: SyncEntityType.SyncResetV1, data: {}, ack: 'SyncResetV1|reset' }]);
  });

  it('should not send other dtos when a reset is pending', async () => {
    const { auth, user, ctx } = await setup();

    await ctx.newAsset({ ownerId: user.id });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.get(SessionRepository).update(auth.session!.id, {
      isPendingSyncReset: true,
    });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1])).resolves.toEqual([
      { type: SyncEntityType.SyncResetV1, data: {}, ack: 'SyncResetV1|reset' },
    ]);
  });

  it('should allow resetting a pending reset when requesting changes ', async () => {
    const { auth, user, ctx } = await setup();

    await ctx.newAsset({ ownerId: user.id });

    await ctx.get(SessionRepository).update(auth.session!.id, {
      isPendingSyncReset: true,
    });

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetsV1], true)).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should reset the sync progress', async () => {
    const { auth, user, ctx } = await setup();

    await ctx.newAsset({ ownerId: user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    await ctx.syncAckAll(auth, response);

    await ctx.get(SessionRepository).update(auth.session!.id, {
      isPendingSyncReset: true,
    });

    const resetResponse = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);

    await ctx.syncAckAll(auth, resetResponse);

    const postResetResponse = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    expect(postResetResponse).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
