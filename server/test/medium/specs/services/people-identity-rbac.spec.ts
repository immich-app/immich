import { BadRequestException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AssetVisibility, JobName, SharedSpaceRole } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { PersonService } from 'src/services/person.service';
import { SearchService } from 'src/services/search.service';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { newMediumService } from 'test/medium.factory';
import { factory, newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';
import { Mocked } from 'vitest';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx, sut } = newMediumService(PersonService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      ConfigRepository,
      FaceIdentityRepository,
      PersonRepository,
      SearchRepository,
      SharedSpaceRepository,
    ],
    mock: [JobRepository, LoggingRepository, SystemMetadataRepository],
  });
  const metadata = ctx.getMock<SystemMetadataRepository, Mocked<SystemMetadataRepository>>(SystemMetadataRepository);
  metadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } } as any);

  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return { ctx, sut, faceIdentityRepository: ctx.get(FaceIdentityRepository) };
};

const setupSharedSpace = (db?: Kysely<DB>) => {
  const { ctx, sut } = newMediumService(SharedSpaceService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AssetRepository,
      ConfigRepository,
      FaceIdentityRepository,
      PersonRepository,
      SearchRepository,
      SharedSpaceRepository,
      SystemMetadataRepository,
    ],
    mock: [JobRepository, LoggingRepository],
  });
  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return { ctx, sut, faceIdentityRepository: ctx.get(FaceIdentityRepository), jobs };
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

const setupSearch = (db?: Kysely<DB>) => {
  const { ctx, sut } = newMediumService(SearchService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      ConfigRepository,
      FaceIdentityRepository,
      SearchRepository,
      SharedSpaceRepository,
      PartnerRepository,
    ],
    mock: [LoggingRepository, SystemMetadataRepository],
  });
  const metadata = ctx.getMock<SystemMetadataRepository, Mocked<SystemMetadataRepository>>(SystemMetadataRepository);
  metadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } } as any);

  return { ctx, sut };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const setupPeopleIdentityMatrix = async () => {
  const { ctx, sut, faceIdentityRepository } = setup();
  const { user: source } = await ctx.newUser();
  const { user: space1OnlyMember } = await ctx.newUser();
  const { user: userInBothSpaces } = await ctx.newUser();
  const { user: nonMember } = await ctx.newUser();
  const { user: adminNonMember } = await ctx.newUser({ isAdmin: true });

  const { space: space1 } = await ctx.newSharedSpace({ createdById: space1OnlyMember.id, name: 'Space One' });
  const { space: space2 } = await ctx.newSharedSpace({ createdById: userInBothSpaces.id, name: 'Space Two' });
  const { space: hiddenTimelineSpace } = await ctx.newSharedSpace({
    createdById: source.id,
    name: 'Hidden Timeline Space',
  });

  await ctx.newSharedSpaceMember({ spaceId: space1.id, userId: source.id, role: SharedSpaceRole.Viewer });
  await ctx.newSharedSpaceMember({ spaceId: space1.id, userId: space1OnlyMember.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space1.id, userId: userInBothSpaces.id, role: SharedSpaceRole.Viewer });
  await ctx.newSharedSpaceMember({ spaceId: space2.id, userId: userInBothSpaces.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({
    spaceId: hiddenTimelineSpace.id,
    userId: userInBothSpaces.id,
    role: SharedSpaceRole.Viewer,
  });
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: false })
    .where('spaceId', '=', hiddenTimelineSpace.id)
    .where('userId', '=', userInBothSpaces.id)
    .execute();

  const { result: alicePerson } = await ctx.newPerson({
    ownerId: source.id,
    name: 'Alice Source',
    birthDate: new Date('1990-01-01'),
    thumbnailPath: '/private/alice-thumbnail.jpg',
  });
  const aliceIdentity = await faceIdentityRepository.ensurePersonIdentity(alicePerson.id);

  const makeSharedFace = async (input: { spaceId: string; personName: string; ownerId?: string; city?: string }) => {
    const { asset } = await ctx.newAsset({
      ownerId: input.ownerId ?? source.id,
      visibility: AssetVisibility.Timeline,
    });
    if (input.city) {
      await ctx.newExif({ assetId: asset.id, city: input.city, country: 'Germany' });
    }
    await ctx.newSharedSpaceAsset({ spaceId: input.spaceId, assetId: asset.id, addedById: input.ownerId ?? source.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: alicePerson.id });
    await faceIdentityRepository.linkFace({
      assetFaceId: faceId,
      identityId: aliceIdentity.id,
      source: 'owner-person',
    });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: input.spaceId,
        identityId: aliceIdentity.id,
        name: input.personName,
        birthDate: '1990-01-01',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();
    return { asset, faceId, spacePerson };
  };

  const space1Alice = await makeSharedFace({ spaceId: space1.id, personName: 'Alice Source', city: 'Berlin' });
  const space2Alice = await makeSharedFace({ spaceId: space2.id, personName: 'Space 2 Private Name', city: 'Paris' });
  const hiddenTimelineAlice = await makeSharedFace({
    spaceId: hiddenTimelineSpace.id,
    personName: 'Hidden Timeline Name',
  });

  return {
    sut,
    aliceIdentityId: aliceIdentity.id,
    source,
    space1,
    space2,
    hiddenTimelineSpace,
    space1Alice,
    space2Alice,
    hiddenTimelineAlice,
    space1OnlyMember,
    userInBothSpaces,
    nonMember,
    adminNonMember,
  };
};

const setupRepairFixture = async (role: SharedSpaceRole = SharedSpaceRole.Editor) => {
  const { ctx, sut, faceIdentityRepository } = setup();
  const { user: actor } = await ctx.newUser();
  const { user: otherUser } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: otherUser.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: actor.id, role });
  const { person: actorPerson } = await ctx.newPerson({ ownerId: actor.id, name: 'Actor Alice' });
  const targetIdentity = await faceIdentityRepository.ensurePersonIdentity(actorPerson.id);
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({ spaceId: space.id, name: 'Space Alice', type: 'person' })
    .returningAll()
    .executeTakeFirstOrThrow();
  const sourceIdentity = await faceIdentityRepository.ensureSpacePersonIdentity(spacePerson.id);

  return {
    ctx,
    sut,
    faceIdentityRepository,
    actor,
    otherUser,
    space,
    actorPerson,
    targetIdentity,
    spacePerson,
    sourceIdentity,
  };
};

const createIdentityBackedFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  faceIdentityRepository: FaceIdentityRepository,
  input: {
    ownerId: string;
    personName: string;
    spaceId?: string;
    assetAdderId?: string;
    libraryId?: string;
  },
) => {
  const { result: person } = await ctx.newPerson({ ownerId: input.ownerId, name: input.personName });
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: AssetVisibility.Timeline,
  });
  if (input.spaceId) {
    await ctx.newSharedSpaceAsset({
      spaceId: input.spaceId,
      assetId: asset.id,
      addedById: input.assetAdderId ?? input.ownerId,
    });
  }
  const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId, embedding: newEmbedding() }).execute();
  const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
  await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
  return { asset, faceId, identity, person };
};

const createLinkedLibraryIdentityFixture = async (input?: {
  city?: string;
  personName?: string;
  memberInitiallyJoined?: boolean;
}) => {
  const { ctx, sut: personService, faceIdentityRepository } = setup();
  const { sut: sharedSpaceService, jobs: sharedJobs } = setupSharedSpace();
  const { sut: searchService } = setupSearch();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { user: nonMember } = await ctx.newUser();
  const { library } = await ctx.newLibrary({ ownerId: source.id });
  const { space } = await ctx.newSharedSpace({ createdById: source.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
  if (input?.memberInitiallyJoined ?? true) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }
  const face = await createIdentityBackedFace(ctx, faceIdentityRepository, {
    ownerId: source.id,
    libraryId: library.id,
    personName: input?.personName ?? 'Library Source',
  });
  if (input?.city) {
    await ctx.newExif({ assetId: face.asset.id, city: input.city, country: 'Switzerland' });
  }
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
  await sharedSpaceService.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id });
  const spacePerson = await ctx.database
    .selectFrom('shared_space_person')
    .selectAll()
    .where('spaceId', '=', space.id)
    .executeTakeFirstOrThrow();

  return {
    ctx,
    personService,
    sharedSpaceService,
    sharedJobs,
    searchService,
    source,
    member,
    nonMember,
    library,
    space,
    face,
    spacePerson,
    faceIdentityRepository,
  };
};

