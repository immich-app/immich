import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { StackRepository } from 'src/repositories/stack.repository';
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

describe(SyncRequestType.PartnerStacksV1, () => {
  it('should detect and sync the first partner stack', async () => {
    const { auth, user, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { stack } = await ctx.newStack({ ownerId: user2.id }, [asset.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: stack.id,
          ownerId: stack.ownerId,
          createdAt: (stack.createdAt as Date).toISOString(),
          updatedAt: (stack.updatedAt as Date).toISOString(),
          primaryAssetId: stack.primaryAssetId,
        },
        type: SyncEntityType.PartnerStackV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should detect and sync a deleted partner stack', async () => {
    const { auth, user, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { stack } = await ctx.newStack({ ownerId: user2.id }, [asset.id]);
    await stackRepo.delete(stack.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(response).toEqual([
      {
        ack: expect.stringContaining('PartnerStackDeleteV1'),
        data: {
          stackId: stack.id,
        },
        type: SyncEntityType.PartnerStackDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should not sync a deleted partner stack due to a user delete', async () => {
    const { auth, user, ctx } = await setup();
    const userRepo = ctx.get(UserRepository);
    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newStack({ ownerId: user2.id }, [asset.id]);
    await userRepo.delete({ id: user2.id }, true);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should not sync a deleted partner stack due to a partner delete (unshare)', async () => {
    const { auth, user, ctx } = await setup();
    const partnerRepo = ctx.get(PartnerRepository);
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    await ctx.newStack({ ownerId: user2.id }, [asset.id]);
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user.id });
    await expect(ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.PartnerStackV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await partnerRepo.remove(partner);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should not sync a stack or stack delete for own user', async () => {
    const { auth, user, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { stack } = await ctx.newStack({ ownerId: user.id }, [asset.id]);
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: user.id });
    await expect(ctx.syncStream(auth, [SyncRequestType.StacksV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.StackV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
    await stackRepo.delete(stack.id);
    await expect(ctx.syncStream(auth, [SyncRequestType.StacksV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.StackDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should not sync a stack or stack delete for unrelated user', async () => {
    const { auth, ctx } = await setup();
    const stackRepo = ctx.get(StackRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { stack } = await ctx.newStack({ ownerId: user2.id }, [asset.id]);
    const auth2 = factory.auth({ session, user: user2 });

    await expect(ctx.syncStream(auth2, [SyncRequestType.StacksV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.StackV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);

    await stackRepo.delete(stack.id);

    await expect(ctx.syncStream(auth2, [SyncRequestType.StacksV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.StackDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should backfill partner stacks when a partner shared their library with you', async () => {
    const { auth, user, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: asset3 } = await ctx.newAsset({ ownerId: user3.id });
    const { stack: stack3 } = await ctx.newStack({ ownerId: user3.id }, [asset3.id]);
    await wait(2);
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
    const { stack: stack2 } = await ctx.newStack({ ownerId: user2.id }, [asset2.id]);
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(response).toEqual([
      {
        ack: expect.stringContaining('PartnerStackV1'),
        data: expect.objectContaining({
          id: stack2.id,
        }),
        type: SyncEntityType.PartnerStackV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);
    await ctx.newPartner({ sharedById: user3.id, sharedWithId: user.id });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.stringContaining(SyncEntityType.PartnerStackBackfillV1),
        data: expect.objectContaining({
          id: stack3.id,
        }),
        type: SyncEntityType.PartnerStackBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerStackBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });

  it('should only backfill partner stacks created prior to the current partner stack checkpoint', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { asset: asset3 } = await ctx.newAsset({ ownerId: user3.id });
    const { stack: stack3 } = await ctx.newStack({ ownerId: user3.id }, [asset3.id]);
    await wait(2);
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
    const { stack: stack2 } = await ctx.newStack({ ownerId: user2.id }, [asset2.id]);
    await wait(2);
    const { asset: asset4 } = await ctx.newAsset({ ownerId: user3.id });
    const { stack: stack4 } = await ctx.newStack({ ownerId: user3.id }, [asset4.id]);
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(response).toEqual([
      {
        ack: expect.stringContaining(SyncEntityType.PartnerStackV1),
        data: expect.objectContaining({
          id: stack2.id,
        }),
        type: SyncEntityType.PartnerStackV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);

    await ctx.newPartner({ sharedById: user3.id, sharedWithId: auth.user.id });
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnerStacksV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: stack3.id,
        }),
        type: SyncEntityType.PartnerStackBackfillV1,
      },
      {
        ack: expect.stringContaining(SyncEntityType.PartnerStackBackfillV1),
        data: {},
        type: SyncEntityType.SyncAckV1,
      },
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: stack4.id,
        }),
        type: SyncEntityType.PartnerStackV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnerStacksV1]);
  });
});
