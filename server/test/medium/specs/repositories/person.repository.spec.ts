import { Kysely } from 'kysely';
import { AssetFileType, AssetVisibility } from 'src/enum';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(PersonRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(PersonRepository.name, () => {
  describe('getPeopleOverviewStatistics', () => {
    it('counts visible and hidden personal people and all detected timeline faces in owned assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: otherUser.id, visibility: AssetVisibility.Timeline });
      const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, isHidden: false });
      const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, isHidden: true });
      const { person: otherPerson } = await ctx.newPerson({ ownerId: otherUser.id });

      await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: hiddenPerson.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: null });
      await ctx.newAssetFace({ assetId: otherAsset.id, personId: otherPerson.id });

      await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
        total: 2,
        hidden: 1,
        detectedFaceCount: 3,
      });
    });

    it('returns zero visible people when all personal people are hidden', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { person } = await ctx.newPerson({ ownerId: user.id, isHidden: true });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      const result = await sut.getPeopleOverviewStatistics(user.id);

      expect(result).toEqual({ total: 1, hidden: 1, detectedFaceCount: 1 });
      expect(result.total - result.hidden).toBe(0);
    });

    it('includes archived assets but excludes other out-of-scope assets and non-visible or deleted faces from detectedFaceCount', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { person } = await ctx.newPerson({ ownerId: user.id, isHidden: false });

      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id });

      const { asset: deletedAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        deletedAt: new Date(),
      });
      const { asset: offlineAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        isOffline: true,
      });
      const { asset: lockedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
      const { asset: archiveAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });

      await ctx.newAssetFace({ assetId: deletedAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: offlineAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: lockedAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: archiveAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, isVisible: false });
      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, deletedAt: new Date() });

      await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
        total: 1,
        hidden: 0,
        detectedFaceCount: 2,
      });
    });

    it('excludes people whose only faces are on offline or non-owned assets from personal totals', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: offlineAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        isOffline: true,
      });
      const { asset: otherOwnerAsset } = await ctx.newAsset({
        ownerId: otherUser.id,
        visibility: AssetVisibility.Timeline,
      });
      const { person: validPerson } = await ctx.newPerson({ ownerId: user.id });
      const { person: offlineOnlyPerson } = await ctx.newPerson({ ownerId: user.id, isHidden: true });
      const { person: otherOwnerAssetOnlyPerson } = await ctx.newPerson({ ownerId: user.id });

      await ctx.newAssetFace({ assetId: validAsset.id, personId: validPerson.id });
      await ctx.newAssetFace({ assetId: offlineAsset.id, personId: offlineOnlyPerson.id });
      await ctx.newAssetFace({ assetId: otherOwnerAsset.id, personId: otherOwnerAssetOnlyPerson.id });

      await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
        total: 1,
        hidden: 0,
        detectedFaceCount: 1,
      });
    });

    it('returns zeroes for an empty personal library', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
        total: 0,
        hidden: 0,
        detectedFaceCount: 0,
      });
    });
  });

  describe('getPeopleFaceStatistics', () => {
    it('splits owned timeline faces into visible, hidden, and unassigned buckets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, isHidden: false });
      const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, isHidden: true });

      await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: hiddenPerson.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: null });
      await ctx.newAssetFace({ assetId: asset.id, personId: null });

      const details = await sut.getPeopleFaceStatistics(user.id);
      const overview = await sut.getPeopleOverviewStatistics(user.id);

      expect(details).toEqual({
        detectedFaceCount: 5,
        assignedVisibleFaceCount: 2,
        namedVisiblePersonCount: 1,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 2,
      });
      expect(details.detectedFaceCount).toBe(overview.detectedFaceCount);
      expect(details.detectedFaceCount).toBe(
        details.assignedVisibleFaceCount + details.assignedHiddenFaceCount + details.unassignedFaceCount,
      );
    });

    it('returns all personal faces as unassigned when no eligible people are assigned and is deterministic', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });

      await ctx.newAssetFace({ assetId: asset.id, personId: null });
      await ctx.newAssetFace({ assetId: asset.id, personId: null });

      await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
        total: 0,
        hidden: 0,
        detectedFaceCount: 2,
      });

      const first = await sut.getPeopleFaceStatistics(user.id);
      const second = await sut.getPeopleFaceStatistics(user.id);

      expect(first).toEqual({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 0,
        namedVisiblePersonCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 2,
      });
      expect(second).toEqual(first);
    });

    it('returns zeroes for an empty personal library', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
        detectedFaceCount: 0,
        assignedVisibleFaceCount: 0,
        namedVisiblePersonCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('includes archived assets but excludes deleted assets, offline assets, locked assets, non-visible faces, and deleted faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, isHidden: false });
      const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: deletedAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        deletedAt: new Date(),
      });
      const { asset: offlineAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        isOffline: true,
      });
      const { asset: lockedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
      const { asset: archivedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });

      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: deletedAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: offlineAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: lockedAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: archivedAsset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, isVisible: false });
      await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, deletedAt: new Date() });

      await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 2,
        namedVisiblePersonCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it("treats a face assigned to another user's person on the current user's owned asset as unassigned", async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { person: otherPerson } = await ctx.newPerson({ ownerId: otherUser.id, isHidden: false });

      await ctx.newAssetFace({ assetId: asset.id, personId: otherPerson.id });

      await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 0,
        namedVisiblePersonCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 1,
      });
    });

    it('counts distinct named visible people with eligible visible faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: archivedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: otherUser.id, visibility: AssetVisibility.Timeline });
      const { person: namedVisible } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: false });
      const { person: duplicateNamedVisible } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Alice Duplicate',
        isHidden: false,
      });
      const { person: hiddenNamed } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden', isHidden: true });
      const { person: unnamedVisible } = await ctx.newPerson({ ownerId: user.id, name: '', isHidden: false });
      const { person: whitespaceVisible } = await ctx.newPerson({ ownerId: user.id, name: '   ', isHidden: false });
      const { person: outOfScopeNamed } = await ctx.newPerson({ ownerId: user.id, name: 'Archived', isHidden: false });
      const { person: otherNamed } = await ctx.newPerson({ ownerId: otherUser.id, name: 'Other', isHidden: false });

      await ctx.newAssetFace({ assetId: asset.id, personId: namedVisible.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: namedVisible.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: duplicateNamedVisible.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: hiddenNamed.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: unnamedVisible.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: whitespaceVisible.id });
      await ctx.newAssetFace({ assetId: archivedAsset.id, personId: outOfScopeNamed.id });
      await ctx.newAssetFace({ assetId: otherAsset.id, personId: otherNamed.id });

      await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toMatchObject({
        namedVisiblePersonCount: 3,
      });
    });

    it('counts a current-user unnamed person below the minimum face threshold as unassigned', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: '', isHidden: false });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      await expect(sut.getPeopleFaceStatistics(user.id, { minimumFaceCount: 3 })).resolves.toEqual({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 0,
        namedVisiblePersonCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 2,
      });
    });
  });

  describe('getBirthdaysForDay', () => {
    it('should only return visible named people whose birthday matches the target month and day', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { person: matchingPerson } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Alice',
        birthDate: new Date('1990-04-23T00:00:00Z'),
      });
      await ctx.newPerson({
        ownerId: user.id,
        name: 'Bob',
        birthDate: new Date('1990-04-24T00:00:00Z'),
      });
      await ctx.newPerson({
        ownerId: user.id,
        name: '',
        birthDate: new Date('1990-04-23T00:00:00Z'),
      });
      await ctx.newPerson({
        ownerId: user.id,
        name: 'Hidden Alice',
        isHidden: true,
        birthDate: new Date('1990-04-23T00:00:00Z'),
      });
      await ctx.newPerson({
        ownerId: user.id,
        name: 'Milo',
        type: 'pet',
        birthDate: new Date('1990-04-23T00:00:00Z'),
      });

      const result = await sut.getBirthdaysForDay(user.id, { month: 4, day: 23 });

      expect(result).toEqual([
        expect.objectContaining({
          id: matchingPerson.id,
          name: 'Alice',
          birthDate: new Date('1990-04-23T00:00:00Z'),
        }),
      ]);
    });
  });

  describe('getAllWithoutFaces', () => {
    it('should return persons with no asset_face rows, including named ones', async () => {
      // Regression: the previous query used LEFT JOIN + WHERE on the joined table,
      // which silently converts to INNER JOIN and hides persons with zero asset_face
      // rows entirely. Named zombies (e.g. after force-recognition reset unassigned
      // their faces) accumulated in production. This test pins the correct behavior.
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      // Person A: has a visible face → should NOT be returned.
      const { asset: assetA } = await ctx.newAsset({ ownerId: user.id });
      const { person: personA } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      await ctx.newAssetFace({ assetId: assetA.id, personId: personA.id });

      // Person B: named, zero asset_face rows → SHOULD be returned.
      const { person: personB } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });

      // Person C: unnamed, zero asset_face rows → SHOULD be returned.
      const { person: personC } = await ctx.newPerson({ ownerId: user.id });

      const result = await sut.getAllWithoutFaces();
      const ids = result.map((p) => p.id);

      expect(ids).not.toContain(personA.id);
      expect(ids).toContain(personB.id);
      expect(ids).toContain(personC.id);
    });
  });

  describe('getDataForThumbnailGenerationJob', () => {
    it('should not return the edited preview path', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });

      const { assetFace } = await ctx.newAssetFace({
        assetId: asset.id,
        personId: person.id,
        boundingBoxX1: 10,
        boundingBoxY1: 10,
        boundingBoxX2: 90,
        boundingBoxY2: 90,
      });

      // theres a circular dependency between assetFace and person, so we need to update the person after creating the assetFace
      await ctx.database.updateTable('person').set({ faceAssetId: assetFace.id }).where('id', '=', person.id).execute();

      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_edited.jpg',
        isEdited: true,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_unedited.jpg',
        isEdited: false,
      });

      const result = await sut.getDataForThumbnailGenerationJob(person.id);

      expect(result).toEqual(
        expect.objectContaining({
          previewPath: 'preview_unedited.jpg',
        }),
      );
    });
  });

  describe('getStatistics', () => {
    it('counts distinct visible timeline assets and visible faces for a personal person', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id, isVisible: false });

      await expect(sut.getStatistics(person.id)).resolves.toEqual({ assets: 1, faces: 2 });
      expect(firstFace.personId).toBe(person.id);
    });

    it('returns zero asset and face counts for a personal person with no accessible faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Empty' });

      await expect(sut.getStatistics(person.id)).resolves.toEqual({ assets: 0, faces: 0 });
    });
  });

  describe('representative face picker queries', () => {
    it('filters deleted, hidden, and offline representative face candidates', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id });
      const { result: validFaceId } = await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id });
      const { asset: offlineAsset } = await ctx.newAsset({ ownerId: user.id, isOffline: true });
      const { result: offlineFaceId } = await ctx.newAssetFace({ assetId: offlineAsset.id, personId: person.id });
      const { asset: deletedAsset } = await ctx.newAsset({ ownerId: user.id, deletedAt: new Date() });
      const { result: deletedAssetFaceId } = await ctx.newAssetFace({
        assetId: deletedAsset.id,
        personId: person.id,
      });
      const { result: hiddenFaceId } = await ctx.newAssetFace({
        assetId: validAsset.id,
        personId: person.id,
        isVisible: false,
      });
      const { result: deletedFaceId } = await ctx.newAssetFace({
        assetId: validAsset.id,
        personId: person.id,
        deletedAt: new Date(),
      });

      const faces = await sut.getRepresentativeFaces({ personId: person.id, take: 20, skip: 0 });

      expect(faces.map((face) => face.id)).toEqual([validFaceId]);
      await expect(
        sut.getRepresentativeFaceForUpdate({ personId: person.id, assetFaceId: offlineFaceId }),
      ).resolves.toBeUndefined();
      await expect(
        sut.getRepresentativeFaceForUpdate({ personId: person.id, assetFaceId: deletedAssetFaceId }),
      ).resolves.toBeUndefined();
      await expect(
        sut.getRepresentativeFaceForUpdate({ personId: person.id, assetFaceId: hiddenFaceId }),
      ).resolves.toBeUndefined();
      await expect(
        sut.getRepresentativeFaceForUpdate({ personId: person.id, assetFaceId: deletedFaceId }),
      ).resolves.toBeUndefined();
    });

    it('rejects a face linked to a different identity', async () => {
      const { ctx, sut } = setup();
      const faceIdentityRepository = ctx.get(FaceIdentityRepository);
      const { user } = await ctx.newUser();
      const { person: targetPerson } = await ctx.newPerson({ ownerId: user.id });
      const { person: otherPerson } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: targetPerson.id });
      const otherIdentity = await faceIdentityRepository.ensurePersonIdentity(otherPerson.id);
      await faceIdentityRepository.replaceFaceIdentity({
        assetFaceId: faceId,
        identityId: otherIdentity.id,
        source: 'manual',
      });

      const faces = await sut.getRepresentativeFaces({ personId: targetPerson.id, take: 20, skip: 0 });

      expect(faces.map((face) => face.id)).not.toContain(faceId);
      await expect(
        sut.getRepresentativeFaceForUpdate({ personId: targetPerson.id, assetFaceId: faceId }),
      ).resolves.toBeUndefined();
    });
  });
});
