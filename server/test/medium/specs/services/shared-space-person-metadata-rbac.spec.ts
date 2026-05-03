import { Kysely } from 'kysely';
import { AssetVisibility, JobStatus, SharedSpaceRole } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { asBirthDateString } from 'src/utils/date';
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
    ],
    mock: [LoggingRepository, JobRepository],
  });
  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return { ctx, sut, faceIdentityRepository: ctx.get(FaceIdentityRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const createRecognizedFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  faceIdentityRepository: FaceIdentityRepository,
  input: {
    ownerId: string;
    personName: string;
    spaceId?: string;
    birthDate?: string;
    sharePersonMetadata?: boolean;
    assetAdderId?: string;
    libraryId?: string;
  },
) => {
  const { result: person } = await ctx.newPerson({
    ownerId: input.ownerId,
    name: input.personName,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
  });
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

  if (input.sharePersonMetadata === false && input.spaceId) {
    await ctx.database
      .updateTable('shared_space_member')
      .set({ sharePersonMetadata: false })
      .where('spaceId', '=', input.spaceId)
      .where('userId', '=', input.ownerId)
      .execute();
  }

  return { asset, faceId, identity, person };
};

const authFor = (user: { id: string; name: string; email: string; isAdmin?: boolean }) =>
  factory.auth({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });

const getOnlySpacePerson = async (ctx: ReturnType<typeof setup>['ctx'], spaceId: string) => {
  return ctx.database
    .selectFrom('shared_space_person')
    .selectAll()
    .where('spaceId', '=', spaceId)
    .executeTakeFirstOrThrow();
};

const getSpacePersonById = async (ctx: ReturnType<typeof setup>['ctx'], personId: string) => {
  return ctx.database
    .selectFrom('shared_space_person')
    .selectAll()
    .where('id', '=', personId)
    .executeTakeFirstOrThrow();
};

const createSpaceNameBridge = async (input?: {
  sourceName?: string;
  targetOwnedByOther?: boolean;
  targetMemberRole?: SharedSpaceRole;
}) => {
  const { ctx, sut, faceIdentityRepository } = setup();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { user: otherOwner } = input?.targetOwnedByOther ? await ctx.newUser() : { user: member };
  const { space: sourceSpace } = await ctx.newSharedSpace({ createdById: source.id });
  await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: source.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
  const face = await createRecognizedFace(ctx, faceIdentityRepository, {
    ownerId: source.id,
    spaceId: sourceSpace.id,
    personName: input?.sourceName ?? 'John',
  });
  await sut.handleSharedSpaceFaceMatch({ spaceId: sourceSpace.id, assetId: face.asset.id });
  const sourceSpacePerson = await getOnlySpacePerson(ctx, sourceSpace.id);

  const { space: targetSpace } = await ctx.newSharedSpace({ createdById: otherOwner.id });
  await ctx.newSharedSpaceMember({ spaceId: targetSpace.id, userId: otherOwner.id, role: SharedSpaceRole.Owner });
  if (otherOwner.id !== member.id) {
    await ctx.newSharedSpaceMember({
      spaceId: targetSpace.id,
      userId: member.id,
      role: input?.targetMemberRole ?? SharedSpaceRole.Editor,
    });
  }
  await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: face.asset.id, addedById: member.id });
  await sut.handleSharedSpaceFaceMatch({ spaceId: targetSpace.id, assetId: face.asset.id });
  const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

  return { ctx, sut, face, source, member, otherOwner, sourceSpace, targetSpace, sourceSpacePerson, targetSpacePerson };
};

