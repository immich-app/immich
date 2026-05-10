import { Kysely } from 'kysely';
import { AssetVisibility, JobName, JobStatus, SharedSpaceRole, SourceType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { newMediumService } from 'test/medium.factory';
import { factory, newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';
import { Mocked } from 'vitest';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx, sut } = newMediumService(SharedSpaceService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      SharedSpaceRepository,
      FaceIdentityRepository,
      PersonRepository,
      ConfigRepository,
      SystemMetadataRepository,
      SearchRepository,
    ],
    mock: [LoggingRepository, JobRepository],
  });
  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return {
    ctx,
    sut,
    faceIdentityRepository: ctx.get(FaceIdentityRepository),
    sharedSpaceRepository: ctx.get(SharedSpaceRepository),
    jobs,
  };
};

const drainSharedSpaceFaceJobs = async (sharedSpaceService: SharedSpaceService, jobs: Mocked<JobRepository>) => {
  let cursor = 0;
  while (cursor < jobs.queue.mock.calls.length) {
    const queued = jobs.queue.mock.calls.slice(cursor).map(([job]) => job);
    cursor = jobs.queue.mock.calls.length;

    for (const job of queued) {
      if (job.name === JobName.SharedSpaceFaceMatchAll) {
        await sharedSpaceService.handleSharedSpaceFaceMatchAll(job.data);
      }
      if (job.name === JobName.SharedSpaceFaceMatchPage) {
        await sharedSpaceService.handleSharedSpaceFaceMatchPage(job.data);
      }
      if (job.name === JobName.SharedSpacePersonDedup) {
        await sharedSpaceService.handleSharedSpacePersonDedup(job.data);
      }
      if (job.name === JobName.SharedSpaceIdentityReconciliation) {
        await sharedSpaceService.handleSharedSpaceIdentityReconciliation(job.data);
      }
    }
  }
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const createIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  faceIdentityRepository: FaceIdentityRepository,
  input: {
    ownerId: string;
    libraryId: string;
    personId?: string;
    identityId?: string;
    name?: string;
  },
) => {
  const { result: person } = input.personId
    ? {
        result: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? 'Alice' });
  const identity =
    input.identityId === undefined
      ? await faceIdentityRepository.ensurePersonIdentity(person.id)
      : { id: input.identityId, type: 'person' };
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: newEmbedding() }).execute();
  await faceIdentityRepository.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  return { person, identity, asset, assetFace };
};

const createExifIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  faceIdentityRepository: FaceIdentityRepository,
  input: {
    ownerId: string;
    libraryId: string;
    personId?: string;
    identityId?: string;
    name?: string;
  },
) => {
  const { result: person } = input.personId
    ? {
        result: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? 'Alice EXIF' });
  const identity =
    input.identityId === undefined
      ? await faceIdentityRepository.ensurePersonIdentity(person.id)
      : { id: input.identityId, type: 'person' };
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({
    assetId: asset.id,
    personId: person.id,
    sourceType: SourceType.Exif,
  });
  await faceIdentityRepository.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'import' });

  return { person, identity, asset, assetFace };
};

const createLegacyPetFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  input: {
    ownerId: string;
    libraryId: string;
    name?: string;
  },
) => {
  const { result: person } = await ctx.newPerson({
    ownerId: input.ownerId,
    name: input.name ?? 'Fido',
    type: 'pet',
  });
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

  return { person, asset, assetFace };
};

