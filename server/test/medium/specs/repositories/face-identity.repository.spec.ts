import { Kysely } from 'kysely';
import { SharedSpaceRole } from 'src/enum';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
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

describe(FaceIdentityRepository.name, () => {
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

  it('prefers a named accessible space profile over a blank personal profile', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: '' });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Pierre',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    try {
      const result = await sut.getAccessiblePeople(user.id, { withHidden: false, page: 1, size: 50 });

      expect(result.people).toEqual([
        expect.objectContaining({
          id: spacePerson.id,
          name: 'Pierre',
          primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
          filterId: `space-person:${spacePerson.id}`,
        }),
      ]);
    } finally {
      await ctx.database.deleteFrom('shared_space_person').where('id', '=', spacePerson.id).execute();
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
