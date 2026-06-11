import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { OcrRepository } from 'src/repositories/ocr.repository';
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

describe(SyncEntityType.AssetOcrV1, () => {
  it('should detect and sync new asset OCR', async () => {
    const { auth, user, ctx } = await setup();

    const ocrRepo = ctx.get(OcrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
      ],
      'Hello World',
    );

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetOcrV1]);
  });

  it('should update asset OCR', async () => {
    const { auth, user, ctx } = await setup();

    const ocrRepo = ctx.get(OcrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
      ],
      'Hello World',
    );

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    // Update OCR data (upsert deletes old entries first, then inserts new ones)
    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
          x1: 0.15,
          y1: 0.25,
          x2: 0.85,
          y2: 0.25,
          x3: 0.85,
          y3: 0.75,
          x4: 0.15,
          y4: 0.75,
          boxScore: 0.98,
          textScore: 0.96,
          text: 'Updated Text',
          isVisible: true,
        },
      ],
      'Updated Text',
    );

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    // upsert() deletes old entries first, so we expect both delete and upsert events
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          deletedAt: expect.any(String),
        },
        type: 'AssetOcrDeleteV1',
      },
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.15,
          y1: 0.25,
          x2: 0.85,
          y2: 0.25,
          x3: 0.85,
          y3: 0.75,
          x4: 0.15,
          y4: 0.75,
          boxScore: 0.98,
          textScore: 0.96,
          text: 'Updated Text',
          isVisible: true,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetOcrV1]);
  });

  it('should update asset OCR visibility flag', async () => {
    const { auth, user, ctx } = await setup();

    const ocrRepo = ctx.get(OcrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
      ],
      'Hello World',
    );

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: false,
        },
      ],
      'Hello World',
    );

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          deletedAt: expect.any(String),
        },
        type: 'AssetOcrDeleteV1',
      },
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: false,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetOcrV1]);
  });
});

describe(SyncEntityType.AssetOcrDeleteV1, () => {
  it('should delete and sync asset OCR', async () => {
    const { auth, user, ctx } = await setup();

    const ocrRepo = ctx.get(OcrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ocrRepo.upsert(
      asset.id,
      [
        {
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
      ],
      'Hello World',
    );

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetOcrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
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
          text: 'Hello World',
          isVisible: true,
        },
        type: 'AssetOcrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    // Delete OCR data
    await ocrRepo.upsert(asset.id, [], '');

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetOcrV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
          deletedAt: expect.any(String),
          id: expect.any(String),
        },
        type: 'AssetOcrDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