const authFor = (user: { id: string; name: string; email: string; isAdmin?: boolean }) =>
  factory.auth({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });

type IdentityRbacContext = ReturnType<typeof setup>['ctx'] | ReturnType<typeof setupSearch>['ctx'];

const setSpaceTimeline = async (
  ctx: IdentityRbacContext,
  input: { spaceId: string; userId: string; showInTimeline: boolean },
) => {
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: input.showInTimeline })
    .where('spaceId', '=', input.spaceId)
    .where('userId', '=', input.userId)
    .execute();
};

const addCity = async (ctx: IdentityRbacContext, assetId: string, city: string) => {
  await ctx.newExif({ assetId, city, country: 'Germany', fileSizeInByte: 2048 });
};

const setupJoinAfterDuplicatesFixture = async (
  input: { showInTimeline?: boolean; memberBeforeSpaceEvidence?: boolean } = {},
) => {
  const { ctx, sut: personService, faceIdentityRepository } = setup();
  const { sut: sharedSpaceService } = setupSharedSpace();
  const { sut: searchService } = setupSearch();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const embedding = newEmbedding();

  const { result: ownerPerson } = await ctx.newPerson({ ownerId: owner.id, name: 'Owner Shared Name' });
  const { asset: spaceAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  const { result: ownerFace } = await ctx.newAssetFace({ assetId: spaceAsset.id, personId: ownerPerson.id });
  await ctx.database.insertInto('face_search').values({ faceId: ownerFace, embedding }).execute();
  const ownerIdentity = await faceIdentityRepository.ensurePersonIdentity(ownerPerson.id);
  await faceIdentityRepository.linkFace({
    assetFaceId: ownerFace,
    identityId: ownerIdentity.id,
    source: 'owner-person',
  });

  const { result: memberPerson } = await ctx.newPerson({ ownerId: member.id, name: 'Member Private Name' });
  const { asset: memberAsset } = await ctx.newAsset({ ownerId: member.id, visibility: AssetVisibility.Timeline });
  const { result: memberFace } = await ctx.newAssetFace({ assetId: memberAsset.id, personId: memberPerson.id });
  await ctx.database.insertInto('face_search').values({ faceId: memberFace, embedding }).execute();
  const memberIdentity = await faceIdentityRepository.ensurePersonIdentity(memberPerson.id);
  await faceIdentityRepository.linkFace({
    assetFaceId: memberFace,
    identityId: memberIdentity.id,
    source: 'owner-person',
  });

  const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  if (input.memberBeforeSpaceEvidence) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }

  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: spaceAsset.id, addedById: owner.id });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: ownerIdentity.id,
      name: 'Owner Shared Name',
      representativeFaceId: ownerFace,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: ownerFace })
    .execute();

  if (!input.memberBeforeSpaceEvidence) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }
  await setSpaceTimeline(ctx, {
    spaceId: space.id,
    userId: member.id,
    showInTimeline: input.showInTimeline ?? true,
  });

  return {
    ctx,
    personService,
    sharedSpaceService,
    searchService,
    faceIdentityRepository,
    owner,
    member,
    memberAuth: authFor(member),
    space,
    spaceAsset,
    memberAsset,
    ownerPerson,
    memberPerson,
    spacePerson,
    ownerIdentity,
    memberIdentity,
  };
};

