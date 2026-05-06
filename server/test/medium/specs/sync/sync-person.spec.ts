import { Kysely } from 'kysely';
import { AssetMetadataKey, SyncEntityType, SyncRequestType } from 'src/enum';
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

const nsfwMetadata = (isNsfw: boolean, review?: { action: string; isNsfw: boolean }) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: 0.99, labels: { explicit: 0.99 } },
    ...(review ? { review } : {}),
  },
});

describe(SyncEntityType.PersonV1, () => {
  it('should detect and sync the first person', async () => {
    const { auth, ctx } = await setup();
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: person.id,
          name: person.name,
          isHidden: person.isHidden,
          birthDate: person.birthDate,
          faceAssetId: person.faceAssetId,
          isFavorite: person.isFavorite,
          ownerId: auth.user.id,
          color: person.color,
        }),
        type: 'PersonV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });

  it('should detect and sync a deleted person', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { person } = await ctx.newPerson({ ownerId: auth.user.id });
    await personRepo.delete([person.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          personId: person.id,
        },
        type: 'PersonDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });

  it('should not sync a person or person delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { person } = await ctx.newPerson({ ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);

    await personRepo.delete([person.id]);

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });

  it('should hide people that only have private NSFW faces from non-elevated sync', async () => {
    const { auth, user, ctx } = await setup();
    const { person: noFacePerson } = await ctx.newPerson({ ownerId: user.id, name: 'No faces' });
    const { person: safePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Safe' });
    const { person: nsfwOnlyPerson } = await ctx.newPerson({ ownerId: user.id, name: 'NSFW only' });
    const { person: mixedPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Mixed' });
    const { person: reviewSafePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Review safe' });
    const { person: reviewNsfwPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Review NSFW' });

    const { asset: safeAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: nsfwAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: mixedSafeAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: mixedNsfwAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedSafeAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: markedNsfwAsset } = await ctx.newAsset({ ownerId: user.id });

    await ctx.newMetadata({ assetId: nsfwAsset.id, key: AssetMetadataKey.MlEnrichment, value: nsfwMetadata(true) });
    await ctx.newMetadata({
      assetId: mixedNsfwAsset.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true),
    });
    await ctx.newMetadata({
      assetId: markedSafeAsset.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
    });
    await ctx.newMetadata({
      assetId: markedNsfwAsset.id,
      key: AssetMetadataKey.MlEnrichment,
      value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
    });

    await ctx.newAssetFace({ personId: safePerson.id, assetId: safeAsset.id });
    await ctx.newAssetFace({ personId: nsfwOnlyPerson.id, assetId: nsfwAsset.id });
    await ctx.newAssetFace({ personId: mixedPerson.id, assetId: mixedSafeAsset.id });
    await ctx.newAssetFace({ personId: mixedPerson.id, assetId: mixedNsfwAsset.id });
    await ctx.newAssetFace({ personId: reviewSafePerson.id, assetId: markedSafeAsset.id });
    await ctx.newAssetFace({ personId: reviewNsfwPerson.id, assetId: markedNsfwAsset.id });

    const hiddenResponse = await ctx.syncStream({ ...auth, hideNsfwAssets: true }, [SyncRequestType.PeopleV1]);
    const hiddenPersonIds = hiddenResponse
      .filter(({ type }) => type === SyncEntityType.PersonV1)
      .map(({ data }) => data.id);

    expect(hiddenPersonIds).toEqual(
      expect.arrayContaining([noFacePerson.id, safePerson.id, mixedPerson.id, reviewSafePerson.id]),
    );
    expect(hiddenPersonIds).not.toEqual(expect.arrayContaining([nsfwOnlyPerson.id, reviewNsfwPerson.id]));

    const elevatedResponse = await ctx.syncStream(auth, [SyncRequestType.PeopleV1]);
    const elevatedPersonIds = elevatedResponse
      .filter(({ type }) => type === SyncEntityType.PersonV1)
      .map(({ data }) => data.id);

    expect(elevatedPersonIds).toEqual(
      expect.arrayContaining([
        noFacePerson.id,
        safePerson.id,
        nsfwOnlyPerson.id,
        mixedPerson.id,
        reviewSafePerson.id,
        reviewNsfwPerson.id,
      ]),
    );
  });
});
