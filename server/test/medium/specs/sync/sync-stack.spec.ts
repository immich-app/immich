import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { StackRepository } from 'src/repositories/stack.repository';
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

describe(SyncEntityType.StackV1, () => {
  it('should detect and sync the first stack', async () => {
    const { auth, user, ctx } = await setup();
    const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
    const { stack } = await ctx.newStack({ ownerId: user.id }, [asset1.id, asset2.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.StacksV1]);
    expect(response).toEqual([
      {
        ack: expect.stringContaining('StackV1'),
        data: {
          id: stack.id,
          createdAt: (stack.createdAt as Date).toISOString(),
          updatedAt: (stack.updatedAt as Date).toISOString(),
          primaryAssetId: stack.primaryAssetId,
          ownerId: stack.ownerId,
        },
        type: 'StackV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.StacksV1]);
  });

  it('should detect and sync a deleted stack', async () => {
    const { auth, user, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
    const { stack } = await ctx.newStack({ ownerId: user.id }, [asset1.id, asset2.id]);
    await stackRepo.delete(stack.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.StacksV1]);
    expect(response).toEqual([
      {
        ack: expect.stringContaining('StackDeleteV1'),
        data: { stackId: stack.id },
        type: 'StackDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.StacksV1]);
  });

  it('should sync a stack and then an update to that same stack', async () => {
    const { auth, user, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
    const { stack } = await ctx.newStack({ ownerId: user.id }, [asset1.id, asset2.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.StacksV1]);
    expect(response).toEqual([
      expect.objectContaining({ type: SyncEntityType.StackV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);

    await stackRepo.update(stack.id, { primaryAssetId: asset2.id });
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.StacksV1]);
    expect(newResponse).toEqual([
      expect.objectContaining({ type: SyncEntityType.StackV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    expect(newResponse).toEqual([
      {
        ack: expect.stringContaining('StackV1'),
        data: expect.objectContaining({ id: stack.id, primaryAssetId: asset2.id }),
        type: 'StackV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.StacksV1]);
  });

  it('should not sync a stack or stack delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { user: user2 } = await ctx.newUser();
    const { asset: asset1 } = await ctx.newAsset({ ownerId: user2.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
    const { stack } = await ctx.newStack({ ownerId: user2.id }, [asset1.id, asset2.id]);

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.StacksV1]);
    await stackRepo.delete(stack.id);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.StacksV1]);
  });
});