describe('SharedSpaceService linked-library face identity repair', () => {
  it('full-space rematch assigns every EXIF identity face in linked libraries without embeddings', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository, jobs } = setup();
    const { user } = await ctx.newUser();
    const { space: firstSpace } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    const { space: secondSpace } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: firstSpace.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: secondSpace.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: firstSpace.id, libraryId: library.id, addedById: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: secondSpace.id, libraryId: library.id, addedById: user.id });
    const first = await createExifIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice EXIF',
    });
    const second = await createExifIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });

    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: firstSpace.id })).resolves.toBe(JobStatus.Success);
    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: secondSpace.id })).resolves.toBe(JobStatus.Success);
    await drainSharedSpaceFaceJobs(sut, jobs);

    for (const space of [firstSpace, secondSpace]) {
      const people = await ctx.database
        .selectFrom('shared_space_person')
        .selectAll()
        .where('spaceId', '=', space.id)
        .where('identityId', '=', first.identity.id)
        .execute();
      expect(people).toHaveLength(1);
      await expect(
        sharedSpaceRepository.getPersonFaceAssignmentsForSpace(first.assetFace.id, space.id),
      ).resolves.toEqual([{ personId: people[0].id, identityId: first.identity.id, type: 'person' }]);
      await expect(
        sharedSpaceRepository.getPersonFaceAssignmentsForSpace(second.assetFace.id, space.id),
      ).resolves.toEqual([{ personId: people[0].id, identityId: first.identity.id, type: 'person' }]);
      await expect(
        sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
      ).resolves.toMatchObject({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 2,
        unassignedFaceCount: 0,
      });
    }
  });

  it('library sync creates one identity-backed space person across multiple linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository, jobs } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library: library1 } = await ctx.newLibrary({ ownerId: user.id });
    const { library: library2 } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: user.id });

    const first = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library1.id,
      name: 'Alice',
    });
    const second = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library2.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library1.id })).resolves.toBe(
      JobStatus.Success,
    );
    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library2.id })).resolves.toBe(
      JobStatus.Success,
    );

    const people = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', first.identity.id)
      .execute();
    expect(people).toHaveLength(1);
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(first.assetFace.id, space.id)).resolves.toEqual(
      [{ personId: people[0].id, identityId: first.identity.id, type: 'person' }],
    );
    await expect(
      sharedSpaceRepository.getPersonFaceAssignmentsForSpace(second.assetFace.id, space.id),
    ).resolves.toEqual([{ personId: people[0].id, identityId: first.identity.id, type: 'person' }]);
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 2,
      unassignedFaceCount: 0,
    });
    expect(jobs.queue).toHaveBeenCalledWith({ name: JobName.SharedSpacePersonDedup, data: { spaceId: space.id } });
    expect(jobs.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceIdentityReconciliation,
      data: { spaceId: space.id },
    });
  });

  it('full-space rematch repairs stale selected-space face assignments from linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository, jobs } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const stalePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'person',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: stalePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id })).resolves.toBe(JobStatus.Success);
    await drainSharedSpaceFaceJobs(sut, jobs);

    const correctPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: correctPerson.id, identityId: face.identity.id, type: 'person' },
    ]);
    await expect(sharedSpaceRepository.getPersonById(stalePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      unassignedFaceCount: 0,
    });
  });

  it('library sync repairs stale selected-space face assignments from linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const stalePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'person',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: stalePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
      JobStatus.Success,
    );

    const correctPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: correctPerson.id, identityId: face.identity.id, type: 'person' },
    ]);
    await expect(sharedSpaceRepository.getPersonById(stalePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      unassignedFaceCount: 0,
    });
  });

  it('relinking a library rebuilds identity-backed selected-space assignments', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
      JobStatus.Success,
    );
    const originalPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: originalPerson.id, identityId: face.identity.id, type: 'person' },
    ]);

    await sut.unlinkLibrary(factory.auth({ user: { id: user.id, isAdmin: true } }), space.id, library.id);

    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      unassignedFaceCount: 0,
    });

    await sharedSpaceRepository.addLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
      JobStatus.Success,
    );

    const rebuiltPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: rebuiltPerson.id, identityId: face.identity.id, type: 'person' },
    ]);
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('library sync keeps no-identity pet faces on the legacy matching path', async () => {
    const { ctx, sut, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createLegacyPetFace(ctx, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Fido',
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
      JobStatus.Success,
    );

    const assignments = await sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id);
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatchObject({ identityId: null, type: 'pet' });
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { petsEnabled: true }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('full-space rematch removes type-incompatible assignments without inflating stats', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository, jobs } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const petSpacePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      identityId: face.identity.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'pet',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: petSpacePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id })).resolves.toBe(JobStatus.Success);
    await drainSharedSpaceFaceJobs(sut, jobs);

    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual(
      [],
    );
    await expect(sharedSpaceRepository.getPersonById(petSpacePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { petsEnabled: true }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });
  });
});