const createLinkedLibrarySpaceNameBridge = async (input?: {
  memberCanSeeSourceSpace?: boolean;
  sourceVisibleInMemberTimeline?: boolean;
  targetOwnedByOther?: boolean;
  targetMemberRole?: SharedSpaceRole;
  sourceName?: string;
  birthDate?: string;
}) => {
  const { ctx, sut, faceIdentityRepository } = setup();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { user: otherOwner } = input?.targetOwnedByOther ? await ctx.newUser() : { user: member };
  const { library } = await ctx.newLibrary({ ownerId: source.id });
  const { space: sourceSpace } = await ctx.newSharedSpace({ createdById: source.id });
  await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: source.id, role: SharedSpaceRole.Owner });
  if (input?.memberCanSeeSourceSpace !== false) {
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    if (input?.sourceVisibleInMemberTimeline === false) {
      await ctx.database
        .updateTable('shared_space_member')
        .set({ showInTimeline: false })
        .where('spaceId', '=', sourceSpace.id)
        .where('userId', '=', member.id)
        .execute();
    }
  }
  const face = await createRecognizedFace(ctx, faceIdentityRepository, {
    ownerId: source.id,
    libraryId: library.id,
    personName: input?.sourceName ?? 'John',
    birthDate: input?.birthDate ?? '1980-01-02',
  });
  await ctx.newSharedSpaceLibrary({ spaceId: sourceSpace.id, libraryId: library.id, addedById: source.id });
  await sut.handleSharedSpaceLibraryFaceSync({ spaceId: sourceSpace.id, libraryId: library.id });
  const sourceSpacePerson = await getOnlySpacePerson(ctx, sourceSpace.id);

  const { space: targetSpace } = await ctx.newSharedSpace({ createdById: otherOwner.id });
  await ctx.newSharedSpaceMember({ spaceId: targetSpace.id, userId: otherOwner.id, role: SharedSpaceRole.Owner });
  if (otherOwner.id !== member.id) {
    await ctx.newSharedSpaceMember({
      spaceId: targetSpace.id,
      userId: member.id,
      role: input?.targetMemberRole ?? SharedSpaceRole.Editor,
    });
  }
  await ctx.newSharedSpaceLibrary({ spaceId: targetSpace.id, libraryId: library.id, addedById: member.id });

  return { ctx, sut, face, library, source, member, otherOwner, sourceSpace, targetSpace, sourceSpacePerson };
};

