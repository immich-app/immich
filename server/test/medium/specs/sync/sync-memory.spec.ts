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

describe(SyncEntityType.MemoryV1, () => {
  it('should detect and sync the first memory with the right properties', async () => {
    const { auth, user: user1, ctx } = await setup();
    const { memory } = await ctx.newMemory({ ownerId: user1.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.MemoriesV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: memory.id,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: memory.deletedAt,
          type: memory.type,
          data: memory.data,
          hideAt: memory.hideAt,
          showAt: memory.showAt,
          seenAt: memory.seenAt,
          memoryAt: expect.any(String),
          isSaved: memory.isSaved,
          ownerId: memory.ownerId,
        },
        type: 'MemoryV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoriesV1]);
  });

  it('should detect and sync a deleted memory', async () => {
    const { auth, user, ctx } = await setup();
    const memoryRepo = ctx.get(MemoryRepository);
    const { memory } = await ctx.newMemory({ ownerId: user.id });
    await memoryRepo.delete(memory.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.MemoriesV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          memoryId: memory.id,
        },
        type: 'MemoryDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoriesV1]);
  });

  it('should sync a memory and then an update to that same memory', async () => {
    const { auth, user, ctx } = await setup();
    const memoryRepo = ctx.get(MemoryRepository);
    const { memory } = await ctx.newMemory({ ownerId: user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.MemoriesV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: memory.id }),
        type: 'MemoryV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await memoryRepo.update(memory.id, { seenAt: new Date() });
    const newResponse = await ctx.syncStream(auth, [SyncRequestType.MemoriesV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: memory.id }),
        type: 'MemoryV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoriesV1]);
  });

  it('should not sync a memory or a memory delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const memoryRepo = ctx.get(MemoryRepository);
    const { user: user2 } = await ctx.newUser();
    const { memory } = await ctx.newMemory({ ownerId: user2.id });

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoriesV1]);
    await memoryRepo.delete(memory.id);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.MemoriesV1]);
  });
});
