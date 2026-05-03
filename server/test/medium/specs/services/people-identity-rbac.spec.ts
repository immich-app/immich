import { BadRequestException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AssetVisibility, SharedSpaceRole } from 'src/enum';
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
    real: [AccessRepository, ConfigRepository, FaceIdentityRepository, PersonRepository],
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
      SharedSpaceRepository,
      SystemMetadataRepository,
    ],
    mock: [JobRepository, LoggingRepository],
  });
  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return { ctx, sut, faceIdentityRepository: ctx.get(FaceIdentityRepository) };
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

const createLinkedLibraryIdentityFixture = async (input?: { city?: string; personName?: string }) => {
  const { ctx, sut: personService, faceIdentityRepository } = setup();
  const { sut: sharedSpaceService } = setupSharedSpace();
  const { sut: searchService } = setupSearch();
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
    searchService,
    source,
    member,
    nonMember,
    library,
    space,
    face,
    spacePerson,
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

  it('uses a named accessible space profile over a blank personal profile in global filter suggestions', async () => {
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
        name: 'Pierre',
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
          id: `space-person:${spacePerson.id}`,
          name: 'Pierre',
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
