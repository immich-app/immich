import { Kysely } from 'kysely';
import { AssetVisibility, SharedSpaceRole } from 'src/enum';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [FaceIdentityRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(FaceIdentityRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const newSpacePerson = async (ctx: ReturnType<typeof setup>['ctx'], spaceId: string) => {
  return ctx.database.insertInto('shared_space_person').values({ spaceId }).returningAll().executeTakeFirstOrThrow();
};

const linkSpaceFace = async (ctx: ReturnType<typeof setup>['ctx'], personId: string, assetFaceId: string) => {
  await ctx.database.insertInto('shared_space_person_face').values({ personId, assetFaceId }).execute();
};

const setMemberTimeline = async (
  ctx: ReturnType<typeof setup>['ctx'],
  input: { spaceId: string; userId: string; showInTimeline: boolean },
) => {
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: input.showInTimeline })
    .where('spaceId', '=', input.spaceId)
    .where('userId', '=', input.userId)
    .execute();
};

const createAccessibleSpaceIdentity = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: { memberUserId: string; ownerUserId: string; showInTimeline?: boolean; embedding: string },
) => {
  const { space } = await ctx.newSharedSpace({ createdById: input.ownerUserId, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: input.ownerUserId, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: input.memberUserId, role: SharedSpaceRole.Viewer });
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: input.showInTimeline ?? true })
    .where('spaceId', '=', space.id)
    .where('userId', '=', input.memberUserId)
    .execute();
  const { person } = await ctx.newPerson({ ownerId: input.ownerUserId });
  const identity = await sut.ensurePersonIdentity(person.id);
  const { asset } = await ctx.newAsset({ ownerId: input.ownerUserId, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: input.ownerUserId });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: input.embedding }).execute();
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      representativeFaceId: assetFace.id,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

  return { space, spacePerson, identity };
};

const newIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: { ownerId: string; name?: string; isHidden?: boolean; visibility?: AssetVisibility },
) => {
  const { person } = await ctx.newPerson({
    ownerId: input.ownerId,
    name: input.name ?? '',
    isHidden: input.isHidden ?? false,
  });
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    visibility: input.visibility ?? AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await sut.ensurePersonIdentity(person.id);
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  return { person, asset, assetFace, identity };
};

const newLibraryIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: {
    ownerId: string;
    libraryId: string;
    personId?: string;
    identityId?: string;
    visibility?: AssetVisibility;
    name?: string;
  },
) => {
  const { person } = input.personId
    ? {
        person: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? '' });
  const identity =
    input.identityId === undefined
      ? await sut.ensurePersonIdentity(person.id)
      : { id: input.identityId, type: 'person' };
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: input.visibility ?? AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: newEmbedding() }).execute();
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  return { person, identity, asset, assetFace };
};