describe('SharedSpaceService shared-space person metadata RBAC', () => {
  it('matches by source identity and reuses one space person for multiple assets', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });

    const first = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      spaceId: space.id,
      personName: 'Alice Source',
      birthDate: '1990-01-01',
    });
    const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: secondAsset.id, addedById: user.id });
    const { result: secondFaceId } = await ctx.newAssetFace({ assetId: secondAsset.id, personId: first.person.id });
    await ctx.database.insertInto('face_search').values({ faceId: secondFaceId, embedding: newEmbedding() }).execute();
    await faceIdentityRepository.replaceFaceIdentity({
      assetFaceId: secondFaceId,
      identityId: first.identity.id,
      source: 'manual',
    });

    await expect(sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: first.asset.id })).resolves.toBe(
      JobStatus.Success,
    );
    await expect(sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: secondAsset.id })).resolves.toBe(
      JobStatus.Success,
    );

    const people = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .execute();
    expect(people).toHaveLength(1);
    expect(people[0]).toEqual(
      expect.objectContaining({
        identityId: first.identity.id,
        name: 'Alice Source',
        nameSource: 'inherited',
        birthDateSource: 'inherited',
      }),
    );
    expect(asBirthDateString(people[0].birthDate)).toBe('1990-01-01');
    expect(people[0].faceCount).toBe(2);
  });

  it('does not create a space person for an asset outside the target space', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });

    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      personName: 'Private Alice',
    });

    await expect(sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id })).resolves.toBe(
      JobStatus.Success,
    );

    const people = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .execute();
    expect(people).toHaveLength(0);
  });

  it('does not inherit names or birth dates from a member who disabled contribution', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });

    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      spaceId: space.id,
      personName: 'Opted Out',
      birthDate: '1984-05-09',
      sharePersonMetadata: false,
    });

    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });

    const person = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();
    expect(person.name).toBe('');
    expect(person.birthDate).toBeNull();
    expect(person.nameSource).toBe('none');
    expect(person.birthDateSource).toBe('none');
  });

  it('carries a member-visible inherited space name into a new space created by that member', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space: sourceSpace } = await ctx.newSharedSpace({ createdById: source.id });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: source.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: sourceSpace.id,
      personName: 'John',
    });

    await sut.handleSharedSpaceFaceMatch({ spaceId: sourceSpace.id, assetId: face.asset.id });

    const sourceSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', sourceSpace.id)
      .executeTakeFirstOrThrow();
    expect(sourceSpacePerson.name).toBe('John');
    expect(sourceSpacePerson.nameSource).toBe('inherited');

    const { space: targetSpace } = await ctx.newSharedSpace({ createdById: member.id });
    await ctx.newSharedSpaceMember({ spaceId: targetSpace.id, userId: member.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: face.asset.id, addedById: member.id });

    await sut.handleSharedSpaceFaceMatch({ spaceId: targetSpace.id, assetId: face.asset.id });

    const targetSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', targetSpace.id)
      .executeTakeFirstOrThrow();
    expect(targetSpacePerson.name).toBe('John');
    expect(targetSpacePerson.nameSource).toBe('inherited');
    expect(targetSpacePerson.nameSourceProfileType).toBe('space-person');
    expect(targetSpacePerson.nameSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('does not carry a space name from a source space hidden from the member timeline', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space: sourceSpace } = await ctx.newSharedSpace({ createdById: source.id });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: source.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    await ctx.database
      .updateTable('shared_space_member')
      .set({ showInTimeline: false })
      .where('spaceId', '=', sourceSpace.id)
      .where('userId', '=', member.id)
      .execute();
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: sourceSpace.id,
      personName: 'Hidden Source Name',
    });
    await sut.handleSharedSpaceFaceMatch({ spaceId: sourceSpace.id, assetId: face.asset.id });

    const { space: targetSpace } = await ctx.newSharedSpace({ createdById: member.id });
    await ctx.newSharedSpaceMember({ spaceId: targetSpace.id, userId: member.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: face.asset.id, addedById: member.id });

    await sut.handleSharedSpaceFaceMatch({ spaceId: targetSpace.id, assetId: face.asset.id });

    const targetSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', targetSpace.id)
      .executeTakeFirstOrThrow();
    expect(targetSpacePerson.name).toBe('');
    expect(targetSpacePerson.nameSource).toBe('none');
  });

  it('does not carry a visible space name when the asset adder disables target-space metadata contribution', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space: sourceSpace } = await ctx.newSharedSpace({ createdById: source.id });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: source.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: sourceSpace.id,
      personName: 'Visible Source Name',
    });
    await sut.handleSharedSpaceFaceMatch({ spaceId: sourceSpace.id, assetId: face.asset.id });

    const { space: targetSpace } = await ctx.newSharedSpace({ createdById: member.id });
    await ctx.newSharedSpaceMember({ spaceId: targetSpace.id, userId: member.id, role: SharedSpaceRole.Owner });
    await ctx.database
      .updateTable('shared_space_member')
      .set({ sharePersonMetadata: false })
      .where('spaceId', '=', targetSpace.id)
      .where('userId', '=', member.id)
      .execute();
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: face.asset.id, addedById: member.id });

    await sut.handleSharedSpaceFaceMatch({ spaceId: targetSpace.id, assetId: face.asset.id });

    const targetSpacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', targetSpace.id)
      .executeTakeFirstOrThrow();
    expect(targetSpacePerson.name).toBe('');
    expect(targetSpacePerson.nameSource).toBe('none');
  });

  it('carries a member-visible inherited space name through linked-library face sync', async () => {
    const { ctx, sut, face, library, targetSpace, sourceSpacePerson } = await createLinkedLibrarySpaceNameBridge();

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });

    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    expect(targetSpacePerson.identityId).toBe(face.identity.id);
    expect(targetSpacePerson.name).toBe('John');
    expect(targetSpacePerson.nameSource).toBe('inherited');
    expect(targetSpacePerson.nameSourceProfileType).toBe('space-person');
    expect(targetSpacePerson.nameSourceProfileId).toBe(sourceSpacePerson.id);
    expect(asBirthDateString(targetSpacePerson.birthDate)).toBe('1980-01-02');
    expect(targetSpacePerson.birthDateSource).toBe('inherited');
    expect(targetSpacePerson.birthDateSourceProfileType).toBe('space-person');
    expect(targetSpacePerson.birthDateSourceProfileId).toBe(sourceSpacePerson.id);
    expect(targetSpacePerson.faceCount).toBe(1);
  });

  it('uses the linked-library linker when a direct space asset row has no adder', async () => {
    const { ctx, sut, face, library, targetSpace, sourceSpacePerson } = await createLinkedLibrarySpaceNameBridge();
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: face.asset.id, addedById: null });

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });

    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    expect(targetSpacePerson.name).toBe('John');
    expect(targetSpacePerson.nameSource).toBe('inherited');
    expect(targetSpacePerson.nameSourceProfileType).toBe('space-person');
    expect(targetSpacePerson.nameSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('does not carry a linked-library source-space name when the library linker cannot see that source space', async () => {
    const { ctx, sut, library, targetSpace } = await createLinkedLibrarySpaceNameBridge({
      memberCanSeeSourceSpace: false,
    });

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });

    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    expect(targetSpacePerson.name).toBe('');
    expect(targetSpacePerson.nameSource).toBe('none');
    expect(targetSpacePerson.nameSourceProfileType).toBeNull();
    expect(targetSpacePerson.nameSourceProfileId).toBeNull();
  });

  it('does not carry a linked-library source-space name hidden from the library linker timeline', async () => {
    const { ctx, sut, library, targetSpace } = await createLinkedLibrarySpaceNameBridge({
      sourceVisibleInMemberTimeline: false,
    });

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });

    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    expect(targetSpacePerson.name).toBe('');
    expect(targetSpacePerson.nameSource).toBe('none');
    expect(targetSpacePerson.nameSourceProfileType).toBeNull();
    expect(targetSpacePerson.nameSourceProfileId).toBeNull();
  });

  it('does not carry a linked-library source-space name when the linker disabled target-space metadata contribution', async () => {
    const { ctx, sut, member, library, targetSpace } = await createLinkedLibrarySpaceNameBridge();
    await ctx.database
      .updateTable('shared_space_member')
      .set({ sharePersonMetadata: false })
      .where('spaceId', '=', targetSpace.id)
      .where('userId', '=', member.id)
      .execute();

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });

    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    expect(targetSpacePerson.name).toBe('');
    expect(targetSpacePerson.nameSource).toBe('none');
    expect(targetSpacePerson.nameSourceProfileType).toBeNull();
    expect(targetSpacePerson.nameSourceProfileId).toBeNull();
  });

  it('keeps a space-sourced inherited name during backfill while the source remains visible', async () => {
    const { ctx, sut, face, sourceSpacePerson, targetSpacePerson } = await createSpaceNameBridge();

    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('John');
    expect(updated.nameSource).toBe('inherited');
    expect(updated.nameSourceProfileType).toBe('space-person');
    expect(updated.nameSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('clears linked-library inherited metadata when the source member is removed from that source space', async () => {
    const { ctx, sut, face, source, member, sourceSpace, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.removeMember(authFor(source), sourceSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
    expect(updated.birthDate).toBeNull();
    expect(updated.birthDateSource).toBe('none');
    expect(updated.birthDateSourceProfileId).toBeNull();
  });

  it('clears linked-library inherited metadata when the source space is deleted', async () => {
    const { ctx, sut, face, source, sourceSpace, library, targetSpace } = await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('clears linked-library inherited metadata when the library linker is removed from the target space', async () => {
    const { ctx, sut, face, member, otherOwner, library, targetSpace } = await createLinkedLibrarySpaceNameBridge({
      targetOwnedByOther: true,
      targetMemberRole: SharedSpaceRole.Editor,
    });
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.removeMember(authFor(otherOwner), targetSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('clears linked-library inherited metadata when the source space is hidden from the linker timeline later', async () => {
    const { ctx, sut, face, member, sourceSpace, library, targetSpace } = await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('restores linked-library inherited metadata when the source space is shown in the linker timeline again', async () => {
    const { ctx, sut, face, member, sourceSpace, sourceSpacePerson, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
    const hidden = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(hidden.name).toBe('');
    expect(hidden.nameSource).toBe('none');
    expect(hidden.birthDate).toBeNull();

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
    const restored = await getSpacePersonById(ctx, targetSpacePerson.id);

    expect(restored.name).toBe('John');
    expect(restored.nameSource).toBe('inherited');
    expect(restored.nameSourceProfileType).toBe('space-person');
    expect(restored.nameSourceProfileId).toBe(sourceSpacePerson.id);
    expect(asBirthDateString(restored.birthDate)).toBe('1980-01-02');
    expect(restored.birthDateSource).toBe('inherited');
  });

  it('clears linked-library inherited metadata when the source space person is hidden later', async () => {
    const { ctx, sut, face, source, sourceSpace, sourceSpacePerson, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.updateSpacePerson(authFor(source), sourceSpace.id, sourceSpacePerson.id, { isHidden: true });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('updates from a renamed linked-library source space person and then clears after that source space is deleted', async () => {
    const { ctx, sut, face, source, sourceSpace, sourceSpacePerson, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.updateSpacePerson(authFor(source), sourceSpace.id, sourceSpacePerson.id, { name: 'Johnny' });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const renamed = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(renamed.name).toBe('Johnny');
    expect(renamed.nameSourceProfileId).toBe(sourceSpacePerson.id);

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const cleared = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(cleared.name).toBe('');
    expect(cleared.nameSource).toBe('none');
    expect(cleared.nameSourceProfileId).toBeNull();
  });

  it('falls back to a current library linker personal name when a linked-library source space name disappears', async () => {
    const { ctx, sut, face, source, member, sourceSpace, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);
    const { person: fallback } = await ctx.newPerson({ ownerId: member.id, name: 'Local John' });
    await ctx.database
      .updateTable('person')
      .set({ identityId: face.identity.id })
      .where('id', '=', fallback.id)
      .execute();

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('Local John');
    expect(updated.nameSource).toBe('inherited');
    expect(updated.nameSourceProfileType).toBe('user-person');
    expect(updated.nameSourceProfileId).toBe(fallback.id);
  });

  it('keeps manual linked-library target-space metadata when the inherited source space is deleted', async () => {
    const { ctx, sut, face, source, member, sourceSpace, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.updateSpacePerson(authFor(member), targetSpace.id, targetSpacePerson.id, {
      name: 'Target John',
      birthDate: '2001-01-01',
    });
    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('Target John');
    expect(updated.nameSource).toBe('manual');
    expect(updated.nameSourceProfileType).toBe('space-person');
    expect(updated.nameSourceProfileId).toBe(targetSpacePerson.id);
    expect(asBirthDateString(updated.birthDate)).toBe('2001-01-01');
    expect(updated.birthDateSource).toBe('manual');
  });

  it('clears and restores linked-library inherited metadata when a linker leaves and rejoins the source space', async () => {
    const { ctx, sut, face, source, member, sourceSpace, sourceSpacePerson, library, targetSpace } =
      await createLinkedLibrarySpaceNameBridge();
    await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
    const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

    await sut.removeMember(authFor(source), sourceSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const afterRemoval = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(afterRemoval.name).toBe('');
    expect(afterRemoval.nameSource).toBe('none');
    expect(afterRemoval.birthDate).toBeNull();

    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const afterRejoin = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(afterRejoin.name).toBe('John');
    expect(afterRejoin.nameSource).toBe('inherited');
    expect(afterRejoin.nameSourceProfileType).toBe('space-person');
    expect(afterRejoin.nameSourceProfileId).toBe(sourceSpacePerson.id);
    expect(asBirthDateString(afterRejoin.birthDate)).toBe('1980-01-02');
    expect(afterRejoin.birthDateSource).toBe('inherited');
  });

  it('keeps a linked-library space-sourced inherited name during backfill while the source remains visible', async () => {
    const { ctx, sut, face, targetSpace, sourceSpacePerson } = await createLinkedLibrarySpaceNameBridge();
    const targetSpacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: targetSpace.id,
        identityId: face.identity.id,
        name: '',
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: targetSpacePerson.id, assetFaceId: face.faceId })
      .execute();

    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('John');
    expect(updated.nameSource).toBe('inherited');
    expect(updated.nameSourceProfileType).toBe('space-person');
    expect(updated.nameSourceProfileId).toBe(sourceSpacePerson.id);
    expect(asBirthDateString(updated.birthDate)).toBe('1980-01-02');
    expect(updated.birthDateSource).toBe('inherited');
    expect(updated.birthDateSourceProfileType).toBe('space-person');
    expect(updated.birthDateSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('clears a space-sourced inherited name when the source member is removed from that source space', async () => {
    const { ctx, sut, face, source, member, sourceSpace, targetSpacePerson } = await createSpaceNameBridge();

    await sut.removeMember(authFor(source), sourceSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('clears a space-sourced inherited name when the source space is deleted', async () => {
    const { ctx, sut, face, source, sourceSpace, targetSpacePerson } = await createSpaceNameBridge();

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('clears a space-sourced inherited name when the asset adder is removed from the target space', async () => {
    const { ctx, sut, face, member, otherOwner, targetSpace, targetSpacePerson } = await createSpaceNameBridge({
      targetOwnedByOther: true,
      targetMemberRole: SharedSpaceRole.Editor,
    });

    await sut.removeMember(authFor(otherOwner), targetSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('clears a space-sourced inherited name when the source space is hidden from the asset adder timeline later', async () => {
    const { ctx, sut, face, member, sourceSpace, targetSpacePerson } = await createSpaceNameBridge();

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('restores a space-sourced inherited name when the source space is shown in the asset adder timeline again', async () => {
    const { ctx, sut, face, member, sourceSpace, sourceSpacePerson, targetSpacePerson } = await createSpaceNameBridge();

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
    const hidden = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(hidden.name).toBe('');
    expect(hidden.nameSource).toBe('none');

    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
    const restored = await getSpacePersonById(ctx, targetSpacePerson.id);

    expect(restored.name).toBe('John');
    expect(restored.nameSource).toBe('inherited');
    expect(restored.nameSourceProfileType).toBe('space-person');
    expect(restored.nameSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('clears a space-sourced inherited name when the source space person is hidden later', async () => {
    const { ctx, sut, face, source, sourceSpace, sourceSpacePerson, targetSpacePerson } = await createSpaceNameBridge();

    await sut.updateSpacePerson(authFor(source), sourceSpace.id, sourceSpacePerson.id, { isHidden: true });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileType).toBeNull();
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('updates from a renamed source space person and then clears after that source space is deleted', async () => {
    const { ctx, sut, face, source, sourceSpace, sourceSpacePerson, targetSpacePerson } = await createSpaceNameBridge();

    await sut.updateSpacePerson(authFor(source), sourceSpace.id, sourceSpacePerson.id, { name: 'Johnny' });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const renamed = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(renamed.name).toBe('Johnny');
    expect(renamed.nameSourceProfileId).toBe(sourceSpacePerson.id);

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const cleared = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(cleared.name).toBe('');
    expect(cleared.nameSource).toBe('none');
    expect(cleared.nameSourceProfileId).toBeNull();
  });

  it('falls back to a current target member personal name when a source space name disappears', async () => {
    const { ctx, sut, face, source, member, sourceSpace, targetSpacePerson } = await createSpaceNameBridge();
    const { person: fallback } = await ctx.newPerson({ ownerId: member.id, name: 'Local John' });
    await ctx.database
      .updateTable('person')
      .set({ identityId: face.identity.id })
      .where('id', '=', fallback.id)
      .execute();

    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('Local John');
    expect(updated.nameSource).toBe('inherited');
    expect(updated.nameSourceProfileType).toBe('user-person');
    expect(updated.nameSourceProfileId).toBe(fallback.id);
  });

  it('keeps a manual target-space name when the inherited source space is deleted', async () => {
    const { ctx, sut, face, source, member, sourceSpace, targetSpace, targetSpacePerson } =
      await createSpaceNameBridge();

    await sut.updateSpacePerson(authFor(member), targetSpace.id, targetSpacePerson.id, { name: 'Target John' });
    await sut.remove(authFor(source), sourceSpace.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('Target John');
    expect(updated.nameSource).toBe('manual');
    expect(updated.nameSourceProfileType).toBe('space-person');
    expect(updated.nameSourceProfileId).toBe(targetSpacePerson.id);
  });

  it('keeps manual target metadata when source timeline visibility is toggled off and on', async () => {
    const { ctx, sut, face, member, sourceSpace, targetSpace, targetSpacePerson } = await createSpaceNameBridge();

    await sut.updateSpacePerson(authFor(member), targetSpace.id, targetSpacePerson.id, {
      name: 'Manual Target',
      birthDate: '2002-02-02',
    });
    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
    await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('Manual Target');
    expect(updated.nameSource).toBe('manual');
    expect(asBirthDateString(updated.birthDate)).toBe('2002-02-02');
    expect(updated.birthDateSource).toBe('manual');
  });

  it('does not keep a name that was only visible to a removed target-space member', async () => {
    const { ctx, sut, face, member, otherOwner, targetSpace, targetSpacePerson } = await createSpaceNameBridge({
      targetOwnedByOther: true,
      targetMemberRole: SharedSpaceRole.Editor,
    });

    await sut.removeMember(authFor(otherOwner), targetSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileId).toBeNull();
  });

  it('deleting a target space does not clear the source space or private person names', async () => {
    const { ctx, sut, face, member, targetSpace, sourceSpacePerson } = await createSpaceNameBridge();

    await sut.remove(authFor(member), targetSpace.id);

    const sourceAfterDelete = await getSpacePersonById(ctx, sourceSpacePerson.id);
    const privateAfterDelete = await ctx.database
      .selectFrom('person')
      .selectAll()
      .where('id', '=', face.person.id)
      .executeTakeFirstOrThrow();
    const targetPeople = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', targetSpace.id)
      .execute();
    expect(sourceAfterDelete.name).toBe('John');
    expect(privateAfterDelete.name).toBe('John');
    expect(targetPeople).toEqual([]);
  });

  it('clears and restores a space-sourced inherited name when a member leaves and rejoins the source space', async () => {
    const { ctx, sut, face, source, member, sourceSpace, sourceSpacePerson, targetSpacePerson } =
      await createSpaceNameBridge();

    await sut.removeMember(authFor(source), sourceSpace.id, member.id);
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const afterRemoval = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(afterRemoval.name).toBe('');
    expect(afterRemoval.nameSource).toBe('none');

    await ctx.newSharedSpaceMember({ spaceId: sourceSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const afterRejoin = await getSpacePersonById(ctx, targetSpacePerson.id);
    expect(afterRejoin.name).toBe('John');
    expect(afterRejoin.nameSource).toBe('inherited');
    expect(afterRejoin.nameSourceProfileType).toBe('space-person');
    expect(afterRejoin.nameSourceProfileId).toBe(sourceSpacePerson.id);
  });

  it('does not expose opted-out private person metadata through shared-space person APIs', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: source } = await ctx.newUser();
    const { user: viewer } = await ctx.newUser();
    const { user: nonMember } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id, role: SharedSpaceRole.Viewer });

    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: space.id,
      personName: 'Private Source Name',
      birthDate: '1975-03-04',
      sharePersonMetadata: false,
    });
    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });

    const spacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();
    const viewerAuth = factory.auth({ user: { id: viewer.id, name: viewer.name, email: viewer.email } });
    const visible = await sut.getSpacePerson(viewerAuth, space.id, spacePerson.id);
    expect(visible.name).toBe('');
    expect(visible.birthDate).toBeNull();
    expect(visible.thumbnailPath).toBe('');

    const nonMemberAuth = factory.auth({ user: { id: nonMember.id, name: nonMember.name, email: nonMember.email } });
    await expect(sut.getSpacePerson(nonMemberAuth, space.id, spacePerson.id)).rejects.toThrow('Not a member');
    await expect(sut.getSpacePersonThumbnail(nonMemberAuth, space.id, spacePerson.id)).rejects.toThrow('Not a member');
  });

  it('backfills existing space-person metadata in chunks while keeping manual locks', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      spaceId: space.id,
      personName: 'Backfill Source',
      birthDate: '1999-09-09',
    });

    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: face.identity.id,
        name: 'Manual Space Name',
        nameSource: 'manual',
        birthDate: null,
        birthDateSource: 'none',
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const result = await sut.backfillSpacePersonMetadata({ limit: 1000 });
    expect(result.processed).toBeGreaterThan(0);
    expect(result.inherited).toBeGreaterThan(0);

    const updated = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();
    expect(updated.name).toBe('Manual Space Name');
    expect(updated.nameSource).toBe('manual');
    expect(asBirthDateString(updated.birthDate)).toBe('1999-09-09');
    expect(updated.birthDateSource).toBe('inherited');
  });

  it('backfill respects owner-disabled metadata contribution for existing space people', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: source } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Viewer });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: space.id,
      personName: 'Disabled Source',
      birthDate: '2000-01-02',
    });

    const ownerAuth = factory.auth({ user: { id: owner.id, name: owner.name, email: owner.email } });
    await sut.updateMemberMetadataContribution(ownerAuth, space.id, source.id, { sharePersonMetadata: false });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({ spaceId: space.id, identityId: face.identity.id, name: '', type: 'person' })
      .returningAll()
      .executeTakeFirstOrThrow();

    const result = await sut.backfillSpacePersonMetadata({ limit: 1000 });
    expect(result.processed).toBeGreaterThan(0);
    const unchanged = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();
    expect(unchanged.name).toBe('');
    expect(unchanged.birthDate).toBeNull();
  });

  it('clears inherited metadata when the source member disables contribution later', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: source } = await ctx.newUser();
    const { user: viewer } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id, role: SharedSpaceRole.Viewer });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: space.id,
      personName: 'Revoked Source',
      birthDate: '1988-08-08',
    });
    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });
    const inherited = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();
    expect(inherited.name).toBe('Revoked Source');
    expect(asBirthDateString(inherited.birthDate)).toBe('1988-08-08');

    await sut.updateMemberMetadataContribution(authFor(owner), space.id, source.id, { sharePersonMetadata: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', inherited.id)
      .executeTakeFirstOrThrow();
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
    expect(updated.nameSourceProfileId).toBeNull();
    expect(updated.birthDate).toBeNull();
    expect(updated.birthDateSource).toBe('none');
    expect(updated.birthDateSourceProfileId).toBeNull();
  });

  it('keeps manual space metadata when the inherited source later opts out', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: source } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Viewer });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: space.id,
      personName: 'Inherited Before Manual',
      birthDate: '1970-07-07',
    });
    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: face.asset.id });
    const spacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();

    await sut.updateSpacePerson(authFor(owner), space.id, spacePerson.id, {
      name: 'Manual Space Label',
      birthDate: '2001-01-01',
    });
    await sut.updateMemberMetadataContribution(authFor(owner), space.id, source.id, { sharePersonMetadata: false });
    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();
    expect(updated.name).toBe('Manual Space Label');
    expect(updated.nameSource).toBe('manual');
    expect(asBirthDateString(updated.birthDate)).toBe('2001-01-01');
    expect(updated.birthDateSource).toBe('manual');
  });

  it('uses the highest member role when multiple members contribute conflicting names', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const ownerFace = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: owner.id,
      spaceId: space.id,
      personName: 'Owner Candidate',
    });
    const { person: memberPerson } = await ctx.newPerson({ ownerId: member.id, name: 'Viewer Candidate' });
    await ctx.database
      .updateTable('person')
      .set({ identityId: ownerFace.identity.id })
      .where('id', '=', memberPerson.id)
      .execute();

    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: ownerFace.asset.id });

    const spacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();
    expect(spacePerson.name).toBe('Owner Candidate');
    expect(spacePerson.nameSourceProfileId).toBe(ownerFace.person.id);
  });

  it('uses the asset adder when same-role contributors conflict', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: source } = await ctx.newUser();
    const { user: assetAdder } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: assetAdder.id, role: SharedSpaceRole.Viewer });
    const sourceFace = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: source.id,
      spaceId: space.id,
      assetAdderId: assetAdder.id,
      personName: 'Source Owner Candidate',
    });
    const { person: assetAdderPerson } = await ctx.newPerson({
      ownerId: assetAdder.id,
      name: 'Asset Adder Candidate',
    });
    await ctx.database
      .updateTable('person')
      .set({ identityId: sourceFace.identity.id })
      .where('id', '=', assetAdderPerson.id)
      .execute();

    await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: sourceFace.asset.id });

    const spacePerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .executeTakeFirstOrThrow();
    expect(spacePerson.name).toBe('Asset Adder Candidate');
    expect(spacePerson.nameSourceProfileId).toBe(assetAdderPerson.id);
  });

  it('does not inherit ambiguous same-rank conflicting member names', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: first } = await ctx.newUser();
    const { user: second } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: first.id, role: SharedSpaceRole.Viewer });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: second.id, role: SharedSpaceRole.Viewer });
    const firstFace = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: first.id,
      personName: 'First Candidate',
    });
    const { person: secondPerson } = await ctx.newPerson({ ownerId: second.id, name: 'Second Candidate' });
    await ctx.database
      .updateTable('person')
      .set({ identityId: firstFace.identity.id })
      .where('id', '=', secondPerson.id)
      .execute();
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({ spaceId: space.id, identityId: firstFace.identity.id, name: '', type: 'person' })
      .returningAll()
      .executeTakeFirstOrThrow();

    await sut.backfillSpacePersonMetadata({ identityId: firstFace.identity.id, limit: 1000 });

    const updated = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();
    expect(updated.name).toBe('');
    expect(updated.nameSource).toBe('none');
  });

  it('does not inherit person metadata into a different space person type', async () => {
    const { ctx, sut, faceIdentityRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const face = await createRecognizedFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      personName: 'Human Candidate',
      birthDate: '1995-05-05',
    });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({ spaceId: space.id, identityId: face.identity.id, name: '', type: 'pet' })
      .returningAll()
      .executeTakeFirstOrThrow();

    await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

    const updated = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('id', '=', spacePerson.id)
      .executeTakeFirstOrThrow();
    expect(updated.name).toBe('');
    expect(updated.birthDate).toBeNull();
    expect(updated.nameSource).toBe('none');
    expect(updated.birthDateSource).toBe('none');
  });

  it('lets owners disable but not enable another member metadata contribution', async () => {
    const { ctx, sut } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: member } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });

    const auth = factory.auth({ user: { id: owner.id, name: owner.name, email: owner.email } });
    const disabled = await sut.updateMemberMetadataContribution(auth, space.id, member.id, {
      sharePersonMetadata: false,
    });
    expect(disabled.sharePersonMetadata).toBe(false);

    await expect(
      sut.updateMemberMetadataContribution(auth, space.id, member.id, { sharePersonMetadata: true } as never),
    ).rejects.toThrow('Cannot enable person metadata contribution');
  });
});
