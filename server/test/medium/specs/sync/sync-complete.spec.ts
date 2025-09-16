import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { SyncCheckpointRepository } from 'src/repositories/sync-checkpoint.repository';
import { DB } from 'src/schema';
import { toAck } from 'src/utils/sync';
import { SyncTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';
import { v7 } from 'uuid';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.SyncCompleteV1, () => {
  it('should work', async () => {
    const { auth, ctx } = await setup();

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV1]);
  });

  it('should detect an old checkpoint and send back a reset', async () => {
    const { auth, session, ctx } = await setup();
    const updateId = v7({ msecs: DateTime.now().minus({ days: 60 }).toMillis() });

    await ctx.get(SyncCheckpointRepository).upsertAll([
      {
        type: SyncEntityType.SyncCompleteV1,
        sessionId: session.id,
        ack: toAck({ type: SyncEntityType.SyncCompleteV1, updateId }),
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
    expect(response).toEqual([{ type: SyncEntityType.SyncResetV1, data: {}, ack: 'SyncResetV1|reset' }]);
  });

  it('should not send back a reset if the checkpoint is recent', async () => {
    const { auth, session, ctx } = await setup();
    const updateId = v7({ msecs: DateTime.now().minus({ days: 7 }).toMillis() });

    await ctx.get(SyncCheckpointRepository).upsertAll([
      {
        type: SyncEntityType.SyncCompleteV1,
        sessionId: session.id,
        ack: toAck({ type: SyncEntityType.SyncCompleteV1, updateId }),
      },
    ]);

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV1]);
  });
});