describe(FaceIdentityRepository.name, () => {
  it('returns no accessible identity match when multiple shared identities are within threshold', async () => {
    const { ctx, sut } = setup();
    const { user: member } = await ctx.newUser();
    const { user: ownerA } = await ctx.newUser();
    const { user: ownerB } = await ctx.newUser();
    const embedding = newEmbedding();
    try {
      await createAccessibleSpaceIdentity(ctx, sut, {
        memberUserId: member.id,
        ownerUserId: ownerA.id,
        embedding,
      });
      await createAccessibleSpaceIdentity(ctx, sut, {
        memberUserId: member.id,
        ownerUserId: ownerB.id,
        embedding,
      });

      await expect(
        sut.findClosestAccessibleIdentityForFace({
          userId: member.id,
          embedding,
          maxDistance: 0.5,
          type: 'person',
          excludeIdentityId: null,
        }),
      ).resolves.toBeUndefined();
    } finally {
      await ctx.database.deleteFrom('user').where('id', 'in', [member.id, ownerA.id, ownerB.id]).execute();
    }
  });

  it('does not use timeline-disabled spaces for global accessible identity matching', async () => {
    const { ctx, sut } = setup();
    const { user: member } = await ctx.newUser();
    const { user: owner } = await ctx.newUser();
    const embedding = newEmbedding();
    try {
      await createAccessibleSpaceIdentity(ctx, sut, {
        memberUserId: member.id,
        ownerUserId: owner.id,
        showInTimeline: false,
        embedding,
      });

      await expect(
        sut.findClosestAccessibleIdentityForFace({
          userId: member.id,
          embedding,
          maxDistance: 0.5,
          type: 'person',
          excludeIdentityId: null,
        }),
      ).resolves.toBeUndefined();
    } finally {
      await ctx.database.deleteFrom('user').where('id', 'in', [member.id, owner.id]).execute();
    }
  });

  it('treats two accessible space profiles on the same identity as one strict upload candidate', async () => {
    const { ctx, sut } = setup();
    const { user: member } = await ctx.newUser();
    const { user: owner } = await ctx.newUser();
    const embedding = newEmbedding();

    try {
      const first = await createAccessibleSpaceIdentity(ctx, sut, {
        memberUserId: member.id,
        ownerUserId: owner.id,
        embedding,
      });
      const { space: secondSpace } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: secondSpace.id, userId: owner.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceMember({ spaceId: secondSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: secondSpace.id, assetId: asset.id, addedById: owner.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding }).execute();
      await sut.linkFace({
        assetFaceId: assetFace.id,
        identityId: first.identity.id,
        source: 'shared-space-evidence',
      });
      const secondSpacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: secondSpace.id,
          identityId: first.identity.id,
          representativeFaceId: assetFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, secondSpacePerson.id, assetFace.id);

      await expect(
        sut.findClosestAccessibleIdentityForFace({
          userId: member.id,
          embedding,
          maxDistance: 0.5,
          type: 'person',
          excludeIdentityId: null,
        }),
      ).resolves.toEqual(expect.objectContaining({ identityId: first.identity.id }));
    } finally {
      await ctx.database.deleteFrom('user').where('id', 'in', [member.id, owner.id]).execute();
    }
  });

  it('reports backfill work for legacy people, unlinked visible faces, and legacy space people', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const spacePerson = await newSpacePerson(ctx, space.id);
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

      await expect(sut.hasBackfillWork()).resolves.toBe(true);

      await sut.backfillPersonalIdentities({ limit: 100 });
      await sut.backfillSpacePersonIdentities({ limit: 100 });

      await expect(sut.hasBackfillWork()).resolves.toBe(false);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('reports backfill work for dominant multi-candidate space people', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const { person: dominantPerson } = await ctx.newPerson({ ownerId: user.id });
      const { person: noisyPerson } = await ctx.newPerson({ ownerId: user.id });
      const dominantIdentity = await sut.ensurePersonIdentity(dominantPerson.id);
      const noisyIdentity = await sut.ensurePersonIdentity(noisyPerson.id);
      const spacePerson = await newSpacePerson(ctx, space.id);

      for (let index = 0; index < 20; index++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: dominantPerson.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: dominantIdentity.id, source: 'backfill' });
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
      }

      for (let index = 0; index < 2; index++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: noisyPerson.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: noisyIdentity.id, source: 'backfill' });
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
      }

      await expect(sut.hasBackfillWork()).resolves.toBe(true);

      await sut.backfillSpacePersonIdentities({ limit: 100 });

      await expect(sut.hasBackfillWork()).resolves.toBe(false);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('reports backfill work for identity-linked faces missing from linked-library space people', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const identity = await sut.ensurePersonIdentity(person.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'backfill' });
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });

      await expect(sut.hasBackfillWork()).resolves.toBe(true);

      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: space.id, identityId: identity.id, representativeFaceId: assetFace.id })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

      await expect(sut.hasBackfillWork()).resolves.toBe(false);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('reports mixed and duplicate space-person links as repairable backfill work', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });

      const { person: firstPerson } = await ctx.newPerson({ ownerId: user.id });
      const { asset: firstAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: firstAsset.id, personId: firstPerson.id });
      const firstIdentity = await sut.ensurePersonIdentity(firstPerson.id);
      await sut.linkFace({ assetFaceId: firstFace.id, identityId: firstIdentity.id, source: 'backfill' });

      const { person: secondPerson } = await ctx.newPerson({ ownerId: user.id });
      const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: secondAsset.id, personId: secondPerson.id });
      const secondIdentity = await sut.ensurePersonIdentity(secondPerson.id);
      await sut.linkFace({ assetFaceId: secondFace.id, identityId: secondIdentity.id, source: 'backfill' });

      await newSpacePerson(ctx, space.id);
      const conflictingSpacePerson = await newSpacePerson(ctx, space.id);
      await linkSpaceFace(ctx, conflictingSpacePerson.id, firstFace.id);
      await linkSpaceFace(ctx, conflictingSpacePerson.id, secondFace.id);
      await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: space.id, identityId: firstIdentity.id })
        .execute();
      const duplicateSpacePerson = await newSpacePerson(ctx, space.id);
      await linkSpaceFace(ctx, duplicateSpacePerson.id, firstFace.id);

      await expect(sut.hasBackfillWork()).resolves.toBe(true);
      await sut.backfillSpacePersonIdentities({ limit: 100 });
      await expect(sut.hasBackfillWork()).resolves.toBe(false);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('preserves manual space representative faces during space identity backfill', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const identity = await ctx.database
        .insertInto('face_identity')
        .values({ type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      const { asset: manualAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: manualFace } = await ctx.newAssetFace({ assetId: manualAsset.id });
      const { asset: identityAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: identityFace } = await ctx.newAssetFace({ assetId: identityAsset.id });
      const person = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          representativeFaceId: manualFace.id,
          representativeFaceSource: 'manual',
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, person.id, manualFace.id);
      await linkSpaceFace(ctx, person.id, identityFace.id);
      await ctx.database
        .insertInto('face_identity_face')
        .values({ identityId: identity.id, assetFaceId: identityFace.id, source: 'backfill' })
        .execute();

      await sut.backfillSpacePersonIdentities({ limit: 100 });

      const updated = await ctx.database
        .selectFrom('shared_space_person')
        .select(['identityId', 'representativeFaceId', 'representativeFaceSource'])
        .where('id', '=', person.id)
        .executeTakeFirstOrThrow();
      expect(updated).toEqual({
        identityId: identity.id,
        representativeFaceId: manualFace.id,
        representativeFaceSource: 'manual',
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('refreshes automatic space representative faces during space identity backfill', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const identity = await ctx.database
        .insertInto('face_identity')
        .values({ type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      const { asset: staleAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: staleFace } = await ctx.newAssetFace({ assetId: staleAsset.id });
      const { asset: identityAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: identityFace } = await ctx.newAssetFace({ assetId: identityAsset.id });
      const person = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          representativeFaceId: staleFace.id,
          representativeFaceSource: 'auto',
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, person.id, staleFace.id);
      await linkSpaceFace(ctx, person.id, identityFace.id);
      await ctx.database
        .insertInto('face_identity_face')
        .values({ identityId: identity.id, assetFaceId: identityFace.id, source: 'backfill' })
        .execute();

      await sut.backfillSpacePersonIdentities({ limit: 100 });

      const updated = await ctx.database
        .selectFrom('shared_space_person')
        .select(['identityId', 'representativeFaceId', 'representativeFaceSource'])
        .where('id', '=', person.id)
        .executeTakeFirstOrThrow();
      expect(updated).toEqual({
        identityId: identity.id,
        representativeFaceId: identityFace.id,
        representativeFaceSource: 'auto',
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('enforces one identity per personal profile and one active identity per face', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    const identity = await sut.ensurePersonIdentity(person.id);
    const linked = await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
    const linkedAgain = await sut.linkFace({
      assetFaceId: assetFace.id,
      identityId: identity.id,
      source: 'owner-person',
    });
    const secondIdentity = await sut.ensurePersonIdentity(person.id);

    const updatedPerson = await ctx.database
      .selectFrom('person')
      .select(['identityId'])
      .where('id', '=', person.id)
      .executeTakeFirstOrThrow();

    expect(secondIdentity.id).toBe(identity.id);
    expect(updatedPerson.identityId).toBe(identity.id);
    expect(linked).toEqual(expect.objectContaining({ assetFaceId: assetFace.id, identityId: identity.id }));
    expect(linkedAgain).toEqual(expect.objectContaining({ assetFaceId: assetFace.id, identityId: identity.id }));
  });

  it('backfills personal identities idempotently and pages by cursor', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person: firstPerson } = await ctx.newPerson({ ownerId: user.id });
    const { person: secondPerson } = await ctx.newPerson({ ownerId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id, personId: firstPerson.id });
    const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: asset.id, personId: firstPerson.id });

    const firstPage = await sut.backfillPersonalIdentities({ limit: 1 });
    const secondPage = await sut.backfillPersonalIdentities({ cursor: firstPage.nextCursor, limit: 1 });
    await sut.backfillPersonalIdentities({ limit: 100 });
    const firstIdentity = await ctx.database
      .selectFrom('person')
      .select('identityId')
      .where('id', '=', firstPerson.id)
      .executeTakeFirstOrThrow();
    await sut.backfillPersonalIdentities({ limit: 100 });

    const people = await ctx.database
      .selectFrom('person')
      .select(['id', 'identityId'])
      .where('id', 'in', [firstPerson.id, secondPerson.id])
      .orderBy('id')
      .execute();
    const links = await ctx.database
      .selectFrom('face_identity_face')
      .select(['assetFaceId', 'identityId'])
      .where('assetFaceId', 'in', [firstFace.id, secondFace.id])
      .orderBy('assetFaceId')
      .execute();

    expect(firstPage).toEqual({ processed: 1, nextCursor: expect.any(String) });
    expect(secondPage.processed).toBe(1);
    expect(people.every((person) => person.identityId)).toBe(true);
    expect(people.find((person) => person.id === firstPerson.id)?.identityId).toBe(firstIdentity.identityId);
    expect(links).toHaveLength(2);
    expect(new Set(links.map((link) => link.identityId))).toEqual(new Set([firstIdentity.identityId]));
  });

  it('does not backfill hidden or deleted faces as identity-linked faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const { assetFace: hiddenFace } = await ctx.newAssetFace({
      assetId: asset.id,
      personId: person.id,
      isVisible: false,
    });
    const { assetFace: deletedFace } = await ctx.newAssetFace({
      assetId: asset.id,
      personId: person.id,
      deletedAt: new Date(),
    });

    await sut.backfillPersonalIdentities({ limit: 100 });

    const links = await ctx.database
      .selectFrom('face_identity_face')
      .select(['assetFaceId'])
      .where('assetFaceId', 'in', [visibleFace.id, hiddenFace.id, deletedFace.id])
      .execute();

    expect(links.map((link) => link.assetFaceId)).toEqual([visibleFace.id]);
  });

  it('uses a named accessible space profile for display while keeping a viewer-owned primary profile', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { person } = await ctx.newPerson({
      ownerId: user.id,
      name: '',
      birthDate: new Date('1988-02-03T00:00:00.000Z'),
    });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Shared Name',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
      .execute();

    try {
      const result = await sut.getAccessiblePeople(user.id, { withHidden: false, page: 1, size: 50 });

      expect(result.people).toEqual([
        expect.objectContaining({
          id: person.id,
          name: 'Shared Name',
          birthDate: '1988-02-03',
          primaryProfile: { type: 'user-person', id: person.id },
          filterId: `person:${person.id}`,
        }),
      ]);
    } finally {
      await ctx.database.deleteFrom('shared_space_person').where('id', '=', spacePerson.id).execute();
      await ctx.database
        .deleteFrom('shared_space_asset')
        .where('spaceId', '=', space.id)
        .where('assetId', '=', asset.id)
        .execute();
    }
  });

  it('filters unnamed identity-grouped people below the configured minimum face count', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { person: singletonPerson } = await ctx.newPerson({ ownerId: user.id, name: '' });
      const { asset: singletonAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: singletonFace } = await ctx.newAssetFace({
        assetId: singletonAsset.id,
        personId: singletonPerson.id,
      });
      const singletonIdentity = await sut.ensurePersonIdentity(singletonPerson.id);
      await sut.linkFace({ assetFaceId: singletonFace.id, identityId: singletonIdentity.id, source: 'owner-person' });

      const { person: namedSingletonPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Named singleton' });
      const { asset: namedAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: namedFace } = await ctx.newAssetFace({
        assetId: namedAsset.id,
        personId: namedSingletonPerson.id,
      });
      const namedIdentity = await sut.ensurePersonIdentity(namedSingletonPerson.id);
      await sut.linkFace({ assetFaceId: namedFace.id, identityId: namedIdentity.id, source: 'owner-person' });

      const { person: eligiblePerson } = await ctx.newPerson({ ownerId: user.id, name: '' });
      const eligibleIdentity = await sut.ensurePersonIdentity(eligiblePerson.id);
      for (let index = 0; index < 3; index++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: eligiblePerson.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: eligibleIdentity.id, source: 'owner-person' });
      }

      const result = await sut.getAccessiblePeople(user.id, {
        withHidden: false,
        page: 1,
        size: 50,
        minimumFaceCount: 3,
      });

      expect(result.total).toBe(2);
      expect(result.people.map((person) => person.id)).toEqual(
        expect.arrayContaining([namedSingletonPerson.id, eligiblePerson.id]),
      );
      expect(result.people.map((person) => person.id)).not.toContain(singletonPerson.id);
      expect(result.people.find((person) => person.id === namedSingletonPerson.id)?.numberOfAssets).toBe(1);
      expect(result.people.find((person) => person.id === eligiblePerson.id)?.numberOfAssets).toBe(3);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  describe('getAccessiblePeopleStatistics', () => {
    it('counts visible and hidden identity profiles and unassigned faces in owned global scope', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Visible' });
        const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        const { assetFace: visibleFace } = await ctx.newAssetFace({
          assetId: visibleAsset.id,
          personId: visiblePerson.id,
        });
        const visibleIdentity = await sut.ensurePersonIdentity(visiblePerson.id);
        await sut.linkFace({ assetFaceId: visibleFace.id, identityId: visibleIdentity.id, source: 'owner-person' });

        const { person: hiddenPerson } = await ctx.newPerson({
          ownerId: user.id,
          name: 'Hidden',
          isHidden: true,
        });
        const { asset: hiddenAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        const { assetFace: hiddenFace } = await ctx.newAssetFace({
          assetId: hiddenAsset.id,
          personId: hiddenPerson.id,
        });
        const hiddenIdentity = await sut.ensurePersonIdentity(hiddenPerson.id);
        await sut.linkFace({ assetFaceId: hiddenFace.id, identityId: hiddenIdentity.id, source: 'owner-person' });

        const { asset: unassignedAsset } = await ctx.newAsset({
          ownerId: user.id,
          visibility: AssetVisibility.Timeline,
        });
        await ctx.newAssetFace({ assetId: unassignedAsset.id });

        await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 2,
          hidden: 1,
          detectedFaceCount: 3,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('dedupes an identity represented by both personal and space-person rows', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
        const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Shared Alice' });
        const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: identity.id,
            name: 'Shared Alice',
            representativeFaceId: assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('dedupes a detected face reachable through owned assets and timeline shared spaces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
        const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Owned Shared' });
        const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

        await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('includes linked-library faces only through timeline-enabled member spaces', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      try {
        const { library } = await ctx.newLibrary({ ownerId: source.id });
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const { asset } = await ctx.newAsset({
          ownerId: source.id,
          libraryId: library.id,
          visibility: AssetVisibility.Timeline,
        });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: identity.id,
            name: 'Library Person',
            representativeFaceId: assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 1,
        });

        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 0,
          hidden: 0,
          detectedFaceCount: 0,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('dedupes linked-library faces reachable through multiple timeline spaces', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      try {
        const { library } = await ctx.newLibrary({ ownerId: source.id });
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const { asset } = await ctx.newAsset({
          ownerId: source.id,
          libraryId: library.id,
          visibility: AssetVisibility.Timeline,
        });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

        for (let index = 0; index < 2; index++) {
          const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
          await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
          await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
          await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
          const spacePerson = await ctx.database
            .insertInto('shared_space_person')
            .values({
              spaceId: space.id,
              identityId: identity.id,
              name: 'Library Person',
              representativeFaceId: assetFace.id,
              type: 'person',
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
        }

        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('keeps identity list and statistics aligned by excluding identities only evidenced by offline assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Visible' });
        const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        const { assetFace: visibleFace } = await ctx.newAssetFace({
          assetId: visibleAsset.id,
          personId: visiblePerson.id,
        });
        const visibleIdentity = await sut.ensurePersonIdentity(visiblePerson.id);
        await sut.linkFace({ assetFaceId: visibleFace.id, identityId: visibleIdentity.id, source: 'owner-person' });

        const { person: offlinePerson } = await ctx.newPerson({
          ownerId: user.id,
          name: 'Offline',
          isHidden: true,
        });
        const { asset: offlineAsset } = await ctx.newAsset({
          ownerId: user.id,
          visibility: AssetVisibility.Timeline,
          isOffline: true,
        });
        const { assetFace: offlineFace } = await ctx.newAssetFace({
          assetId: offlineAsset.id,
          personId: offlinePerson.id,
        });
        const offlineIdentity = await sut.ensurePersonIdentity(offlinePerson.id);
        await sut.linkFace({ assetFaceId: offlineFace.id, identityId: offlineIdentity.id, source: 'owner-person' });

        await expect(
          sut.getAccessiblePeople(user.id, {
            withHidden: true,
            page: 1,
            size: 50,
            minimumFaceCount: 1,
          }),
        ).resolves.toMatchObject({
          total: 1,
          hidden: 0,
          people: [expect.objectContaining({ id: visiblePerson.id })],
        });
        await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });
  });

  describe('getAccessiblePeopleFaceStatistics', () => {
    it('splits owned global faces into visible, hidden, and unassigned buckets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        await newIdentityFace(ctx, sut, { ownerId: user.id, name: 'Visible' });
        await newIdentityFace(ctx, sut, { ownerId: user.id, name: 'Hidden', isHidden: true });
        const { asset: unassignedAsset } = await ctx.newAsset({
          ownerId: user.id,
          visibility: AssetVisibility.Timeline,
        });
        await ctx.newAssetFace({ assetId: unassignedAsset.id });

        const result = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });
        const overview = await sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 });

        expect(result).toEqual({
          detectedFaceCount: 3,
          assignedVisibleFaceCount: 1,
          namedVisiblePersonCount: 1,
          assignedHiddenFaceCount: 1,
          unassignedFaceCount: 1,
        });
        expect(result.detectedFaceCount).toBe(overview.detectedFaceCount);
        expect(result.assignedVisibleFaceCount + result.assignedHiddenFaceCount + result.unassignedFaceCount).toBe(
          result.detectedFaceCount,
        );
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('classifies identity faces as visible when any accessible eligible profile is visible', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
        const { assetFace, identity } = await newIdentityFace(ctx, sut, {
          ownerId: user.id,
          name: 'Hidden personal',
          isHidden: true,
        });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: identity.id,
            name: 'Visible space',
            isHidden: false,
            representativeFaceId: assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 1,
          assignedVisibleFaceCount: 1,
          namedVisiblePersonCount: 1,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('treats low-evidence unnamed identities below minimumFaceCount as unassigned', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        await newIdentityFace(ctx, sut, { ownerId: user.id });

        await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 2 })).resolves.toEqual({
          detectedFaceCount: 1,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('returns unassigned faces when no identity is linked and is deterministic', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        await ctx.newAssetFace({ assetId: asset.id });
        await ctx.newAssetFace({ assetId: asset.id });

        const first = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });
        const second = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });

        expect(first).toEqual({
          detectedFaceCount: 2,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 2,
        });
        expect(second).toEqual(first);
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('excludes invalid global assets and face rows', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const valid = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        await ctx.newAssetFace({ assetId: valid.asset.id });

        const invalidAssets = await Promise.all([
          ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, deletedAt: new Date() }),
          ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, isOffline: true }),
          ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
          ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive }),
        ]);
        for (const { asset } of invalidAssets) {
          await ctx.newAssetFace({ assetId: asset.id });
        }

        const invalidFaceAsset = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        await ctx.newAssetFace({ assetId: invalidFaceAsset.asset.id, isVisible: false });
        await ctx.newAssetFace({ assetId: invalidFaceAsset.asset.id, deletedAt: new Date() });

        await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 1,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('includes linked-library faces only through timeline-enabled member spaces and dedupes overlaps', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      try {
        const { library } = await ctx.newLibrary({ ownerId: source.id });
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const { asset } = await ctx.newAsset({
          ownerId: source.id,
          libraryId: library.id,
          visibility: AssetVisibility.Timeline,
        });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: source.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: identity.id,
            name: 'Library Person',
            representativeFaceId: assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 1,
          assignedVisibleFaceCount: 1,
          namedVisiblePersonCount: 1,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });

        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 0,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('counts linked-library identity faces from multiple libraries through one timeline-visible space', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
        const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });

        const first = await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library1.id,
          name: 'Alice',
        });
        const second = await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library2.id,
          personId: first.person.id,
          identityId: first.identity.id,
        });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: first.identity.id,
            name: 'Alice',
            representativeFaceId: first.assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, first.assetFace.id);
        await linkSpaceFace(ctx, spacePerson.id, second.assetFace.id);

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 2,
          assignedVisibleFaceCount: 2,
          namedVisiblePersonCount: 1,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 1,
          hidden: 0,
          detectedFaceCount: 2,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
      }
    });

    it('counts multiple linked-library owners for a member and excludes them for a stranger', async () => {
      const { ctx, sut } = setup();
      const { user: ownerA } = await ctx.newUser();
      const { user: ownerB } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      try {
        const owners = [
          { userId: ownerA.id, name: 'Owner A Person' },
          { userId: ownerB.id, name: 'Owner B Person' },
        ];

        for (const owner of owners) {
          const { space } = await ctx.newSharedSpace({ createdById: owner.userId, faceRecognitionEnabled: true });
          await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.userId, role: SharedSpaceRole.Owner });
          await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
          await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
          const { library } = await ctx.newLibrary({ ownerId: owner.userId });
          await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.userId });
          const face = await newLibraryIdentityFace(ctx, sut, {
            ownerId: owner.userId,
            libraryId: library.id,
            name: owner.name,
          });
          const spacePerson = await ctx.database
            .insertInto('shared_space_person')
            .values({
              spaceId: space.id,
              identityId: face.identity.id,
              name: owner.name,
              representativeFaceId: face.assetFace.id,
              type: 'person',
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          await linkSpaceFace(ctx, spacePerson.id, face.assetFace.id);
        }

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 2,
          assignedVisibleFaceCount: 2,
          namedVisiblePersonCount: 2,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 2,
          hidden: 0,
          detectedFaceCount: 2,
        });
        await expect(sut.getAccessiblePeopleFaceStatistics(stranger.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 0,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
        await expect(sut.getAccessiblePeopleStatistics(stranger.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 0,
          hidden: 0,
          detectedFaceCount: 0,
        });
      } finally {
        await ctx.database
          .deleteFrom('user')
          .where('id', 'in', [ownerA.id, ownerB.id, member.id, stranger.id])
          .execute();
      }
    });

    it('does not classify linked-library identity faces as assigned without a published space person', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
        const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });

        const first = await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library1.id,
          name: 'Private Alice',
        });
        await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library2.id,
          personId: first.person.id,
          identityId: first.identity.id,
        });

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 2,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 2,
        });
        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 0,
          hidden: 0,
          detectedFaceCount: 2,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
      }
    });

    it('excludes linked-library space faces from global stats when the member hides the space from timeline', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });
        const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
        const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });
        const first = await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library1.id,
          name: 'Alice',
        });
        const second = await newLibraryIdentityFace(ctx, sut, {
          ownerId: owner.id,
          libraryId: library2.id,
          personId: first.person.id,
          identityId: first.identity.id,
        });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: first.identity.id,
            name: 'Alice',
            representativeFaceId: first.assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, first.assetFace.id);
        await linkSpaceFace(ctx, spacePerson.id, second.assetFace.id);

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 0,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 0,
        });
        await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          total: 0,
          hidden: 0,
          detectedFaceCount: 0,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
      }
    });

    it('removes shared-space library faces after membership is removed while preserving owned global faces', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      try {
        const { asset: ownedAsset } = await ctx.newAsset({ ownerId: member.id, visibility: AssetVisibility.Timeline });
        await ctx.newAssetFace({ assetId: ownedAsset.id });

        const { library } = await ctx.newLibrary({ ownerId: source.id });
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const { asset } = await ctx.newAsset({
          ownerId: source.id,
          libraryId: library.id,
          visibility: AssetVisibility.Timeline,
        });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: identity.id,
            name: 'Library Person',
            representativeFaceId: assetFace.id,
            type: 'person',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 2,
          assignedVisibleFaceCount: 1,
          namedVisiblePersonCount: 1,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 1,
        });

        await ctx.database
          .deleteFrom('shared_space_member')
          .where('spaceId', '=', space.id)
          .where('userId', '=', member.id)
          .execute();

        await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
          detectedFaceCount: 1,
          assignedVisibleFaceCount: 0,
          namedVisiblePersonCount: 0,
          assignedHiddenFaceCount: 0,
          unassignedFaceCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('counts distinct named visible accessible identities', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      try {
        const named = await newIdentityFace(ctx, sut, { ownerId: user.id, name: 'Alice' });
        const { assetFace: secondNamedFace } = await ctx.newAssetFace({
          assetId: named.asset.id,
          personId: named.person.id,
        });
        await sut.linkFace({
          assetFaceId: secondNamedFace.id,
          identityId: named.identity.id,
          source: 'owner-person',
        });
        await newIdentityFace(ctx, sut, { ownerId: user.id, name: 'Hidden', isHidden: true });
        await newIdentityFace(ctx, sut, { ownerId: user.id, name: '' });
        await newIdentityFace(ctx, sut, { ownerId: user.id, name: '   ' });

        await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 })).resolves.toMatchObject({
          namedVisiblePersonCount: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });
  });

  describe('getAccessiblePersonStatistics', () => {
    it('counts owned and timeline shared-space identity faces once each', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      try {
        const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
        const identity = await sut.ensurePersonIdentity(person.id);

        const { asset: ownedAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
        const { assetFace: ownedFace } = await ctx.newAssetFace({ assetId: ownedAsset.id, personId: person.id });
        await sut.linkFace({ assetFaceId: ownedFace.id, identityId: identity.id, source: 'owner-person' });

        const { space } = await ctx.newSharedSpace({ createdById: partner.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: partner.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: owner.id, showInTimeline: true });
        const { asset: sharedAsset } = await ctx.newAsset({
          ownerId: partner.id,
          visibility: AssetVisibility.Timeline,
        });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: sharedAsset.id, addedById: partner.id });
        const { assetFace: sharedFace } = await ctx.newAssetFace({ assetId: sharedAsset.id });
        await sut.linkFace({ assetFaceId: sharedFace.id, identityId: identity.id, source: 'shared-space-evidence' });

        await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({
          assets: 2,
          faces: 2,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, partner.id]).execute();
      }
    });

    it('counts linked-library identity faces only through timeline-enabled member spaces', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { library } = await ctx.newLibrary({ ownerId: source.id });
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const identity = await sut.ensurePersonIdentity(person.id);
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
        await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
        const { asset } = await ctx.newAsset({
          ownerId: source.id,
          libraryId: library.id,
          visibility: AssetVisibility.Timeline,
        });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

        await expect(sut.getAccessiblePersonStatistics(member.id, identity.id)).resolves.toEqual({
          assets: 1,
          faces: 1,
        });

        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

        await expect(sut.getAccessiblePersonStatistics(member.id, identity.id)).resolves.toEqual({
          assets: 0,
          faces: 0,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('removes inaccessible space assets after the user leaves a space while keeping owned assets', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      try {
        const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
        const identity = await sut.ensurePersonIdentity(person.id);

        const { asset: ownedAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
        const { assetFace: ownedFace } = await ctx.newAssetFace({ assetId: ownedAsset.id, personId: person.id });
        await sut.linkFace({ assetFaceId: ownedFace.id, identityId: identity.id, source: 'owner-person' });

        const { space } = await ctx.newSharedSpace({ createdById: partner.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: partner.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: owner.id, showInTimeline: true });
        const { asset: sharedAsset } = await ctx.newAsset({
          ownerId: partner.id,
          visibility: AssetVisibility.Timeline,
        });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: sharedAsset.id, addedById: partner.id });
        const { assetFace: sharedFace } = await ctx.newAssetFace({ assetId: sharedAsset.id });
        await sut.linkFace({ assetFaceId: sharedFace.id, identityId: identity.id, source: 'shared-space-evidence' });

        await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({
          assets: 2,
          faces: 2,
        });

        await ctx.database
          .deleteFrom('shared_space_member')
          .where('spaceId', '=', space.id)
          .where('userId', '=', owner.id)
          .execute();

        await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({
          assets: 1,
          faces: 1,
        });
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, partner.id]).execute();
      }
    });

    it('keeps global person detail statistics stable after identity backfill reruns', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      try {
        const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Backfilled Person' });
        const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const identity = await sut.ensurePersonIdentity(person.id);
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

        await expect(sut.getAccessiblePersonStatistics(user.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });

        await sut.backfillPersonalIdentities({ limit: 100 });
        await sut.backfillSpacePersonIdentities({ limit: 100 });
        await sut.backfillPersonalIdentities({ limit: 100 });
        await sut.backfillSpacePersonIdentities({ limit: 100 });

        await expect(sut.getAccessiblePersonStatistics(user.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });
      } finally {
        await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
      }
    });

    it('resolves a timeline-enabled shared-space profile id to the accessible identity id', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const identity = await sut.ensurePersonIdentity(person.id);
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
        const { asset } = await ctx.newAsset({ ownerId: source.id, visibility: AssetVisibility.Timeline });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: source.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        const spacePerson = await ctx.database
          .insertInto('shared_space_person')
          .values({ spaceId: space.id, identityId: identity.id, name: 'Library Person', type: 'person' })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

        await expect(sut.getAccessibleProfileIdentityId(member.id, spacePerson.id)).resolves.toBe(identity.id);

        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

        await expect(sut.getAccessibleProfileIdentityId(member.id, spacePerson.id)).resolves.toBeUndefined();
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });

    it('does not resolve hidden or faceless shared-space profile ids to accessible global statistics', async () => {
      const { ctx, sut } = setup();
      const { user: source } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      try {
        const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
        const identity = await sut.ensurePersonIdentity(person.id);
        const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
        await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
        const { asset } = await ctx.newAsset({ ownerId: source.id, visibility: AssetVisibility.Timeline });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: source.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });

        const hiddenProfile = await ctx.database
          .insertInto('shared_space_person')
          .values({ spaceId: space.id, identityId: identity.id, name: 'Hidden', type: 'person', isHidden: true })
          .returningAll()
          .executeTakeFirstOrThrow();
        await linkSpaceFace(ctx, hiddenProfile.id, assetFace.id);

        const { person: facelessPerson } = await ctx.newPerson({ ownerId: source.id, name: 'Faceless Person' });
        const facelessIdentity = await sut.ensurePersonIdentity(facelessPerson.id);
        const facelessProfile = await ctx.database
          .insertInto('shared_space_person')
          .values({
            spaceId: space.id,
            identityId: facelessIdentity.id,
            name: 'Faceless',
            type: 'person',
            isHidden: false,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        await expect(sut.getAccessibleProfileIdentityId(member.id, hiddenProfile.id)).resolves.toBeUndefined();
        await expect(sut.getAccessibleProfileIdentityId(member.id, facelessProfile.id)).resolves.toBeUndefined();
      } finally {
        await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
      }
    });
  });

  it('infers shared-space person identity from linked personal faces and reports conflicts', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: alice } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
    const { person: bob } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id, personId: alice.id });
    const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id, personId: bob.id });
    const aliceIdentity = await sut.ensurePersonIdentity(alice.id);
    const bobIdentity = await sut.ensurePersonIdentity(bob.id);
    await sut.linkFace({ assetFaceId: aliceFace.id, identityId: aliceIdentity.id, source: 'backfill' });
    await sut.linkFace({ assetFaceId: bobFace.id, identityId: bobIdentity.id, source: 'backfill' });
    const singleIdentityPerson = await newSpacePerson(ctx, space.id);
    const conflictingPerson = await newSpacePerson(ctx, space.id);
    await linkSpaceFace(ctx, singleIdentityPerson.id, aliceFace.id);
    await linkSpaceFace(ctx, conflictingPerson.id, aliceFace.id);
    await linkSpaceFace(ctx, conflictingPerson.id, bobFace.id);

    const result = await sut.backfillSpacePersonIdentities({ limit: 100 });

    const spacePeople = await ctx.database
      .selectFrom('shared_space_person')
      .leftJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
      .select(['shared_space_person.identityId'])
      .select((eb) => eb.fn.count('shared_space_person_face.assetFaceId').$castTo<number>().as('faceCount'))
      .where('shared_space_person.spaceId', '=', space.id)
      .groupBy(['shared_space_person.id', 'shared_space_person.identityId'])
      .execute();

    expect(result).toEqual(expect.objectContaining({ processed: 2, conflictCount: 0 }));
    expect(spacePeople.filter((person) => person.identityId === aliceIdentity.id)).toHaveLength(1);
    expect(spacePeople.filter((person) => person.identityId === bobIdentity.id)).toHaveLength(1);
    expect(spacePeople.filter((person) => person.identityId === null && person.faceCount > 0)).toHaveLength(0);
  });

  it('splits mixed legacy space people by linked face identity when backfill is rerun', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      const { person: alice } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      const { person: bob } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id, personId: alice.id });
      const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id, personId: bob.id });
      const aliceIdentity = await sut.ensurePersonIdentity(alice.id);
      const bobIdentity = await sut.ensurePersonIdentity(bob.id);
      await sut.linkFace({ assetFaceId: aliceFace.id, identityId: aliceIdentity.id, source: 'backfill' });
      await sut.linkFace({ assetFaceId: bobFace.id, identityId: bobIdentity.id, source: 'backfill' });
      const mixedSpacePerson = await newSpacePerson(ctx, space.id);
      await linkSpaceFace(ctx, mixedSpacePerson.id, aliceFace.id);
      await linkSpaceFace(ctx, mixedSpacePerson.id, bobFace.id);

      await expect(sut.hasBackfillWork()).resolves.toBe(true);

      const result = await sut.backfillSpacePersonIdentities({ limit: 100 });

      const spacePeople = await ctx.database
        .selectFrom('shared_space_person')
        .leftJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
        .select(['shared_space_person.id', 'shared_space_person.identityId'])
        .select((eb) => eb.fn.count('shared_space_person_face.assetFaceId').$castTo<number>().as('faceCount'))
        .where('shared_space_person.spaceId', '=', space.id)
        .groupBy(['shared_space_person.id', 'shared_space_person.identityId'])
        .execute();

      expect(result.conflictCount).toBe(0);
      expect(spacePeople.filter((person) => person.identityId === aliceIdentity.id)).toHaveLength(1);
      expect(spacePeople.filter((person) => person.identityId === bobIdentity.id)).toHaveLength(1);
      expect(spacePeople.find((person) => person.identityId === aliceIdentity.id)?.faceCount).toBe(1);
      expect(spacePeople.find((person) => person.identityId === bobIdentity.id)?.faceCount).toBe(1);
      expect(spacePeople.filter((person) => person.identityId === null && person.faceCount > 0)).toHaveLength(0);
      await expect(sut.hasBackfillWork()).resolves.toBe(false);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('infers shared-space person identity from a dominant linked identity with tiny noisy candidates', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: dominantPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Dominant' });
    const dominantIdentity = await sut.ensurePersonIdentity(dominantPerson.id);
    const noisyIdentities = [];
    const spacePerson = await newSpacePerson(ctx, space.id);

    for (let index = 0; index < 100; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: dominantPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: dominantIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    for (let index = 0; index < 3; index++) {
      const { person: noisyPerson } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: noisyPerson.id });
      const noisyIdentity = await sut.ensurePersonIdentity(noisyPerson.id);
      noisyIdentities.push(noisyIdentity.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: noisyIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    await sut.backfillSpacePersonIdentities({ limit: 100 });

    const updatedSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .select('identityId')
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();

    expect(updatedSpacePerson.identityId).toBe(dominantIdentity.id);
    expect(noisyIdentities).toHaveLength(3);
  });

  it('infers shared-space person identity when high-evidence dominance has a few absolute noisy faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: dominantPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Dominant' });
    const dominantIdentity = await sut.ensurePersonIdentity(dominantPerson.id);
    const spacePerson = await newSpacePerson(ctx, space.id);

    for (let index = 0; index < 73; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: dominantPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: dominantIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    for (let personIndex = 0; personIndex < 2; personIndex++) {
      const { person: noisyPerson } = await ctx.newPerson({ ownerId: user.id });
      const noisyIdentity = await sut.ensurePersonIdentity(noisyPerson.id);

      for (let faceIndex = 0; faceIndex < 2; faceIndex++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: noisyPerson.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: noisyIdentity.id, source: 'backfill' });
        await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
      }
    }

    await sut.backfillSpacePersonIdentities({ limit: 100 });

    const updatedSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .select('identityId')
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();

    expect(updatedSpacePerson.identityId).toBe(dominantIdentity.id);
  });

  it('infers shared-space person identity when large-cluster noisy evidence stays proportional to dominance', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: dominantPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Dominant' });
    const { person: noisyPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Noisy' });
    const dominantIdentity = await sut.ensurePersonIdentity(dominantPerson.id);
    const noisyIdentity = await sut.ensurePersonIdentity(noisyPerson.id);
    const spacePerson = await newSpacePerson(ctx, space.id);

    for (let index = 0; index < 200; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: dominantPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: dominantIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    for (let index = 0; index < 20; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: noisyPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: noisyIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    await sut.backfillSpacePersonIdentities({ limit: 100 });

    const updatedSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .select('identityId')
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();

    expect(updatedSpacePerson.identityId).toBe(dominantIdentity.id);
  });

  it('splits shared-space person identity when noisy evidence exceeds the old proportional tolerance', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: dominantPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Dominant' });
    const { person: noisyPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Noisy' });
    const dominantIdentity = await sut.ensurePersonIdentity(dominantPerson.id);
    const noisyIdentity = await sut.ensurePersonIdentity(noisyPerson.id);
    const spacePerson = await newSpacePerson(ctx, space.id);

    for (let index = 0; index < 73; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: dominantPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: dominantIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    for (let index = 0; index < 9; index++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: noisyPerson.id });
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: noisyIdentity.id, source: 'backfill' });
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);
    }

    await sut.backfillSpacePersonIdentities({ limit: 100 });

    const spacePeople = await ctx.database
      .selectFrom('shared_space_person')
      .select('identityId')
      .where('spaceId', '=', space.id)
      .execute();

    expect(spacePeople.filter((person) => person.identityId === dominantIdentity.id)).toHaveLength(1);
    expect(spacePeople.filter((person) => person.identityId === noisyIdentity.id)).toHaveLength(1);
  });

  it('repairs duplicate space-person rows for the same identity instead of leaving conflicts', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: firstFace.id, identityId: identity.id, source: 'backfill' });
    await sut.linkFace({ assetFaceId: secondFace.id, identityId: identity.id, source: 'backfill' });
    const firstSpacePerson = await newSpacePerson(ctx, space.id);
    const duplicateSpacePerson = await newSpacePerson(ctx, space.id);
    await linkSpaceFace(ctx, firstSpacePerson.id, firstFace.id);
    await linkSpaceFace(ctx, duplicateSpacePerson.id, secondFace.id);

    const result = await sut.backfillSpacePersonIdentities({ limit: 100 });

    const spacePeople = await ctx.database
      .selectFrom('shared_space_person')
      .select(['id', 'identityId'])
      .where('id', 'in', [firstSpacePerson.id, duplicateSpacePerson.id])
      .execute();

    expect(result.conflictCount).toBe(0);
    expect(spacePeople.filter((person) => person.identityId === identity.id)).toHaveLength(1);
    expect(spacePeople.filter((person) => person.identityId === null)).toHaveLength(0);
  });

  it('replaces, unlinks, and merges identity face links without violating scoped profile uniqueness', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { person: targetPerson } = await ctx.newPerson({ ownerId: user.id });
    const { person: sourcePerson } = await ctx.newPerson({ ownerId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: targetPerson.id });
    const { assetFace: sourceFace } = await ctx.newAssetFace({ assetId: asset.id, personId: sourcePerson.id });
    const targetIdentity = await sut.ensurePersonIdentity(targetPerson.id);
    const sourceIdentity = await sut.ensurePersonIdentity(sourcePerson.id);
    const sourceSpacePerson = await newSpacePerson(ctx, space.id);
    await ctx.database
      .updateTable('shared_space_person')
      .set({ identityId: sourceIdentity.id })
      .where('id', '=', sourceSpacePerson.id)
      .execute();

    await sut.linkFace({ assetFaceId: targetFace.id, identityId: targetIdentity.id, source: 'backfill' });
    await sut.replaceFaceIdentity({ assetFaceId: sourceFace.id, identityId: sourceIdentity.id, source: 'manual' });
    await sut.unlinkFaces([targetFace.id]);
    const result = await sut.mergeIdentities({
      targetIdentityId: targetIdentity.id,
      sourceIdentityIds: [sourceIdentity.id, sourceIdentity.id],
      source: 'manual',
    });

    const links = await ctx.database
      .selectFrom('face_identity_face')
      .select(['assetFaceId', 'identityId'])
      .where('assetFaceId', 'in', [targetFace.id, sourceFace.id])
      .execute();
    const sourceProfile = await ctx.database
      .selectFrom('person')
      .select('identityId')
      .where('id', '=', sourcePerson.id)
      .executeTakeFirstOrThrow();
    const sourceSpaceProfile = await ctx.database
      .selectFrom('shared_space_person')
      .select('identityId')
      .where('id', '=', sourceSpacePerson.id)
      .executeTakeFirstOrThrow();

    expect(result).toEqual({ personalProfileConflictCount: 1, spaceProfileConflictCount: 0 });
    expect(links).toEqual([{ assetFaceId: sourceFace.id, identityId: targetIdentity.id }]);
    expect(sourceProfile.identityId).toBe(sourceIdentity.id);
    expect(sourceSpaceProfile.identityId).toBe(targetIdentity.id);
  });

  it('counts same-owner personal conflicts before identity merge', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { person: targetPerson } = await ctx.newPerson({ ownerId: user.id });
      const { person: sourcePerson } = await ctx.newPerson({ ownerId: user.id });
      const targetIdentity = await sut.ensurePersonIdentity(targetPerson.id);
      const sourceIdentity = await sut.ensurePersonIdentity(sourcePerson.id);

      await expect(
        sut.getMergeConflicts({
          targetIdentityId: targetIdentity.id,
          sourceIdentityIds: [sourceIdentity.id],
        }),
      ).resolves.toEqual({ personalProfileConflictCount: 1, spaceProfileConflictCount: 0 });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('counts same-space profile conflicts before identity merge', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const targetSpacePerson = await newSpacePerson(ctx, space.id);
      const sourceSpacePerson = await newSpacePerson(ctx, space.id);
      const targetIdentity = await sut.ensureSpacePersonIdentity(targetSpacePerson.id);
      const sourceIdentity = await sut.ensureSpacePersonIdentity(sourceSpacePerson.id);

      await expect(
        sut.getMergeConflicts({
          targetIdentityId: targetIdentity.id,
          sourceIdentityIds: [sourceIdentity.id],
        }),
      ).resolves.toEqual({ personalProfileConflictCount: 0, spaceProfileConflictCount: 1 });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  describe('repair', () => {
    it('merges non-conflicting identities by moving face links without merging scoped metadata', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const birthDate = new Date('1990-01-01');
      const { person: personalPerson } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Personal Alice',
        birthDate,
      });
      const { asset: personalAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: personalFace } = await ctx.newAssetFace({
        assetId: personalAsset.id,
        personId: personalPerson.id,
      });
      const personalIdentity = await sut.ensurePersonIdentity(personalPerson.id);
      await sut.linkFace({ assetFaceId: personalFace.id, identityId: personalIdentity.id, source: 'owner-person' });

      const { asset: spaceAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: spaceFace } = await ctx.newAssetFace({ assetId: spaceAsset.id });
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          name: 'Space Alice',
          birthDate: '1988-02-03',
          representativeFaceId: spaceFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, spaceFace.id);
      const spaceIdentity = await sut.ensureSpacePersonIdentity(spacePerson.id);
      await sut.linkFace({ assetFaceId: spaceFace.id, identityId: spaceIdentity.id, source: 'shared-space-evidence' });

      await sut.mergeIdentities({
        targetIdentityId: spaceIdentity.id,
        sourceIdentityIds: [personalIdentity.id],
        source: 'manual',
      });

      const oldSourceFaces = await ctx.database
        .selectFrom('face_identity_face')
        .selectAll()
        .where('identityId', '=', personalIdentity.id)
        .execute();
      const personalProfile = await ctx.database
        .selectFrom('person')
        .select(['name', 'birthDate', 'identityId'])
        .where('id', '=', personalPerson.id)
        .executeTakeFirstOrThrow();
      const spaceProfile = await ctx.database
        .selectFrom('shared_space_person')
        .select(['name', 'birthDate', 'identityId'])
        .where('id', '=', spacePerson.id)
        .executeTakeFirstOrThrow();

      expect(oldSourceFaces).toHaveLength(0);
      expect(personalProfile.name).toBe('Personal Alice');
      expect(personalProfile.birthDate).toEqual(birthDate);
      expect(personalProfile.identityId).toBe(spaceIdentity.id);
      expect(spaceProfile).toEqual(
        expect.objectContaining({
          name: 'Space Alice',
          birthDate: new Date('1988-02-03'),
          identityId: spaceIdentity.id,
        }),
      );
    });

    it('detaches a space profile into a fresh identity and moves only that profile faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const { person: personalPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      const { asset: personalAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: personalFace } = await ctx.newAssetFace({
        assetId: personalAsset.id,
        personId: personalPerson.id,
      });
      const originalIdentity = await sut.ensurePersonIdentity(personalPerson.id);
      await sut.linkFace({ assetFaceId: personalFace.id, identityId: originalIdentity.id, source: 'owner-person' });

      const { asset: spaceAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: spaceFace } = await ctx.newAssetFace({ assetId: spaceAsset.id });
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          identityId: originalIdentity.id,
          name: 'Alice in Space',
          representativeFaceId: spaceFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, spaceFace.id);
      await sut.linkFace({
        assetFaceId: spaceFace.id,
        identityId: originalIdentity.id,
        source: 'shared-space-evidence',
      });

      const newIdentityId = await sut.detachScopedProfile({
        type: 'space-person',
        id: spacePerson.id,
        spaceId: space.id,
      });

      const detachedProfile = await ctx.database
        .selectFrom('shared_space_person')
        .select('identityId')
        .where('id', '=', spacePerson.id)
        .executeTakeFirstOrThrow();
      const sourcePersonal = await ctx.database
        .selectFrom('person')
        .select('identityId')
        .where('id', '=', personalPerson.id)
        .executeTakeFirstOrThrow();
      const links = await ctx.database
        .selectFrom('face_identity_face')
        .select(['assetFaceId', 'identityId'])
        .where('assetFaceId', 'in', [personalFace.id, spaceFace.id])
        .orderBy('assetFaceId')
        .execute();

      expect(newIdentityId).not.toBe(originalIdentity.id);
      expect(detachedProfile.identityId).toBe(newIdentityId);
      expect(sourcePersonal.identityId).toBe(originalIdentity.id);
      expect(links).toEqual(
        expect.arrayContaining([
          { assetFaceId: personalFace.id, identityId: originalIdentity.id },
          { assetFaceId: spaceFace.id, identityId: newIdentityId },
        ]),
      );
    });

    it('reports identity repair as unsafe when an attached space profile is not repairable by the actor', async () => {
      const { ctx, sut } = setup();
      const { user: actor } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      const { space: accessibleSpace } = await ctx.newSharedSpace({ createdById: actor.id });
      const { space: privateSpace } = await ctx.newSharedSpace({ createdById: stranger.id });
      await ctx.newSharedSpaceMember({ spaceId: accessibleSpace.id, userId: actor.id, role: SharedSpaceRole.Editor });
      await ctx.newSharedSpaceMember({ spaceId: privateSpace.id, userId: stranger.id, role: SharedSpaceRole.Owner });
      const { person: actorPerson } = await ctx.newPerson({ ownerId: actor.id });
      const actorIdentity = await sut.ensurePersonIdentity(actorPerson.id);
      const sourceIdentity = await ctx.database
        .insertInto('face_identity')
        .values({ type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      const accessibleSpacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: accessibleSpace.id, identityId: sourceIdentity.id, type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: privateSpace.id, identityId: sourceIdentity.id, type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();

      const resolved = await sut.resolveRepairRefs(actor.id, {
        target: { type: 'person', id: actorPerson.id },
        sources: [{ type: 'space-person', id: accessibleSpacePerson.id, spaceId: accessibleSpace.id }],
      });

      expect(actorIdentity.id).toBeTruthy();
      expect(resolved).toEqual(expect.objectContaining({ accessible: true, allAttachedProfilesRepairable: false }));
    });

    it('reports same-owner personal repair as a scoped profile conflict', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person: targetPerson } = await ctx.newPerson({ ownerId: user.id });
      const { person: sourcePerson } = await ctx.newPerson({ ownerId: user.id });
      await sut.ensurePersonIdentity(targetPerson.id);
      await sut.ensurePersonIdentity(sourcePerson.id);

      const resolved = await sut.resolveRepairRefs(user.id, {
        target: { type: 'person', id: targetPerson.id },
        sources: [{ type: 'person', id: sourcePerson.id }],
      });

      expect(resolved).toEqual(expect.objectContaining({ accessible: true, hasScopedProfileConflict: true }));
    });

    it('rejects detach when selected space-person faces also back non-repairable personal profiles', async () => {
      const { ctx, sut } = setup();
      const { user: actor } = await ctx.newUser();
      const { user: sourceOwner } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: actor.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: actor.id, role: SharedSpaceRole.Editor });
      const { person: sourcePerson } = await ctx.newPerson({ ownerId: sourceOwner.id });
      const { asset } = await ctx.newAsset({ ownerId: sourceOwner.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: sourcePerson.id });
      const identity = await sut.ensurePersonIdentity(sourcePerson.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: space.id, identityId: identity.id, representativeFaceId: assetFace.id, type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

      const resolved = await sut.resolveDetachRef(actor.id, {
        type: 'space-person',
        id: spacePerson.id,
        spaceId: space.id,
      });

      expect(resolved).toEqual(expect.objectContaining({ accessible: true, allBackingFacesRepairable: false }));
    });
  });
});
