import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PersonRepository } from 'src/repositories/person.repository';
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

describe(SyncEntityType.AssetFaceV1, () => {
  it('should detect and sync the first asset face', async () => {
    const { auth, ctx } = await setup();
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: assetFace.id,
          assetId: asset.id,
          personId: person.id,
          imageWidth: assetFace.imageWidth,
          imageHeight: assetFace.imageHeight,
          boundingBoxX1: assetFace.boundingBoxX1,
          boundingBoxY1: assetFace.boundingBoxY1,
          boundingBoxX2: assetFace.boundingBoxX2,
          boundingBoxY2: assetFace.boundingBoxY2,
          sourceType: assetFace.sourceType,
        }),
        type: 'AssetFaceV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV1]);
  });

  it('should detect and sync a deleted asset face', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    await personRepo.deleteAssetFace(assetFace.id);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetFacesV1]);
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
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV1]);
  });

  it('should not sync an asset face or asset face delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { asset } = await ctx.newAsset({ ownerId: user2.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV1]);

    await personRepo.deleteAssetFace(assetFace.id);

    expect(await ctx.syncStream(auth2, [SyncRequestType.AssetFacesV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.AssetFaceDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetFacesV1]);
  });
});
