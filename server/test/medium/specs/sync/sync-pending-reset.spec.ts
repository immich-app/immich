import { Kysely } from 'kysely';
import { Writable } from 'node:stream';
import { SyncEntityType, SyncRequestType } from 'src/enum.js';
import { OcrRepository } from 'src/repositories/ocr.repository.js';
import { DB } from 'src/schema/index.js';
import { SyncTestContext } from 'test/medium.factory.js';
import { getKyselyDB, wait } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const ocrItem = (assetId: string, text: string) => ({
  assetId,
  x1: 0.1,
  y1: 0.2,
  x2: 0.9,
  y2: 0.2,
  x3: 0.9,
  y3: 0.8,
  x4: 0.1,
  y4: 0.8,
  boxScore: 0.95,
  textScore: 0.92,
  text,
  isVisible: true,
});

class FirstLineHoldingStream extends Writable {
  lines: string[] = [];
  firstLine = Promise.withResolvers<void>();
  private heldCallback?: () => void;

  constructor() {
    super({ highWaterMark: 1 });
  }

  release() {
    this.heldCallback?.();
  }

  // eslint-disable-next-line unicorn/prefer-private-class-fields
  _write(chunk: any, _encoding: string, callback: () => void) {
    this.lines.push(chunk.toString());

    if (this.lines.length === 1) {
      this.heldCallback = callback;
      this.firstLine.resolve();
      return;
    }

    setImmediate(callback);
  }
}

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const RESET = {
  type: SyncEntityType.SyncPendingResetV1,
  data: { type: SyncRequestType.AssetOcrV1 },
  ack: 'SyncPendingResetV1|AssetOcrV1',
};

const OPTED_IN = [SyncRequestType.AssetOcrV1, SyncRequestType.PendingResetV1];

const setupSyncedOcr = async (ctx: SyncTestContext) => {
  const { auth, user } = await ctx.newSyncAuthUser();
  const { asset } = await ctx.newAsset({ ownerId: user.id });
  await ctx.get(OcrRepository).upsert(asset.id, [ocrItem(asset.id, 'before')], 'before');
  await ctx.syncAckAll(auth, await ctx.syncStream(auth, OPTED_IN));
  return { auth, asset };
};

describe(SyncEntityType.SyncPendingResetV1, () => {
  it('should send the reset followed by fresh OCR in one stream', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const ocrRepo = ctx.get(OcrRepository);
    const { auth, asset } = await setupSyncedOcr(ctx);
    await ocrRepo.deleteAll();
    await ocrRepo.upsert(asset.id, [ocrItem(asset.id, 'after')], 'after');

    const response = await ctx.syncStream(auth, OPTED_IN);

    expect(response).toEqual([
      RESET,
      {
        type: SyncEntityType.AssetOcrV1,
        data: expect.objectContaining({ assetId: asset.id, text: 'after' }),
        ack: expect.any(String),
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, OPTED_IN);
  });

  it('should not replay acked deletes after the reset', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const ocrRepo = ctx.get(OcrRepository);
    const { auth, asset } = await setupSyncedOcr(ctx);
    await ocrRepo.upsert(asset.id, [ocrItem(asset.id, 'replaced')], 'replaced');
    await ctx.syncAckAll(auth, await ctx.syncStream(auth, OPTED_IN));
    await ocrRepo.deleteAll();

    await expect(ctx.syncStream(auth, OPTED_IN)).resolves.toEqual([
      RESET,
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should keep the reset for a client that did not opt in', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const ocrRepo = ctx.get(OcrRepository);
    const { auth, asset } = await setupSyncedOcr(ctx);
    await ocrRepo.deleteAll();
    await ocrRepo.upsert(asset.id, [ocrItem(asset.id, 'after')], 'after');

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);

    expect(response).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetOcrV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, OPTED_IN)).resolves.toEqual([
      RESET,
      expect.objectContaining({ type: SyncEntityType.AssetOcrV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should not reset a session that never synced OCR', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const { auth } = await ctx.newSyncAuthUser();
    await ctx.syncAckAll(auth, await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1]));
    await ctx.get(OcrRepository).deleteAll();

    await ctx.assertSyncIsComplete(auth, OPTED_IN);
  });

  it('should keep the reset of other sessions when one session acks', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const { auth: auth1 } = await setupSyncedOcr(ctx);
    const { auth: auth2 } = await setupSyncedOcr(ctx);
    await ctx.get(OcrRepository).deleteAll();

    await ctx.syncAckAll(auth1, await ctx.syncStream(auth1, OPTED_IN));

    await ctx.assertSyncIsComplete(auth1, OPTED_IN);
    await expect(ctx.syncStream(auth2, OPTED_IN)).resolves.toEqual([
      RESET,
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should clear the reset on a full sync reset', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const { auth } = await setupSyncedOcr(ctx);
    await ctx.get(OcrRepository).deleteAll();

    await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1], true);

    await ctx.assertSyncIsComplete(auth, OPTED_IN);
  });

  it('should not deadlock when OCR is truncated mid-stream', async () => {
    const ctx = new SyncTestContext(defaultDatabase);
    const ocrRepo = ctx.get(OcrRepository);
    const { auth, asset } = await setupSyncedOcr(ctx);
    await ocrRepo.upsert(asset.id, [ocrItem(asset.id, 'after')], 'after');
    await wait(2);

    const response = new FirstLineHoldingStream();
    const stream = ctx.sut.stream(auth, response, { types: [SyncRequestType.AssetOcrV1] });
    await response.firstLine.promise;
    const truncate = ocrRepo.deleteAll();
    await Promise.race([truncate, wait(500)]);
    response.release();

    await expect(Promise.all([stream, truncate])).resolves.toBeDefined();
  });
});
