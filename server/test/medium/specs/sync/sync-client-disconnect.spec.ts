import { Writable } from 'node:stream';
import { SyncEntityType, SyncRequestType } from 'src/enum.js';
import { SyncTestContext } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

const ASSET_COUNT = 100;

const setup = async () => {
  const db = await getKyselyDB();
  const ctx = new SyncTestContext(db);
  const { auth, user, session } = await ctx.newSyncAuthUser();

  for (let i = 0; i < ASSET_COUNT; i++) {
    await ctx.newAsset({ ownerId: auth.user.id });
  }

  return { auth, user, session, ctx };
};

// automatically destroy the stream after X lines are written
class LineAutoClosingStream extends Writable {
  private count: number;
  lines: string[] = [];

  constructor({ after }: { after: number }) {
    super({ highWaterMark: 1 });
    this.count = after;
  }

  // eslint-disable-next-line unicorn/prefer-private-class-fields
  _write(chunk: any, _encoding: string, callback: () => void) {
    this.lines.push(chunk.toString());

    if (this.lines.length >= this.count) {
      this.destroy();
      return;
    }

    setImmediate(callback);
  }
}

describe('client disconnect', () => {
  it('should stop streaming when the client disconnects mid-stream', async () => {
    const { auth, ctx } = await setup();

    const stream = new LineAutoClosingStream({ after: 5 });

    await expect(ctx.sut.stream(auth, stream, { types: [SyncRequestType.AssetsV2] })).resolves.toBeUndefined();

    expect(stream.lines).toHaveLength(5);
    expect(stream.lines.length).toBeLessThan(ASSET_COUNT);
  });

  it('should release the database connection when the client disconnects', async () => {
    const { auth, ctx } = await setup();

    // more than the pool size
    for (let i = 0; i < 12; i++) {
      const stream = new LineAutoClosingStream({ after: 5 });
      await ctx.sut.stream(auth, stream, { types: [SyncRequestType.AssetsV2] });
    }

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(response).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 })]),
    );
  });
});