describe('People identity RBAC projection', () => {
  it('returns one row per accessible identity for a member of multiple spaces', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.userInBothSpaces }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result.people.filter((person) => person.name === 'Alice Source')).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('does not let a Space 1 only member infer Space 2 metadata, counts, thumbnails, or ids', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.space1OnlyMember }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('Space 2 Private Name');
    expect(serialized).not.toContain(fx.space2.id);
    expect(serialized).not.toContain(fx.space2Alice.asset.id);
    expect(serialized).not.toContain('/private/alice-thumbnail.jpg');
    expect(result.people.find((person) => person.name === 'Alice Source')?.numberOfAssets).toBe(1);
  });

  it('counts linked-library identity faces only for timeline-enabled space members', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { user: nonMember } = await ctx.newUser();
    const { library } = await ctx.newLibrary({ ownerId: source.id });
    const { space } = await ctx.newSharedSpace({ createdById: source.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const face = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      libraryId: library.id,
      personName: 'Library Source',
    });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: face.identity.id,
        name: 'Library Source',
        representativeFaceId: face.faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: face.faceId })
      .execute();

    const visible = await sut.getAll(authFor(member), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(visible.total).toBe(1);
    expect(visible.people[0]).toEqual(
      expect.objectContaining({
        id: spacePerson.id,
        name: 'Library Source',
        numberOfAssets: 1,
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
        filterId: `space-person:${spacePerson.id}`,
      }),
    );

    const hiddenFromNonMember = await sut.getAll(authFor(nonMember), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(hiddenFromNonMember.total).toBe(0);
    expect(JSON.stringify(hiddenFromNonMember)).not.toContain('Library Source');

    await ctx.database
      .updateTable('shared_space_member')
      .set({ showInTimeline: false })
      .where('spaceId', '=', space.id)
      .where('userId', '=', member.id)
      .execute();

    const hiddenFromTimeline = await sut.getAll(authFor(member), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(hiddenFromTimeline.total).toBe(0);
  });

  it('exposes linked-library space people through global discovery endpoints without leaking to non-members', async () => {
    const fx = await createLinkedLibraryIdentityFixture({ city: 'Zurich' });
    const auth = authFor(fx.member);
    const token = `space-person:${fx.spacePerson.id}`;

    const people = await fx.personService.getAll(auth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const search = await fx.searchService.searchPerson(auth, { name: 'Library', withSharedSpaces: true });
    const filters = await fx.searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
    const cities = await fx.searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [token],
    });
    const metadata = await fx.searchService.searchMetadata(auth, {
      withSharedSpaces: true,
      personIds: [token],
    });

    expect(people.people).toEqual([
      expect.objectContaining({
        name: 'Library Source',
        primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
      }),
    ]);
    expect(search).toEqual([
      expect.objectContaining({
        name: 'Library Source',
        filterId: token,
        primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
      }),
    ]);
    expect(filters.people).toEqual([
      {
        id: token,
        name: 'Library Source',
        primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
      },
    ]);
    expect(cities).toEqual(['Zurich']);
    expect(metadata.assets.items).toEqual([expect.objectContaining({ id: fx.face.asset.id })]);

    const nonMemberAuth = authFor(fx.nonMember);
    const hiddenPeople = await fx.personService.getAll(nonMemberAuth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const hiddenFilters = await fx.searchService.getFilterSuggestions(nonMemberAuth, { withSharedSpaces: true });
    const hiddenMetadata = await fx.searchService.searchMetadata(nonMemberAuth, {
      withSharedSpaces: true,
      personIds: [token],
    });

    expect(hiddenPeople.people).toEqual([]);
    expect(hiddenFilters.people).toEqual([]);
    expect(hiddenMetadata.assets.items).toEqual([]);
    expect(JSON.stringify({ hiddenPeople, hiddenFilters, hiddenMetadata })).not.toContain('Library Source');
  });

  it('excludes linked-library space people from global discovery when the member hides the space from timeline', async () => {
    const fx = await createLinkedLibraryIdentityFixture({ city: 'Zurich' });
    const auth = authFor(fx.member);
    const token = `space-person:${fx.spacePerson.id}`;
    await fx.sharedSpaceService.updateMemberTimeline(auth, fx.space.id, { showInTimeline: false });

    const people = await fx.personService.getAll(auth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const search = await fx.searchService.searchPerson(auth, { name: 'Library', withSharedSpaces: true });
    const filters = await fx.searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
    const cities = await fx.searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [token],
    });

    expect(people.people).toEqual([]);
    expect(search).toEqual([]);
    expect(filters.people).toEqual([]);
    expect(cities).toEqual([]);
    expect(JSON.stringify({ people, search, filters, cities })).not.toContain('Library Source');
  });

  it('links a post-join private upload to a linked-library space identity and preserves owned access after leave', async () => {
    const fx = await createLinkedLibraryIdentityFixture({ personName: 'Library Source' });
    const embeddingRow = await fx.ctx.database
      .selectFrom('face_search')
      .select('embedding')
      .where('faceId', '=', fx.face.faceId)
      .executeTakeFirstOrThrow();

    const { asset } = await fx.ctx.newAsset({ ownerId: fx.member.id, visibility: AssetVisibility.Timeline });
    const { result: uploadedFaceId } = await fx.ctx.newAssetFace({ assetId: asset.id });
    await fx.ctx.database
      .insertInto('face_search')
      .values({ faceId: uploadedFaceId, embedding: embeddingRow.embedding })
      .execute();

    await fx.personService.handleRecognizeFaces({ id: uploadedFaceId });

    const uploadedPerson = await fx.ctx.database
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select(['person.id', 'person.identityId'])
      .where('asset_face.id', '=', uploadedFaceId)
      .executeTakeFirstOrThrow();
    const withSpace = await fx.personService.getAll(authFor(fx.member), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(withSpace.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: uploadedPerson.id },
        numberOfAssets: 2,
      }),
    ]);

    await fx.ctx.database
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', fx.space.id)
      .where('userId', '=', fx.member.id)
      .execute();

    const afterLeave = await fx.personService.getAll(authFor(fx.member), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(afterLeave.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: uploadedPerson.id },
        numberOfAssets: 1,
      }),
    ]);
    expect(JSON.stringify(afterLeave)).not.toContain(fx.spacePerson.id);
  });

  it('reconciles a late member local person against linked-library space evidence', async () => {
    const fx = await createLinkedLibraryIdentityFixture({ memberInitiallyJoined: false });
    const embeddingRow = await fx.ctx.database
      .selectFrom('face_search')
      .select('embedding')
      .where('faceId', '=', fx.face.faceId)
      .executeTakeFirstOrThrow();

    const { result: memberPerson } = await fx.ctx.newPerson({
      ownerId: fx.member.id,
      name: 'Member Private Name',
    });
    const { asset: memberAsset } = await fx.ctx.newAsset({
      ownerId: fx.member.id,
      visibility: AssetVisibility.Timeline,
    });
    const { result: memberFace } = await fx.ctx.newAssetFace({ assetId: memberAsset.id, personId: memberPerson.id });
    await fx.ctx.database
      .insertInto('face_search')
      .values({ faceId: memberFace, embedding: embeddingRow.embedding })
      .execute();
    const memberIdentity = await fx.faceIdentityRepository.ensurePersonIdentity(memberPerson.id);
    await fx.faceIdentityRepository.linkFace({
      assetFaceId: memberFace,
      identityId: memberIdentity.id,
      source: 'owner-person',
    });

    await fx.sharedSpaceService.addMember(authFor(fx.source), fx.space.id, {
      userId: fx.member.id,
      role: SharedSpaceRole.Viewer,
    });
    await fx.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fx.space.id,
      userId: fx.member.id,
    });

    const result = await fx.personService.getAll(authFor(fx.member), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: memberPerson.id },
        numberOfAssets: 2,
      }),
    ]);
  });

  it('does not expose raw face identity ids in people responses', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.userInBothSpaces }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(JSON.stringify(result)).not.toContain(fx.aliceIdentityId);
    expect(JSON.stringify(result)).not.toContain('identityId');
  });

  it('does not use admin status to bypass shared-space timeline membership', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.adminNonMember }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result.people).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain(fx.space1Alice.spacePerson.id);
  });

  it('excludes shared spaces hidden from the viewer timeline', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.userInBothSpaces }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(JSON.stringify(result)).not.toContain('Hidden Timeline Name');
    expect(JSON.stringify(result)).not.toContain(fx.hiddenTimelineSpace.id);
    expect(JSON.stringify(result)).not.toContain(fx.hiddenTimelineAlice.asset.id);
  });

  it('returns no shared people for non-members', async () => {
    const fx = await setupPeopleIdentityMatrix();

    const result = await fx.sut.getAll(factory.auth({ user: fx.nonMember }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result).toEqual({ people: [], total: 0, hidden: 0, hasNextPage: false });
  });

  it('does not leak inherited space metadata through global discovery endpoints to non-members or admins', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut: searchService } = setupSearch();
    const inaccessibleToken = `space-person:${fx.space1Alice.spacePerson.id}`;

    for (const user of [fx.nonMember, fx.adminNonMember]) {
      const auth = authFor(user);
      const people = await fx.sut.getAll(auth, {
        withHidden: true,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any);
      const search = await searchService.searchPerson(auth, { name: 'Alice', withSharedSpaces: true });
      const filters = await searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
      const scopedCities = await searchService.getSearchSuggestions(auth, {
        type: SearchSuggestionType.CITY,
        withSharedSpaces: true,
        personIds: [inaccessibleToken],
      });
      const serialized = JSON.stringify({ people, search, filters, scopedCities });

      expect(people.people).toEqual([]);
      expect(search).toEqual([]);
      expect(filters.people).toEqual([]);
      expect(scopedCities).toEqual([]);
      expect(serialized).not.toContain('Alice Source');
      expect(serialized).not.toContain(fx.space1.id);
      expect(serialized).not.toContain(fx.space1Alice.spacePerson.id);
      expect(serialized).not.toContain(fx.aliceIdentityId);
    }
  });

  it('excludes timeline-disabled spaces from all global discovery endpoints', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut: searchService } = setupSearch();
    const auth = authFor(fx.userInBothSpaces);
    const hiddenToken = `space-person:${fx.hiddenTimelineAlice.spacePerson.id}`;

    const people = await fx.sut.getAll(auth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const search = await searchService.searchPerson(auth, { name: 'Hidden Timeline Name', withSharedSpaces: true });
    const filters = await searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
    const scopedCities = await searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [hiddenToken],
    });
    const serialized = JSON.stringify({ people, search, filters, scopedCities });

    expect(search).toEqual([]);
    expect(scopedCities).toEqual([]);
    expect(serialized).not.toContain('Hidden Timeline Name');
    expect(serialized).not.toContain(fx.hiddenTimelineSpace.id);
    expect(serialized).not.toContain(fx.hiddenTimelineAlice.spacePerson.id);
    expect(filters.people).not.toContainEqual(
      expect.objectContaining({ id: `space-person:${fx.hiddenTimelineAlice.spacePerson.id}` }),
    );
  });

  it('stops exposing inherited space people in global discovery after member removal', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const face = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      personName: 'Removed Member Source',
      spaceId: space.id,
    });
    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });

    const beforeRemoval = await sut.getAll(authFor(member), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(beforeRemoval.people).toEqual([
      expect.objectContaining({
        name: 'Removed Member Source',
        primaryProfile: expect.objectContaining({ type: 'space-person', spaceId: space.id }),
      }),
    ]);

    await sharedSpaceService.removeMember(authFor(owner), space.id, member.id);

    const afterRemoval = await sut.getAll(authFor(member), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(afterRemoval).toEqual({ people: [], total: 0, hidden: 0, hasNextPage: false });
  });

  it('materializes one photo by face identity independently across ten face-recognition spaces during full rebuilds', async () => {
    const { ctx, sut: sharedSpaceService, faceIdentityRepository, jobs } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Ten Space Source' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    await ctx.database.insertInto('face_search').values({ faceId, embedding: newEmbedding() }).execute();
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const staleIdentity = await ctx.database
      .insertInto('face_identity')
      .values({ type: 'person' })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .updateTable('person')
      .set({ identityId: staleIdentity.id })
      .where('id', '=', person.id)
      .execute();

    const spaces = [];
    for (let index = 0; index < 10; index++) {
      const { space } = await ctx.newSharedSpace({
        createdById: owner.id,
        faceRecognitionEnabled: true,
        name: `Space ${index}`,
      });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
      spaces.push(space);
    }

    for (const space of spaces) {
      await sharedSpaceService.handleSharedSpaceFaceMatchAll({ spaceId: space.id });
    }

    await drainSharedSpaceFaceJobs(sharedSpaceService, jobs);

    const faceRows = await ctx.database
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .select([
        'shared_space_person.id as personId',
        'shared_space_person.spaceId as spaceId',
        'shared_space_person.identityId as identityId',
      ])
      .where('shared_space_person_face.assetFaceId', '=', faceId)
      .execute();

    expect(faceRows).toHaveLength(10);
    expect(new Set(faceRows.map((row) => row.spaceId))).toEqual(new Set(spaces.map((space) => space.id)));
    expect(new Set(faceRows.map((row) => row.personId)).size).toBe(10);
    expect(faceRows).toEqual(
      expect.arrayContaining(
        spaces.map((space) => expect.objectContaining({ spaceId: space.id, identityId: identity.id })),
      ),
    );
  });

  it('inherits an owner name into a space person and updates global people for later invitees after owner rename', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: invitee } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    const face = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      personName: 'Source Person',
      spaceId: space.id,
    });

    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: invitee.id, role: SharedSpaceRole.Viewer });

    const beforeRename = await sut.getAll(factory.auth({ user: invitee }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(beforeRename.people).toEqual([
      expect.objectContaining({
        name: 'Source Person',
        primaryProfile: expect.objectContaining({ type: 'space-person', spaceId: space.id }),
      }),
    ]);

    await sut.update(factory.auth({ user: owner }), face.person.id, { name: 'Renamed Source Person' });
    await sharedSpaceService.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const afterRename = await sut.getAll(factory.auth({ user: invitee }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(afterRename.people).toEqual([
      expect.objectContaining({
        name: 'Renamed Source Person',
        primaryProfile: expect.objectContaining({ type: 'space-person', spaceId: space.id }),
      }),
    ]);
  });

  it('keeps a private member name separate from an inherited space name until identities are linked', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: invitee } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    const ownerFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      personName: 'Owner Name',
      spaceId: space.id,
    });
    const inviteeFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: invitee.id,
      personName: 'Invitee Private Name',
    });
    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: ownerFace.asset.id });

    const beforeInvite = await sut.getAll(factory.auth({ user: invitee }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(beforeInvite.people).toEqual([
      expect.objectContaining({
        id: inviteeFace.person.id,
        name: 'Invitee Private Name',
        primaryProfile: { type: 'user-person', id: inviteeFace.person.id },
      }),
    ]);
    expect(JSON.stringify(beforeInvite)).not.toContain('Owner Name');

    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: invitee.id, role: SharedSpaceRole.Viewer });

    const afterInvite = await sut.getAll(factory.auth({ user: invitee }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(afterInvite.people).toHaveLength(2);
    expect(afterInvite.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: inviteeFace.person.id,
          name: 'Invitee Private Name',
          primaryProfile: { type: 'user-person', id: inviteeFace.person.id },
        }),
        expect.objectContaining({
          name: 'Owner Name',
          primaryProfile: expect.objectContaining({ type: 'space-person', spaceId: space.id }),
        }),
      ]),
    );
  });

  it('join-after-duplicates reconciles strict local and space identities', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });

    const people = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(people.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    );
  });

  it('shows a late member the accessible space person without creating a local profile', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();
    const { ctx, personService, sharedSpaceService, space } = fixture;
    const { user: lateMember } = await ctx.newUser();

    await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
      userId: lateMember.id,
      role: SharedSpaceRole.Viewer,
    });
    await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id, userId: lateMember.id });

    const result = await personService.getAll(authFor(lateMember), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const localRows = await ctx.database
      .selectFrom('person')
      .select('id')
      .where('ownerId', '=', lateMember.id)
      .execute();

    expect(localRows).toEqual([]);
    expect(result.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'space-person', id: fixture.spacePerson.id, spaceId: space.id },
        numberOfAssets: 1,
      }),
    ]);
  });

  it('links a post-join private upload with no prior local profile without changing existing members', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();
    const { ctx, personService, sharedSpaceService, faceIdentityRepository, space } = fixture;
    const { user: uploader } = await ctx.newUser();
    const embeddingRow = await ctx.database
      .selectFrom('face_search')
      .select('embedding')
      .where('faceId', '=', fixture.spacePerson.representativeFaceId as string)
      .executeTakeFirstOrThrow();

    await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id, userId: fixture.member.id });
    await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
      userId: uploader.id,
      role: SharedSpaceRole.Viewer,
    });

    const { asset } = await ctx.newAsset({ ownerId: uploader.id, visibility: AssetVisibility.Timeline });
    const { result: uploadedFaceId } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.database
      .insertInto('face_search')
      .values({ faceId: uploadedFaceId, embedding: embeddingRow.embedding })
      .execute();

    await personService.handleRecognizeFaces({ id: uploadedFaceId });

    const uploadedPerson = await ctx.database
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select(['person.id', 'person.identityId'])
      .where('asset_face.id', '=', uploadedFaceId)
      .executeTakeFirstOrThrow();
    const uploaderPeople = await personService.getAll(authFor(uploader), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const ownerPeople = await personService.getAll(authFor(fixture.owner), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const memberPeople = await personService.getAll(authFor(fixture.member), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const targetIdentity = await faceIdentityRepository.ensurePersonIdentity(fixture.ownerPerson.id);

    expect(uploaderPeople.people).toHaveLength(1);
    expect(uploaderPeople.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: uploadedPerson.id },
        numberOfAssets: 2,
      }),
    );
    expect(ownerPeople.people).toEqual([
      expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.ownerPerson.id } }),
    ]);
    expect(memberPeople.people).toEqual([
      expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.memberPerson.id } }),
    ]);
    expect(uploadedPerson.identityId).toBe(targetIdentity.id);
  });

  it('keeps one visible person when a post-join upload is added to the space', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();
    const { ctx, personService, sharedSpaceService, space } = fixture;
    const { user: uploader } = await ctx.newUser();
    const embeddingRow = await ctx.database
      .selectFrom('face_search')
      .select('embedding')
      .where('faceId', '=', fixture.spacePerson.representativeFaceId as string)
      .executeTakeFirstOrThrow();

    await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
      userId: uploader.id,
      role: SharedSpaceRole.Viewer,
    });

    const { asset } = await ctx.newAsset({ ownerId: uploader.id, visibility: AssetVisibility.Timeline });
    const { result: uploadedFaceId } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.database
      .insertInto('face_search')
      .values({ faceId: uploadedFaceId, embedding: embeddingRow.embedding })
      .execute();

    await personService.handleRecognizeFaces({ id: uploadedFaceId });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: uploader.id });
    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: asset.id });
    await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id });

    const uploaderPeople = await personService.getAll(authFor(uploader), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const spacePeople = await sharedSpaceService.getSpacePeople(authFor(uploader), space.id);

    expect(uploaderPeople.people).toHaveLength(1);
    expect(spacePeople).toHaveLength(1);
    expect(spacePeople[0]).toEqual(expect.objectContaining({ id: fixture.spacePerson.id }));
  });

  it('late member join materializes missing space people before reconciling strict local identity', async () => {
    const { ctx, sut: personService, faceIdentityRepository } = setup();
    const { sut: sharedSpaceService, jobs: sharedJobs } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: existingMember } = await ctx.newUser();
    const { user: lateMember } = await ctx.newUser();
    const embedding = newEmbedding();

    const { result: ownerPerson } = await ctx.newPerson({ ownerId: owner.id, name: 'Owner Shared Name' });
    const { asset: spaceAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    const { result: ownerFace } = await ctx.newAssetFace({ assetId: spaceAsset.id, personId: ownerPerson.id });
    await ctx.database.insertInto('face_search').values({ faceId: ownerFace, embedding }).execute();
    const ownerIdentity = await faceIdentityRepository.ensurePersonIdentity(ownerPerson.id);
    await faceIdentityRepository.linkFace({
      assetFaceId: ownerFace,
      identityId: ownerIdentity.id,
      source: 'owner-person',
    });

    const { result: existingMemberPerson } = await ctx.newPerson({
      ownerId: existingMember.id,
      name: 'Existing Member Private Name',
    });
    const { asset: existingMemberAsset } = await ctx.newAsset({
      ownerId: existingMember.id,
      visibility: AssetVisibility.Timeline,
    });
    const { result: existingMemberFace } = await ctx.newAssetFace({
      assetId: existingMemberAsset.id,
      personId: existingMemberPerson.id,
    });
    await ctx.database.insertInto('face_search').values({ faceId: existingMemberFace, embedding }).execute();
    const existingMemberIdentity = await faceIdentityRepository.ensurePersonIdentity(existingMemberPerson.id);
    await faceIdentityRepository.linkFace({
      assetFaceId: existingMemberFace,
      identityId: existingMemberIdentity.id,
      source: 'owner-person',
    });
    await faceIdentityRepository.mergeIdentities({
      targetIdentityId: ownerIdentity.id,
      sourceIdentityIds: [existingMemberIdentity.id],
      source: 'shared-space-evidence',
    });

    const { result: lateMemberPerson } = await ctx.newPerson({
      ownerId: lateMember.id,
      name: 'Late Member Private Name',
    });
    const { asset: lateMemberAsset } = await ctx.newAsset({
      ownerId: lateMember.id,
      visibility: AssetVisibility.Timeline,
    });
    const { result: lateMemberFace } = await ctx.newAssetFace({
      assetId: lateMemberAsset.id,
      personId: lateMemberPerson.id,
    });
    await ctx.database.insertInto('face_search').values({ faceId: lateMemberFace, embedding }).execute();
    const lateMemberIdentity = await faceIdentityRepository.ensurePersonIdentity(lateMemberPerson.id);
    await faceIdentityRepository.linkFace({
      assetFaceId: lateMemberFace,
      identityId: lateMemberIdentity.id,
      source: 'owner-person',
    });

    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: existingMember.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: spaceAsset.id, addedById: owner.id });

    await expect(sharedSpaceService.getSpacePeople(authFor(owner), space.id)).resolves.toEqual([]);

    await sharedSpaceService.addMember(authFor(owner), space.id, {
      userId: lateMember.id,
      role: SharedSpaceRole.Viewer,
    });

    await expect(
      personService.getAll(authFor(owner), {
        withHidden: false,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        people: [
          expect.objectContaining({
            primaryProfile: { type: 'user-person', id: ownerPerson.id },
          }),
        ],
      }),
    );
    await expect(
      personService.getAll(authFor(existingMember), {
        withHidden: false,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        people: [
          expect.objectContaining({
            primaryProfile: { type: 'user-person', id: existingMemberPerson.id },
          }),
        ],
      }),
    );

    await drainSharedSpaceFaceJobs(sharedSpaceService, sharedJobs);

    const spacePeople = await sharedSpaceService.getSpacePeople(authFor(owner), space.id);
    expect(spacePeople).toEqual([expect.objectContaining({ name: 'Owner Shared Name' })]);

    await expect(sharedSpaceService.getSpacePeople(authFor(existingMember), space.id)).resolves.toEqual([
      expect.objectContaining({ id: spacePeople[0].id }),
    ]);
    await expect(sharedSpaceService.getSpacePeople(authFor(lateMember), space.id)).resolves.toEqual([
      expect.objectContaining({ id: spacePeople[0].id }),
    ]);

    const ownerPeople = await personService.getAll(authFor(owner), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const existingMemberPeople = await personService.getAll(authFor(existingMember), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const lateMemberPeople = await personService.getAll(authFor(lateMember), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(ownerPeople.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: ownerPerson.id },
        numberOfAssets: 1,
      }),
    ]);
    expect(existingMemberPeople.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: existingMemberPerson.id },
        numberOfAssets: 2,
      }),
    ]);
    expect(lateMemberPeople.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: lateMemberPerson.id },
        numberOfAssets: 2,
      }),
    ]);
  });

  it('new-space-evidence reconciliation links an existing member local identity', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture({ memberBeforeSpaceEvidence: true });

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      spacePersonId: fixture.spacePerson.id,
    });

    const people = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(people.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    );
  });

  it('removes shared-space assets from the accessible identity after the member leaves', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });
    await fixture.ctx.database
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', fixture.space.id)
      .where('userId', '=', fixture.member.id)
      .execute();

    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(result.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 1,
      }),
    ]);
  });

  it('handles concurrent reconciliation attempts without duplicate visible identities', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    const results = await Promise.allSettled([
      fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
        spaceId: fixture.space.id,
        userId: fixture.member.id,
      }),
      fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
        spaceId: fixture.space.id,
        userId: fixture.member.id,
      }),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

    const people = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(people.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    );
  });

  it('keeps timeline-disabled space evidence out of global people while explicit space people still resolve', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture({ showInTimeline: false });

    const globalPeople = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(globalPeople.people.some((person) => person.primaryProfile?.type === 'space-person')).toBe(false);

    const explicitSpacePeople = await fixture.sharedSpaceService.getSpacePeople(fixture.memberAuth, fixture.space.id);
    expect(explicitSpacePeople).toEqual([
      expect.objectContaining({ id: fixture.spacePerson.id, name: 'Owner Shared Name' }),
    ]);
  });

  it('does not merge or surface stale space profiles when membership is removed before reconciliation runs', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.ctx.database
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', fixture.space.id)
      .where('userId', '=', fixture.member.id)
      .execute();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });

    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 1,
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain(fixture.spacePerson.id);
  });

  it('restores identity grouping after the member rejoins the shared space', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });
    await fixture.ctx.database
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', fixture.space.id)
      .where('userId', '=', fixture.member.id)
      .execute();
    await fixture.ctx.newSharedSpaceMember({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
      role: SharedSpaceRole.Viewer,
    });

    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(result.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    );
  });

  it('restores global contribution after showInTimeline is re-enabled', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture({ showInTimeline: false });

    await setSpaceTimeline(fixture.ctx, {
      spaceId: fixture.space.id,
      userId: fixture.member.id,
      showInTimeline: true,
    });
    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });

    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(result.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    );
  });

  it('repairs missing space representative faces before global people hydration', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });
    await fixture.ctx.database
      .updateTable('shared_space_person')
      .set({ representativeFaceId: null, representativeFaceSource: 'auto' })
      .where('id', '=', fixture.spacePerson.id)
      .execute();
    await fixture.sharedSpaceService.handleSharedSpacePersonDedup({ spaceId: fixture.space.id });

    const repaired = await fixture.ctx.database
      .selectFrom('shared_space_person')
      .select(['representativeFaceId'])
      .where('id', '=', fixture.spacePerson.id)
      .executeTakeFirstOrThrow();
    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(repaired.representativeFaceId).toBe(fixture.spacePerson.representativeFaceId);
    expect(result.people).toEqual([
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 2,
      }),
    ]);
  });

  it('removes a removed shared-space asset from visible identity counts without splitting identities', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    });
    await fixture.ctx.database
      .deleteFrom('shared_space_asset')
      .where('spaceId', '=', fixture.space.id)
      .where('assetId', '=', fixture.spaceAsset.id)
      .execute();

    const result = await fixture.personService.getAll(fixture.memberAuth, {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const filters = await fixture.searchService.getFilterSuggestions(fixture.memberAuth, { withSharedSpaces: true });
    expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
    expect(result.people[0]).toEqual(
      expect.objectContaining({
        primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
        numberOfAssets: 1,
      }),
    );
    expect(filters.people).not.toContainEqual(
      expect.objectContaining({ id: `space-person:${fixture.spacePerson.id}` }),
    );
  });

  it('does not surface a stale space person after its backing face is removed', async () => {
    const fixture = await setupJoinAfterDuplicatesFixture();

    await fixture.ctx.database
      .deleteFrom('shared_space_person_face')
      .where('personId', '=', fixture.spacePerson.id)
      .execute();

    try {
      const result = await fixture.personService.getAll(fixture.memberAuth, {
        withHidden: false,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any);
      const filters = await fixture.searchService.getFilterSuggestions(fixture.memberAuth, { withSharedSpaces: true });

      expect(result.people.some((person) => person.primaryProfile?.id === fixture.spacePerson.id)).toBe(false);
      expect(filters.people).not.toContainEqual(
        expect.objectContaining({ id: `space-person:${fixture.spacePerson.id}` }),
      );
    } finally {
      await fixture.ctx.database
        .insertInto('shared_space_person_face')
        .values({
          personId: fixture.spacePerson.id,
          assetFaceId: fixture.spacePerson.representativeFaceId as string,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  });

  it('prefers the viewer personal name in global people after a shared identity is linked', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: invitee } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: invitee.id, role: SharedSpaceRole.Viewer });
    const ownerFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      personName: 'Owner Name',
      spaceId: space.id,
    });
    const inviteeFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: invitee.id,
      personName: 'Invitee Private Name',
    });
    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: ownerFace.asset.id });
    await faceIdentityRepository.mergeIdentities({
      targetIdentityId: inviteeFace.identity.id,
      sourceIdentityIds: [ownerFace.identity.id],
      source: 'manual',
    });

    const result = await sut.getAll(factory.auth({ user: invitee }), {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);

    expect(result.people).toEqual([
      expect.objectContaining({
        id: inviteeFace.person.id,
        name: 'Invitee Private Name',
        primaryProfile: { type: 'user-person', id: inviteeFace.person.id },
        filterId: `person:${inviteeFace.person.id}`,
      }),
    ]);
  });

  it('returns identity-grouped scoped person tokens in global filter suggestions', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut } = setupSearch();

    const result = await sut.getFilterSuggestions(factory.auth({ user: fx.space1OnlyMember }), {
      withSharedSpaces: true,
    });
    const serialized = JSON.stringify(result);

    expect(result.people).toEqual([
      {
        id: `space-person:${fx.space1Alice.spacePerson.id}`,
        name: 'Alice Source',
        primaryProfile: { type: 'space-person', id: fx.space1Alice.spacePerson.id, spaceId: fx.space1.id },
      },
    ]);
    expect(serialized).not.toContain(fx.aliceIdentityId);
    expect(serialized).not.toContain('identityId');
    expect(serialized).not.toContain('Space 2 Private Name');
    expect(serialized).not.toContain(fx.space2Alice.spacePerson.id);
  });

  it('uses a named accessible space profile for display while keeping a viewer-owned filter token', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: '' });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Shared Name',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();

    try {
      const result = await sut.getFilterSuggestions(factory.auth({ user }), { withSharedSpaces: true });

      expect(result.people).toEqual([
        {
          id: `person:${person.id}`,
          name: 'Shared Name',
          primaryProfile: { type: 'user-person', id: person.id },
        },
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

  it('uses a named accessible space profile in album filter suggestions', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: '' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { album } = await ctx.newAlbum({ ownerId: member.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Space Album Person',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();

    try {
      const result = await sut.getFilterSuggestions(factory.auth({ user: member }), { albumId: album.id });

      expect(result.people).toEqual([
        {
          id: `space-person:${spacePerson.id}`,
          name: 'Space Album Person',
          primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
        },
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

  it('uses a named linked-library space profile in album filter suggestions', async () => {
    const fx = await createLinkedLibraryIdentityFixture();
    const { album } = await fx.ctx.newAlbum({ ownerId: fx.member.id });
    await fx.ctx.newAlbumAsset({ albumId: album.id, assetId: fx.face.asset.id });

    const result = await fx.searchService.getFilterSuggestions(authFor(fx.member), { albumId: album.id });

    expect(result.people).toEqual([
      {
        id: `space-person:${fx.spacePerson.id}`,
        name: 'Library Source',
        primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
      },
    ]);
  });

  it('hydrates global people, space people, filters, search, and album scope after legacy identity backfill', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: searchService } = setupSearch();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { person } = await ctx.newPerson({ ownerId: owner.id, name: '' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await addCity(ctx, asset.id, 'Lisbon');
    await ctx.database
      .updateTable('asset_exif')
      .set({ latitude: 38.7223, longitude: -9.1393 })
      .where('assetId', '=', asset.id)
      .execute();
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { album } = await ctx.newAlbum({ ownerId: member.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        name: 'Backfilled Space Person',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
      .execute();

    await expect(faceIdentityRepository.hasBackfillWork()).resolves.toBe(true);
    await faceIdentityRepository.backfillPersonalIdentities({ limit: 100 });
    await faceIdentityRepository.backfillSpacePersonIdentities({ limit: 100 });
    await expect(faceIdentityRepository.hasBackfillWork()).resolves.toBe(false);

    const auth = authFor(member);
    const token = `space-person:${spacePerson.id}`;
    const globalPeople = await sut.getAll(auth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const spacePeople = await sharedSpaceService.getSpacePeople(auth, space.id);
    const globalFilters = await searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
    const globalPeopleSearch = await searchService.searchPerson(auth, {
      name: 'Backfilled',
      withSharedSpaces: true,
    });
    const globalCities = await searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [token],
    });
    const globalAssets = await searchService.searchMetadata(auth, { withSharedSpaces: true, personIds: [token] });
    const globalMapMarkers = await sharedSpaceService.getFilteredMapMarkers(auth, {
      withSharedSpaces: true,
      personIds: [token],
    });
    const spaceMapMarkers = await sharedSpaceService.getFilteredMapMarkers(auth, {
      spaceId: space.id,
      personIds: [spacePerson.id],
    });
    const albumFilters = await searchService.getFilterSuggestions(auth, { albumId: album.id });
    const albumCities = await searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [token],
    });
    const albumAssets = await searchService.searchMetadata(auth, { albumIds: [album.id], personIds: [token] });

    expect(globalPeople.people).toEqual([
      expect.objectContaining({
        id: spacePerson.id,
        name: 'Backfilled Space Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
        filterId: token,
        numberOfAssets: 1,
      }),
    ]);
    expect(spacePeople).toEqual([
      expect.objectContaining({ id: spacePerson.id, name: 'Backfilled Space Person', thumbnailPath: '' }),
    ]);
    expect(globalFilters.people).toEqual([
      {
        id: token,
        name: 'Backfilled Space Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(globalPeopleSearch).toEqual([
      expect.objectContaining({
        id: spacePerson.id,
        name: 'Backfilled Space Person',
        filterId: token,
      }),
    ]);
    expect(globalCities).toEqual(['Lisbon']);
    expect(globalAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
    expect(globalMapMarkers).toEqual([
      expect.objectContaining({ id: asset.id, lat: 38.7223, lon: -9.1393, city: 'Lisbon' }),
    ]);
    expect(spaceMapMarkers).toEqual([
      expect.objectContaining({ id: asset.id, lat: 38.7223, lon: -9.1393, city: 'Lisbon' }),
    ]);
    expect(albumFilters.people).toEqual([
      {
        id: token,
        name: 'Backfilled Space Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(albumCities).toEqual(['Lisbon']);
    expect(albumAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
  });

  it('hydrates linked-library people, filters, search, map, and album scope after legacy identity backfill', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { sut: searchService } = setupSearch();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { user: nonMember } = await ctx.newUser();
    const { library } = await ctx.newLibrary({ ownerId: owner.id });
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });
    const { person } = await ctx.newPerson({ ownerId: owner.id, name: '' });
    const { asset } = await ctx.newAsset({
      ownerId: owner.id,
      libraryId: library.id,
      visibility: AssetVisibility.Timeline,
    });
    await addCity(ctx, asset.id, 'Basel');
    await ctx.database
      .updateTable('asset_exif')
      .set({ latitude: 47.5596, longitude: 7.5886 })
      .where('assetId', '=', asset.id)
      .execute();
    const { album } = await ctx.newAlbum({ ownerId: member.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        name: 'Legacy Library Person',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
      .execute();

    await expect(faceIdentityRepository.hasBackfillWork()).resolves.toBe(true);
    await faceIdentityRepository.backfillPersonalIdentities({ limit: 100 });
    await faceIdentityRepository.backfillSpacePersonIdentities({ limit: 100 });
    await expect(faceIdentityRepository.hasBackfillWork()).resolves.toBe(false);

    const auth = authFor(member);
    const token = `space-person:${spacePerson.id}`;
    const globalPeople = await sut.getAll(auth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const spacePeople = await sharedSpaceService.getSpacePeople(auth, space.id);
    const globalFilters = await searchService.getFilterSuggestions(auth, { withSharedSpaces: true });
    const globalPeopleSearch = await searchService.searchPerson(auth, {
      name: 'Legacy Library',
      withSharedSpaces: true,
    });
    const globalAssets = await searchService.searchMetadata(auth, { withSharedSpaces: true, personIds: [token] });
    const globalMapMarkers = await sharedSpaceService.getFilteredMapMarkers(auth, {
      withSharedSpaces: true,
      personIds: [token],
    });
    const spaceMapMarkers = await sharedSpaceService.getFilteredMapMarkers(auth, {
      spaceId: space.id,
      personIds: [spacePerson.id],
    });
    const albumFilters = await searchService.getFilterSuggestions(auth, { albumId: album.id });
    const albumAssets = await searchService.searchMetadata(auth, { albumIds: [album.id], personIds: [token] });

    expect(globalPeople.people).toEqual([
      expect.objectContaining({
        id: spacePerson.id,
        name: 'Legacy Library Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
        filterId: token,
        numberOfAssets: 1,
      }),
    ]);
    expect(spacePeople).toEqual([
      expect.objectContaining({ id: spacePerson.id, name: 'Legacy Library Person', thumbnailPath: '' }),
    ]);
    expect(globalFilters.people).toEqual([
      {
        id: token,
        name: 'Legacy Library Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(globalPeopleSearch).toEqual([
      expect.objectContaining({
        id: spacePerson.id,
        name: 'Legacy Library Person',
        filterId: token,
      }),
    ]);
    expect(globalAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
    expect(globalMapMarkers).toEqual([
      expect.objectContaining({ id: asset.id, lat: 47.5596, lon: 7.5886, city: 'Basel' }),
    ]);
    expect(spaceMapMarkers).toEqual([
      expect.objectContaining({ id: asset.id, lat: 47.5596, lon: 7.5886, city: 'Basel' }),
    ]);
    expect(albumFilters.people).toEqual([
      {
        id: token,
        name: 'Legacy Library Person',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(albumAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);

    const nonMemberAuth = authFor(nonMember);
    const hiddenPeople = await sut.getAll(nonMemberAuth, {
      withHidden: true,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any);
    const hiddenFilters = await searchService.getFilterSuggestions(nonMemberAuth, { withSharedSpaces: true });
    const hiddenAssets = await searchService.searchMetadata(nonMemberAuth, {
      withSharedSpaces: true,
      personIds: [token],
    });

    expect(hiddenPeople.people).toEqual([]);
    expect(hiddenFilters.people).toEqual([]);
    expect(hiddenAssets.assets.items).toEqual([]);
    expect(JSON.stringify({ hiddenPeople, hiddenFilters, hiddenAssets })).not.toContain('Legacy Library Person');
  });

  it('timeline opt-in: album scope excludes direct space people and assets while the space is hidden from timeline', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Space Album Name' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await addCity(ctx, asset.id, 'Hamburg');
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { album } = await ctx.newAlbum({ ownerId: member.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Space Album Name',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();

    const auth = authFor(member);
    await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

    const albumFiltersHidden = await sut.getFilterSuggestions(auth, { albumId: album.id });
    const albumCitiesHidden = await sut.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [`space-person:${spacePerson.id}`],
    });
    const albumAssetsHidden = await sut.searchMetadata(auth, { albumIds: [album.id] });
    const albumStatsHidden = await sut.searchStatistics(auth, { albumIds: [album.id] });
    const albumRandomHidden = await sut.searchRandom(auth, { albumIds: [album.id], size: 10 });
    const albumLargeHidden = await sut.searchLargeAssets(auth, { albumIds: [album.id], minFileSize: 1 });
    const explicitSpaceFilters = await sut.getFilterSuggestions(auth, { spaceId: space.id });
    const explicitSpaceAssets = await sut.searchMetadata(auth, { spaceId: space.id });

    expect(albumFiltersHidden.people).toEqual([]);
    expect(albumCitiesHidden).toEqual([]);
    expect(albumAssetsHidden.assets.items).toEqual([]);
    expect(albumStatsHidden.total).toBe(0);
    expect(albumRandomHidden).toEqual([]);
    expect(albumLargeHidden).toEqual([]);
    expect(JSON.stringify({ albumFiltersHidden, albumCitiesHidden, albumAssetsHidden })).not.toContain(
      'Space Album Name',
    );
    expect(explicitSpaceFilters.people).toEqual([
      {
        id: spacePerson.id,
        name: 'Space Album Name',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(explicitSpaceAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);

    await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });

    const albumFiltersVisible = await sut.getFilterSuggestions(auth, { albumId: album.id });
    const albumCitiesVisible = await sut.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [`space-person:${spacePerson.id}`],
    });
    const albumAssetsVisible = await sut.searchMetadata(auth, { albumIds: [album.id] });
    const albumStatsVisible = await sut.searchStatistics(auth, { albumIds: [album.id] });
    const albumRandomVisible = await sut.searchRandom(auth, { albumIds: [album.id], size: 10 });
    const albumLargeVisible = await sut.searchLargeAssets(auth, { albumIds: [album.id], minFileSize: 1 });

    expect(albumFiltersVisible.people).toEqual([
      {
        id: `space-person:${spacePerson.id}`,
        name: 'Space Album Name',
        primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
      },
    ]);
    expect(albumCitiesVisible).toEqual(['Hamburg']);
    expect(albumAssetsVisible.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
    expect(albumStatsVisible.total).toBe(1);
    expect(albumRandomVisible).toEqual([expect.objectContaining({ id: asset.id })]);
    expect(albumLargeVisible).toEqual([expect.objectContaining({ id: asset.id })]);
  });

  it('timeline opt-in: album scope excludes linked-library people and assets while the space is hidden from timeline', async () => {
    const fx = await createLinkedLibraryIdentityFixture({ city: 'Zurich' });
    const { album } = await fx.ctx.newAlbum({ ownerId: fx.member.id });
    await fx.ctx.newAlbumAsset({ albumId: album.id, assetId: fx.face.asset.id });
    const auth = authFor(fx.member);
    const token = `space-person:${fx.spacePerson.id}`;

    await fx.sharedSpaceService.updateMemberTimeline(auth, fx.space.id, { showInTimeline: false });

    const filtersHidden = await fx.searchService.getFilterSuggestions(auth, { albumId: album.id });
    const citiesHidden = await fx.searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [token],
    });
    const assetsHidden = await fx.searchService.searchMetadata(auth, { albumIds: [album.id] });
    const statsHidden = await fx.searchService.searchStatistics(auth, { albumIds: [album.id] });
    const explicitSpaceAssets = await fx.searchService.searchMetadata(auth, { spaceId: fx.space.id });

    expect(filtersHidden.people).toEqual([]);
    expect(citiesHidden).toEqual([]);
    expect(assetsHidden.assets.items).toEqual([]);
    expect(statsHidden.total).toBe(0);
    expect(JSON.stringify({ filtersHidden, citiesHidden, assetsHidden })).not.toContain('Library Source');
    expect(explicitSpaceAssets.assets.items).toEqual([expect.objectContaining({ id: fx.face.asset.id })]);

    await fx.sharedSpaceService.updateMemberTimeline(auth, fx.space.id, { showInTimeline: true });

    const filtersVisible = await fx.searchService.getFilterSuggestions(auth, { albumId: album.id });
    const citiesVisible = await fx.searchService.getSearchSuggestions(auth, {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [token],
    });
    const assetsVisible = await fx.searchService.searchMetadata(auth, { albumIds: [album.id] });
    const statsVisible = await fx.searchService.searchStatistics(auth, { albumIds: [album.id] });

    expect(filtersVisible.people).toEqual([
      {
        id: token,
        name: 'Library Source',
        primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
      },
    ]);
    expect(citiesVisible).toEqual(['Zurich']);
    expect(assetsVisible.assets.items).toEqual([expect.objectContaining({ id: fx.face.asset.id })]);
    expect(statsVisible.total).toBe(1);
  });

  it('timeline opt-in: album scoped stale space-person token cannot broaden results from a hidden space', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Hidden Token Name' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await addCity(ctx, asset.id, 'Cologne');
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { album } = await ctx.newAlbum({ ownerId: member.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Hidden Token Name',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();
    await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

    const hidden = await sut.searchMetadata(authFor(member), {
      albumIds: [album.id],
      personIds: [`space-person:${spacePerson.id}`],
    });
    const cities = await sut.getSearchSuggestions(authFor(member), {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
      personIds: [`space-person:${spacePerson.id}`],
    });

    expect(hidden.assets.items).toEqual([]);
    expect(cities).toEqual([]);
  });

  it('timeline opt-in: album sharing does not re-share a shared-space-only person to a non-member', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user: owner } = await ctx.newUser();
    const { user: spaceMember } = await ctx.newUser();
    const { user: albumViewer } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: spaceMember.id, role: SharedSpaceRole.Viewer });
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'No Reshare Name' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await addCity(ctx, asset.id, 'Munich');
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { album } = await ctx.newAlbum({ ownerId: spaceMember.id });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await ctx.newAlbumUser({ albumId: album.id, userId: albumViewer.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'No Reshare Name',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();

    const filters = await sut.getFilterSuggestions(authFor(albumViewer), { albumId: album.id });
    const metadata = await sut.searchMetadata(authFor(albumViewer), { albumIds: [album.id] });
    const cities = await sut.getSearchSuggestions(authFor(albumViewer), {
      type: SearchSuggestionType.CITY,
      albumId: album.id,
    });

    expect(filters.people).toEqual([]);
    expect(metadata.assets.items).toEqual([]);
    expect(cities).toEqual([]);
    expect(JSON.stringify({ filters, metadata, cities })).not.toContain('No Reshare Name');
  });

  it('timeline opt-in: disabling a space is per viewer and does not hide it for another member', async () => {
    const { ctx, sut } = setupSearch();
    const faceIdentityRepository = ctx.get(FaceIdentityRepository);
    const { user: owner } = await ctx.newUser();
    const { user: hiddenMember } = await ctx.newUser();
    const { user: visibleMember } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: hiddenMember.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: visibleMember.id, role: SharedSpaceRole.Viewer });
    const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Viewer Scoped Name' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
    const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
    await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Viewer Scoped Name',
        representativeFaceId: faceId,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: faceId })
      .execute();
    await setSpaceTimeline(ctx, { spaceId: space.id, userId: hiddenMember.id, showInTimeline: false });

    const hidden = await sut.searchPerson(authFor(hiddenMember), { name: 'Viewer', withSharedSpaces: true });
    const visible = await sut.searchPerson(authFor(visibleMember), { name: 'Viewer', withSharedSpaces: true });

    expect(hidden).toEqual([]);
    expect(visible).toHaveLength(1);
  });

  it('timeline opt-in: a viewer-owned identity token does not pull matching photos from a hidden space', async () => {
    const { ctx, faceIdentityRepository } = setup();
    const { sut: searchService } = setupSearch();
    const { sut: sharedSpaceService } = setupSharedSpace();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const ownerFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      personName: 'Owner John',
      spaceId: space.id,
    });
    const memberFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
      ownerId: member.id,
      personName: 'Member John',
    });
    await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: ownerFace.asset.id });
    await faceIdentityRepository.mergeIdentities({
      targetIdentityId: memberFace.identity.id,
      sourceIdentityIds: [ownerFace.identity.id],
      source: 'manual',
    });
    const auth = authFor(member);
    await sharedSpaceService.updateMemberTimeline(auth, space.id, { showInTimeline: false });

    const filtered = await searchService.searchMetadata(auth, {
      withSharedSpaces: true,
      personIds: [`person:${memberFace.person.id}`],
    });

    expect(filtered.assets.items).toEqual([expect.objectContaining({ id: memberFace.asset.id })]);
    expect(filtered.assets.items.map((asset) => asset.id)).not.toContain(ownerFace.asset.id);
  });

  it('filters global search suggestions by resolved identity across accessible spaces', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut } = setupSearch();

    const result = await sut.getSearchSuggestions(factory.auth({ user: fx.userInBothSpaces }), {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [`space-person:${fx.space1Alice.spacePerson.id}`],
    });

    expect(result.toSorted()).toEqual(['Berlin', 'Paris']);
  });

  it('does not broaden filters when a scoped space person token is inaccessible', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut } = setupSearch();

    const cities = await sut.getSearchSuggestions(factory.auth({ user: fx.space1OnlyMember }), {
      type: SearchSuggestionType.CITY,
      withSharedSpaces: true,
      personIds: [`space-person:${fx.space2Alice.spacePerson.id}`],
    });
    const filters = await sut.getFilterSuggestions(factory.auth({ user: fx.space1OnlyMember }), {
      withSharedSpaces: true,
      personIds: [`space-person:${fx.space2Alice.spacePerson.id}`],
    });

    expect(cities).toEqual([]);
    expect(filters.people).toEqual([]);
    expect(JSON.stringify(filters)).not.toContain('Space 2 Private Name');
    expect(JSON.stringify(filters)).not.toContain(fx.aliceIdentityId);
  });

  it('searches only accessible identity-grouped people names', async () => {
    const fx = await setupPeopleIdentityMatrix();
    const { sut } = setupSearch();

    const inBoth = await sut.searchPerson(factory.auth({ user: fx.userInBothSpaces }), {
      name: 'Alice',
      withSharedSpaces: true,
    });
    const space1OnlyPrivate = await sut.searchPerson(factory.auth({ user: fx.space1OnlyMember }), {
      name: 'Private',
      withSharedSpaces: true,
    });

    expect(inBoth).toHaveLength(1);
    expect(inBoth[0].filterId).toMatch(/^(person|space-person):/);
    expect(JSON.stringify(inBoth)).not.toContain(fx.aliceIdentityId);
    expect(space1OnlyPrivate).toEqual([]);
  });

  describe('repair RBAC', () => {
    it('viewer role in a space cannot repair that Space Person', async () => {
      const fx = await setupRepairFixture(SharedSpaceRole.Viewer);

      await expect(
        fx.sut.mergeScopedPeople(factory.auth({ user: fx.actor }), {
          target: { type: 'person', id: fx.actorPerson.id },
          sources: [{ type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it.each([SharedSpaceRole.Owner, SharedSpaceRole.Editor])(
      '%s role in a space can repair that Space Person',
      async (role) => {
        const fx = await setupRepairFixture(role);

        await fx.sut.mergeScopedPeople(factory.auth({ user: fx.actor }), {
          target: { type: 'person', id: fx.actorPerson.id },
          sources: [{ type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id }],
        });

        const updatedSpacePerson = await fx.ctx.database
          .selectFrom('shared_space_person')
          .select('identityId')
          .where('id', '=', fx.spacePerson.id)
          .executeTakeFirstOrThrow();
        expect(updatedSpacePerson.identityId).toBe(fx.targetIdentity.id);
      },
    );

    it('user cannot repair a personal profile they do not own', async () => {
      const fx = await setupRepairFixture(SharedSpaceRole.Editor);
      const { person: otherPerson } = await fx.ctx.newPerson({ ownerId: fx.otherUser.id });
      await fx.faceIdentityRepository.ensurePersonIdentity(otherPerson.id);

      await expect(
        fx.sut.mergeScopedPeople(factory.auth({ user: fx.actor }), {
          target: { type: 'person', id: otherPerson.id },
          sources: [{ type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('admin who is not a member cannot repair a Space Person by admin status alone', async () => {
      const fx = await setupRepairFixture(SharedSpaceRole.Editor);
      const { user: admin } = await fx.ctx.newUser({ isAdmin: true });

      await expect(
        fx.sut.mergeScopedPeople(factory.auth({ user: admin }), {
          target: { type: 'person', id: fx.actorPerson.id },
          sources: [{ type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
