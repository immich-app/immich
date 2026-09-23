import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum.js';
import { PersonRepository } from 'src/repositories/person.repository.js';
import { DB } from 'src/schema/index.js';
import { SyncTestContext } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.AssetFaceV2, () => {
  it('should detect and sync the first asset face', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetFace.id,
          assetId: asset.id,
          personId: person.personGroupId,
          imageWidth: assetFace.imageWidth,
          imageHeight: assetFace.imageHeight,
          boundingBoxX1: assetFace.boundingBoxX1,
          boundingBoxY1: assetFace.boundingBoxY1,
          boundingBoxX2: assetFace.boundingBoxX2,
          boundingBoxY2: assetFace.boundingBoxY2,
          sourceType: assetFace.sourceType,
        }),
        type: 'AssetFaceV2',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });

  it('should detect and sync a deleted asset face', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    await personRepo.deleteAssetFace(assetFace.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetFaceId: assetFace.id,
        },
        type: 'AssetFaceDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });

  it('should not sync an asset face or asset face delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);

    await personRepo.deleteAssetFace(assetFace.id);

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });
});

describe(SyncEntityType.AssetFaceV2, () => {
  it('should detect and sync the first asset face', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetFace.id,
          assetId: asset.id,
          personId: person.personGroupId,
          imageWidth: assetFace.imageWidth,
          imageHeight: assetFace.imageHeight,
          boundingBoxX1: assetFace.boundingBoxX1,
          boundingBoxY1: assetFace.boundingBoxY1,
          boundingBoxX2: assetFace.boundingBoxX2,
          boundingBoxY2: assetFace.boundingBoxY2,
          sourceType: assetFace.sourceType,
        }),
        type: 'AssetFaceV2',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });

  it('should detect and sync a deleted asset face', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    await personRepo.deleteAssetFace(assetFace.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetFaceId: assetFace.id,
        },
        type: 'AssetFaceDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });

  it('should not sync an asset face or asset face delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);

    await personRepo.deleteAssetFace(assetFace.id);

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });

  it('should contain the deletedAt and isVisible fields in AssetFaceV2', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    let response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetFace.id,
          assetId: asset.id,
          personId: person.personGroupId,
          imageWidth: assetFace.imageWidth,
          imageHeight: assetFace.imageHeight,
          boundingBoxX1: assetFace.boundingBoxX1,
          boundingBoxY1: assetFace.boundingBoxY1,
          boundingBoxX2: assetFace.boundingBoxX2,
          boundingBoxY2: assetFace.boundingBoxY2,
          sourceType: assetFace.sourceType,
          deletedAt: null,
          isVisible: true,
        }),
        type: 'AssetFaceV2',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);

    await personRepo.deleteAssetFace(assetFace.id);

    response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetFaceId: assetFace.id,
        },
        type: 'AssetFaceDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV2]);
  });
});

describe(SyncEntityType.AssetFaceV3, () => {
  it('should detect and sync the first asset face', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: assetFace.id,
          assetId: asset.id,
          personId: person.personGroupId,
          imageWidth: assetFace.imageWidth,
          imageHeight: assetFace.imageHeight,
          boundingBoxX1: assetFace.boundingBoxX1,
          boundingBoxY1: assetFace.boundingBoxY1,
          boundingBoxX2: assetFace.boundingBoxX2,
          boundingBoxY2: assetFace.boundingBoxY2,
          sourceType: assetFace.sourceType,
          deletedAt: null,
          isVisible: true,
        },
        type: SyncEntityType.AssetFaceV3,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);
  });

  it('should sync an asset face without a person', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: assetFace.id, assetId: asset.id, personId: null }),
        type: SyncEntityType.AssetFaceV3,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should sync an asset face belonging to another user in the same cluster group', async () => {
    const { auth, user, ctx } = await setup();
    const { user: user2 } = await ctx.newUser({ clusterGroupId: user.clusterGroupId });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { person } = await ctx.newPerson({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: assetFace.id, assetId: asset.id, personId: person.personGroupId }),
        type: SyncEntityType.AssetFaceV3,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);
  });

  it('should detect and sync an updated asset face for another user in the same cluster group', async () => {
    const { auth, user, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser({ clusterGroupId: user.clusterGroupId });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { person } = await ctx.newPerson({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceV3 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);

    await personRepo.softDeleteAssetFaces(assetFace.id);

    expect(await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3])).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: assetFace.id, deletedAt: expect.any(String) }),
        type: SyncEntityType.AssetFaceV3,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should detect and sync a deleted asset face', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
    await personRepo.deleteAssetFace(assetFace.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetFaceId: assetFace.id,
        },
        type: SyncEntityType.AssetFaceDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);
  });

  it('should detect and sync a deleted asset face belonging to another user in the same cluster group', async () => {
    const { auth, user, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser({ clusterGroupId: user.clusterGroupId });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { person } = await ctx.newPerson({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
    await personRepo.deleteAssetFace(assetFace.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          assetFaceId: assetFace.id,
        },
        type: SyncEntityType.AssetFaceDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should not sync an asset face or asset face delete for a user in a different cluster group', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { person } = await ctx.newPerson({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV3])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceV3 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);

    await personRepo.deleteAssetFace(assetFace.id);

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV3])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV3]);
  });

  it('should detect and sync a deleted asset face without a person', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    await personRepo.deleteAssetFace(assetFace.id);

    expect(await ctx.syncStream(auth, [SyncRequestType.AssetFacesV3])).toEqual([
      { ack: expect.any(String), data: { assetFaceId: assetFace.id }, type: SyncEntityType.AssetFaceDeleteV1 },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
