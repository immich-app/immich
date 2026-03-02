import { Kysely } from 'kysely';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { factory } from 'test/small.factory';
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

describe(SyncRequestType.AssetEditsV1, () => {
  it('should detect and sync the first asset edit', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          action: AssetEditAction.Crop,
          parameters: { x: 10, y: 20, width: 100, height: 200 },
          sequence: 0,
        },
        type: SyncEntityType.AssetEditV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should detect and sync multiple asset edits for the same asset', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
      {
        action: AssetEditAction.Rotate,
        parameters: { angle: 90 },
      },
      {
        action: AssetEditAction.Mirror,
        parameters: { axis: MirrorAxis.Horizontal },
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset.id,
            action: AssetEditAction.Crop,
            parameters: { x: 10, y: 20, width: 100, height: 200 },
            sequence: 0,
          },
          type: SyncEntityType.AssetEditV1,
        },
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset.id,
            action: AssetEditAction.Rotate,
            parameters: { angle: 90 },
            sequence: 1,
          },
          type: SyncEntityType.AssetEditV1,
        },
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset.id,
            action: AssetEditAction.Mirror,
            parameters: { axis: MirrorAxis.Horizontal },
            sequence: 2,
          },
          type: SyncEntityType.AssetEditV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should detect and sync updated edits', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    // Create initial edit
    const edits = await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    const response1 = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    await ctx.syncAckAll(auth, response1);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);

    // update the existing edit
    await ctx.database
      .updateTable('asset_edit')
      .set({
        parameters: { x: 50, y: 60, width: 150, height: 250 },
      })
      .where('id', '=', edits[0].id)
      .execute();

    const response2 = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    expect(response2).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset.id,
            action: AssetEditAction.Crop,
            parameters: { x: 50, y: 60, width: 150, height: 250 },
            sequence: 0,
          },
          type: SyncEntityType.AssetEditV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response2);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should detect and sync deleted asset edits', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    // Create initial edit
    const edits = await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    const response1 = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    await ctx.syncAckAll(auth, response1);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);

    // Delete all edits
    await assetEditRepo.replaceAll(asset.id, []);

    const response2 = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    expect(response2).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            editId: edits[0].id,
          },
          type: SyncEntityType.AssetEditDeleteV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response2);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should only sync asset edits for own user', async () => {
    const { auth, ctx } = await setup();
    const { user: user2 } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const assetEditRepo = ctx.get(AssetEditRepository);
    const { session } = await ctx.newSession({ userId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    // User 2 should see their own edit
    await expect(ctx.syncStream(auth2, [SyncRequestType.AssetEditsV1])).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetEditV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    // User 1 should not see user 2's edit
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should sync edits for multiple assets', async () => {
    const { auth, ctx } = await setup();
    const { asset: asset1 } = await ctx.newAsset({ ownerId: auth.user.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: auth.user.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    await assetEditRepo.replaceAll(asset1.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    await assetEditRepo.replaceAll(asset2.id, [
      {
        action: AssetEditAction.Rotate,
        parameters: { angle: 270 },
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetEditsV1]);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset1.id,
            action: AssetEditAction.Crop,
            parameters: { x: 10, y: 20, width: 100, height: 200 },
            sequence: 0,
          },
          type: SyncEntityType.AssetEditV1,
        },
        {
          ack: expect.any(String),
          data: {
            id: expect.any(String),
            assetId: asset2.id,
            action: AssetEditAction.Rotate,
            parameters: { angle: 270 },
            sequence: 0,
          },
          type: SyncEntityType.AssetEditV1,
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });

  it('should not sync edits for partner assets', async () => {
    const { auth, ctx } = await setup();
    const { user: partner } = await ctx.newUser();
    await ctx.newPartner({ sharedById: partner.id, sharedWithId: auth.user.id });
    const { asset } = await ctx.newAsset({ ownerId: partner.id });
    const assetEditRepo = ctx.get(AssetEditRepository);

    await assetEditRepo.replaceAll(asset.id, [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 200 },
      },
    ]);

    // Should not see partner's asset edits in own sync
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetEditsV1]);
  });
});
