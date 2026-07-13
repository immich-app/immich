import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PersonRepository } from 'src/repositories/person.repository';
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

describe(SyncEntityType.FaceClusterV1, () => {
  it('should detect and sync the first face cluster', async () => {
    const { auth, ctx } = await setup();
    const { faceCluster } = await ctx.newFaceCluster();
    await ctx.newPerson({ ownerId: auth.user.id, faceClusterId: faceCluster.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.FaceClusterV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: faceCluster.id,
          name: faceCluster.name,
          featureFaceAssetId: faceCluster.featureFaceAssetId,
          birthDate: faceCluster.birthDate,
        }),
        type: 'FaceClusterV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.FaceClusterV1]);
  });

  it('should detect and sync a deleted face cluster', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());
    const personRepo = ctx.get(PersonRepository);
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    await personRepo.deleteFaceClusters([person.faceClusterId]);

    const response = await ctx.syncStream(auth, [SyncRequestType.FaceClusterV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          faceClusterId: person.faceClusterId,
        },
        type: 'FaceClusterDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.FaceClusterV1]);
  });
});
