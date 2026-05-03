import { Kysely } from 'kysely';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(SharedSpaceRepository), faceIdentityRepository: ctx.get(FaceIdentityRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

/** Helper: create an asset face and its face_search embedding in one call. Returns the face ID string. */
async function createFaceWithEmbedding(
  ctx: ReturnType<typeof setup>['ctx'],
  opts: { assetId: string; personId?: string | null; isVisible?: boolean },
): Promise<string> {
  const { result: faceId } = await ctx.newAssetFace({
    assetId: opts.assetId,
    personId: opts.personId ?? null,
    ...(opts.isVisible === undefined ? {} : { isVisible: opts.isVisible }),
  });
  await ctx.database.insertInto('face_search').values({ faceId, embedding: newEmbedding() }).execute();
  return faceId;
}

describe('SharedSpaceRepository - face matching pipeline', () => {
  // ==========================================
  // Group B: Face matching ordering scenarios
  // ==========================================

  describe('face matching ordering scenarios', () => {
    it('Scenario 1: all faces recognized, then processSpaceFaceMatch', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });

      // 3 assets, each with 1 face, all assigned to SAME global person
      const faceIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });
        faceIds.push(faceId);
      }

      // Simulate processSpaceFaceMatch for each asset
      let spacePerson: any = null;
      for (const faceId of faceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, person.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
          spacePerson = existing;
        } else {
          spacePerson = await sut.createPerson({
            spaceId: space.id,
            name: '',
            representativeFaceId: faceId,
            type: 'person',
          });
          await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }], { skipRecount: true });
        }
      }

      await sut.recountPersons([spacePerson.id]);

      // Assert: 1 space person with 3 faces
      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(3);
      expect(persons[0].assetCount).toBe(3);
    });

    it('Scenario 2: partial recognition - some faces without personId', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: globalPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });

      // 2 with personId, 2 without
      const recognizedFaceIds: string[] = [];
      const unrecognizedFaceIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: globalPerson.id });
        recognizedFaceIds.push(faceId);
      }
      for (let i = 0; i < 2; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: null });
        unrecognizedFaceIds.push(faceId);
      }

      // Process recognized faces
      let spacePerson: any = null;
      for (const faceId of recognizedFaceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, globalPerson.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
          spacePerson = existing;
        } else {
          spacePerson = await sut.createPerson({
            spaceId: space.id,
            name: '',
            representativeFaceId: faceId,
            type: 'person',
          });
          await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }], { skipRecount: true });
        }
      }

      // Skip unrecognized faces (personId=null -> strict gate)
      await sut.recountPersons([spacePerson.id]);

      let persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(2);

      // Now assign personId to unrecognized faces and re-run
      for (const faceId of unrecognizedFaceIds) {
        await ctx.database
          .updateTable('asset_face')
          .set({ personId: globalPerson.id })
          .where('id', '=', faceId)
          .execute();
      }

      for (const faceId of unrecognizedFaceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, globalPerson.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
        }
      }

      await sut.recountPersons([spacePerson.id]);

      persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(4);
    });

    it('Scenario 3: force-recognition reset rebuilds space persons', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: personP1 } = await ctx.newPerson({ ownerId: user.id, name: 'P1' });
      const { result: personP2 } = await ctx.newPerson({ ownerId: user.id, name: 'P2' });

      // Setup: 2 assets with faces assigned to P1
      const faceIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: personP1.id });
        faceIds.push(faceId);
      }

      // Create space person for P1
      const spacePersonP1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceIds[0],
        type: 'person',
      });
      await sut.addPersonFaces(
        faceIds.map((fId) => ({ personId: spacePersonP1.id, assetFaceId: fId })),
        { skipRecount: true },
      );
      await sut.recountPersons([spacePersonP1.id]);

      // Simulate force reset: delete all space person faces and space persons
      await ctx.database.deleteFrom('shared_space_person_face').where('personId', '=', spacePersonP1.id).execute();
      await sut.deletePerson(spacePersonP1.id);

      // Reassign faces to P2 (simulating re-recognition)
      for (const faceId of faceIds) {
        await ctx.database.updateTable('asset_face').set({ personId: personP2.id }).where('id', '=', faceId).execute();
      }

      // Re-run processSpaceFaceMatch for P2
      let spacePersonP2: any = null;
      for (const faceId of faceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, personP2.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
          spacePersonP2 = existing;
        } else {
          spacePersonP2 = await sut.createPerson({
            spaceId: space.id,
            name: '',
            representativeFaceId: faceId,
            type: 'person',
          });
          await sut.addPersonFaces([{ personId: spacePersonP2.id, assetFaceId: faceId }], { skipRecount: true });
        }
      }
      await sut.recountPersons([spacePersonP2.id]);

      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(2);

      // Old space person is gone
      const oldPerson = await sut.getPersonById(spacePersonP1.id);
      expect(oldPerson).toBeUndefined();
    });

    it('Scenario 4: duplicate processSpaceFaceMatch calls are idempotent', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: globalPerson } = await ctx.newPerson({ ownerId: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: globalPerson.id });

      // First run: create space person
      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }]);

      // Second run: isPersonFaceAssigned should prevent duplicate
      const isAssigned = await sut.isPersonFaceAssigned(faceId, space.id);
      expect(isAssigned).toBe(true);

      // Even if we try to add again, onConflict doNothing prevents duplicates
      const result = await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }]);
      expect(result).toHaveLength(0); // no new rows inserted

      await sut.recountPersons([spacePerson.id]);
      const person = await sut.getPersonById(spacePerson.id);
      expect(person!.faceCount).toBe(1);
    });

    it('Scenario 5: multiple spaces for same library assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id, name: 'Space 1' });
      const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id, name: 'Space 2' });
      const { result: globalPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Charlie' });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space1.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space2.id, assetId: asset.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: globalPerson.id });

      // Create space person in space 1
      const sp1 = await sut.createPerson({
        spaceId: space1.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: faceId }]);

      // Create space person in space 2
      const sp2 = await sut.createPerson({
        spaceId: space2.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: faceId }]);

      // Each space has its own independent space person
      const persons1 = await sut.getPersonsBySpaceId(space1.id, { withHidden: true, petsEnabled: true });
      const persons2 = await sut.getPersonsBySpaceId(space2.id, { withHidden: true, petsEnabled: true });
      expect(persons1).toHaveLength(1);
      expect(persons2).toHaveLength(1);
      expect(persons1[0].id).not.toBe(persons2[0].id);

      // Both link to the same underlying face
      expect(persons1[0].faceCount).toBe(1);
      expect(persons2[0].faceCount).toBe(1);
    });

    it('Scenario 6: force-detection reset cascades to space persons', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: 'Cascade' });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });

      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }]);

      // Verify assigned
      expect(await sut.isPersonFaceAssigned(faceId, space.id)).toBe(true);

      // Hard-delete asset_face row (simulating force-detection reset)
      // face_search has ON DELETE CASCADE from asset_face
      // shared_space_person_face has ON DELETE CASCADE from asset_face
      await ctx.database.deleteFrom('asset_face').where('id', '=', faceId).execute();

      // Verify shared_space_person_face row is gone (CASCADE)
      const rows = await ctx.database
        .selectFrom('shared_space_person_face')
        .selectAll()
        .where('assetFaceId', '=', faceId)
        .execute();
      expect(rows).toHaveLength(0);

      // deleteOrphanedPersons should remove the space person (no faces left)
      await sut.deleteOrphanedPersons(space.id);
      const deleted = await sut.getPersonById(spacePerson.id);
      expect(deleted).toBeUndefined();
    });

    it('Scenario 7: cross-owner faces matched to same space person via Layer 1', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user1.id });

      // Both users have faces assigned to the SAME global person (user1 owns the person)
      const { result: globalPerson } = await ctx.newPerson({ ownerId: user1.id, name: 'Shared' });

      const { asset: asset1 } = await ctx.newAsset({ ownerId: user1.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset1.id, personId: globalPerson.id });

      const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset2.id, personId: globalPerson.id });

      // Process face1: no existing space person, create one
      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face1 }], { skipRecount: true });

      // Process face2: Layer 1 finds existing space person by linked personId
      const existing = await sut.findSpacePersonByLinkedPersonId(space.id, globalPerson.id);
      expect(existing).toBeDefined();
      expect(existing!.id).toBe(spacePerson.id);

      await sut.addPersonFaces([{ personId: existing!.id, assetFaceId: face2 }], { skipRecount: true });
      await sut.recountPersons([spacePerson.id]);

      // Both faces matched to same space person
      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(2);
      expect(persons[0].assetCount).toBe(2);
    });

    it('Scenario 8: space created AFTER all recognition completes', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { result: globalPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Late' });

      // 1. Create assets with faces, all personIds assigned (before space exists)
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      const faceIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: globalPerson.id });
        faceIds.push(faceId);
      }

      // 2. Create space, link library (late space creation)
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

      // 3. Run processSpaceFaceMatch for all faces
      let spacePerson: any = null;
      for (const faceId of faceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, globalPerson.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
          spacePerson = existing;
        } else {
          spacePerson = await sut.createPerson({
            spaceId: space.id,
            name: '',
            representativeFaceId: faceId,
            type: 'person',
          });
          await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }], { skipRecount: true });
        }
      }
      await sut.recountPersons([spacePerson.id]);

      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);
      expect(persons[0].faceCount).toBe(3);
      expect(persons[0].assetCount).toBe(3);
    });

    it('returns identity evidence for faces reachable only through a linked library', async () => {
      const { ctx, sut, faceIdentityRepository } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: 'Linked Evidence' });
      const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
      const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });
      await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        identityId: identity.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: faceId }]);

      const evidence = await sut.getIdentityEvidenceForSpacePerson(space.id, spacePerson.id, [identity.id]);

      expect(evidence).toEqual([{ identityId: identity.id, type: 'person', supportingFaceCount: 1 }]);
    });

    it('Scenario 9: same global person across multiple assets shares one space person', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: 'Multi-Asset Person' });

      // 3 assets, each with 1 face assigned to the SAME global person
      const faceIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });
        faceIds.push(faceId);
      }

      // Simulate processSpaceFaceMatch: Layer 1 should reuse same space person
      let spacePersonId: string | undefined;
      for (const faceId of faceIds) {
        const existing = await sut.findSpacePersonByLinkedPersonId(space.id, person.id);
        if (existing) {
          await sut.addPersonFaces([{ personId: existing.id, assetFaceId: faceId }], { skipRecount: true });
          spacePersonId = existing.id;
        } else {
          const sp = await sut.createPerson({
            spaceId: space.id,
            name: '',
            representativeFaceId: faceId,
            type: 'person',
          });
          await sut.addPersonFaces([{ personId: sp.id, assetFaceId: faceId }], { skipRecount: true });
          spacePersonId = sp.id;
        }
      }

      await sut.recountPersons([spacePersonId!]);

      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(1);

      const sp = await sut.getPersonById(spacePersonId!);
      expect(sp?.faceCount).toBe(3);
      expect(sp?.assetCount).toBe(3);
    });
  });

  // ==========================================
  // Group A: Visibility
  // ==========================================

  describe('space person visibility', () => {
    it('should correctly count space persons across varied states', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1: has global person with valid thumbnail
      const { result: person1 } = await ctx.newPerson({ ownerId: user.id, name: 'Person1', thumbnailPath: '/thumb1' });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset1.id, personId: person1.id });
      const sp1 = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: face1, type: 'person' });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1 }]);

      // SP2: has global person with empty thumbnailPath
      const { result: person2 } = await ctx.newPerson({ ownerId: user.id, name: 'Person2', thumbnailPath: '' });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset2.id, personId: person2.id });
      const sp2 = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: face2, type: 'person' });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2 }]);

      // SP3: representative face has personId=null (no global person)
      const { asset: asset3 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset3.id });
      const face3 = await createFaceWithEmbedding(ctx, { assetId: asset3.id, personId: null });
      const sp3 = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: face3, type: 'person' });
      await sut.addPersonFaces([{ personId: sp3.id, assetFaceId: face3 }]);

      // SP4: representative face was soft-deleted (deletedAt set)
      const { asset: asset4 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset4.id });
      const face4 = await createFaceWithEmbedding(ctx, { assetId: asset4.id });
      const sp4 = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: face4, type: 'person' });
      await sut.addPersonFaces([{ personId: sp4.id, assetFaceId: face4 }]);
      await ctx.database.updateTable('asset_face').set({ deletedAt: new Date() }).where('id', '=', face4).execute();

      // SP5: has global person but person was deleted (simulate by referencing non-existent person)
      const { result: person5 } = await ctx.newPerson({ ownerId: user.id, name: 'Person5' });
      const { asset: asset5 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset5.id });
      const face5 = await createFaceWithEmbedding(ctx, { assetId: asset5.id, personId: person5.id });
      const sp5 = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: face5, type: 'person' });
      await sut.addPersonFaces([{ personId: sp5.id, assetFaceId: face5 }]);
      // Delete the global person (face FK is nullable, so this nullifies asset_face.personId)
      await ctx.database.deleteFrom('person').where('id', '=', person5.id).execute();

      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toHaveLength(5);
    });

    it('should return correct results with takenAfter temporal filter', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 has faces on assets with fileCreatedAt in 2024
      const { asset: asset2024 } = await ctx.newAsset({ ownerId: user.id, fileCreatedAt: new Date('2024-06-15') });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2024.id });
      const face2024 = await createFaceWithEmbedding(ctx, { assetId: asset2024.id });
      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: 'Old',
        representativeFaceId: face2024,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face2024 }]);

      // SP2 has faces on assets with fileCreatedAt in 2026
      const { asset: asset2026 } = await ctx.newAsset({ ownerId: user.id, fileCreatedAt: new Date('2026-06-15') });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2026.id });
      const face2026 = await createFaceWithEmbedding(ctx, { assetId: asset2026.id });
      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: 'New',
        representativeFaceId: face2026,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2026 }]);

      const persons = await sut.getPersonsBySpaceId(space.id, {
        withHidden: true,
        petsEnabled: true,
        takenAfter: new Date('2025-01-01'),
      });
      expect(persons).toHaveLength(1);
      expect(persons[0].id).toBe(sp2.id);
    });

    it('should return empty array for space with no faces or persons', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const persons = await sut.getPersonsBySpaceId(space.id, { withHidden: true, petsEnabled: true });
      expect(persons).toEqual([]);
    });

    it('should show space person when global person has empty thumbnailPath', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: person } = await ctx.newPerson({ ownerId: user.id, thumbnailPath: '' });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: 'Empty Thumb',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp.id, assetFaceId: faceId }], { skipRecount: false });

      const result = await sut.getPersonsBySpaceId(space.id, {});
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Empty Thumb');
    });

    it('should show space person when representative face has no global person', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: null });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: 'No Global Person',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp.id, assetFaceId: faceId }], { skipRecount: false });

      const result = await sut.getPersonsBySpaceId(space.id, {});
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('No Global Person');
    });

    it('should show space person when global person is later deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Soon Deleted',
        thumbnailPath: '/thumb.jpg',
      });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: person.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: 'Survives Delete',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp.id, assetFaceId: faceId }], { skipRecount: false });

      // Delete the global person — face's personId becomes dangling
      // First null out the face's personId (FK constraint), then delete person
      await ctx.database.updateTable('asset_face').set({ personId: null }).where('personId', '=', person.id).execute();
      await ctx.database.deleteFrom('person').where('id', '=', person.id).execute();

      const result = await sut.getPersonsBySpaceId(space.id, {});
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Survives Delete');
    });
  });

  // ==========================================
  // Group C: Dedup correctness
  // ==========================================

  describe('dedup correctness', () => {
    it('should preserve space person with more faces during merge', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 with 3 faces on one asset
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const sp1FaceIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset1.id });
        sp1FaceIds.push(faceId);
      }

      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: sp1FaceIds[0],
        type: 'person',
      });
      await sut.addPersonFaces(
        sp1FaceIds.map((fId) => ({ personId: sp1.id, assetFaceId: fId })),
        { skipRecount: true },
      );

      // SP2 with 1 face on another asset
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const sp2FaceId = await createFaceWithEmbedding(ctx, { assetId: asset2.id });

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: sp2FaceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: sp2FaceId }], { skipRecount: true });

      // Merge: reassign SP2 faces to SP1
      await sut.reassignPersonFacesSafe(sp2.id, sp1.id);
      await sut.deletePerson(sp2.id);
      await sut.recountPersons([sp1.id]);

      const person = await sut.getPersonById(sp1.id);
      expect(person!.faceCount).toBe(4);
      expect(person!.assetCount).toBe(2);

      // SP2 is gone
      const deleted = await sut.getPersonById(sp2.id);
      expect(deleted).toBeUndefined();
    });

    it('should handle space persons without face_search entry', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 with face_search entry
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const face1Id = await createFaceWithEmbedding(ctx, { assetId: asset1.id });

      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: 'With embedding',
        representativeFaceId: face1Id,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1Id }]);

      // SP2 WITHOUT face_search entry
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const { result: face2Id } = await ctx.newAssetFace({ assetId: asset2.id });
      // Deliberately no face_search row for face2

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: 'Without embedding',
        representativeFaceId: face2Id,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2Id }]);

      // getSpacePersonsWithEmbeddings should only return SP1
      const withEmbeddings = await sut.getSpacePersonsWithEmbeddings(space.id);
      expect(withEmbeddings).toHaveLength(1);
      expect(withEmbeddings[0].id).toBe(sp1.id);

      // SP2 should still exist
      const sp2Check = await sut.getPersonById(sp2.id);
      expect(sp2Check).toBeDefined();
    });

    it('should transfer name from source to target when target is unnamed', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 (unnamed, 3 faces on separate assets)
      const sp1FaceIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id });
        sp1FaceIds.push(faceId);
      }

      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: sp1FaceIds[0],
        type: 'person',
      });
      await sut.addPersonFaces(
        sp1FaceIds.map((fId) => ({ personId: sp1.id, assetFaceId: fId })),
        { skipRecount: true },
      );

      // SP2 (named 'Alice', 1 face)
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const sp2FaceId = await createFaceWithEmbedding(ctx, { assetId: asset2.id });

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: sp2FaceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: sp2FaceId }], { skipRecount: true });

      // Merge SP2 into SP1
      await sut.reassignPersonFacesSafe(sp2.id, sp1.id);

      // Transfer name (application logic, but we test the updatePerson method)
      await sut.updatePerson(sp1.id, { name: 'Alice' });
      await sut.deletePerson(sp2.id);
      await sut.recountPersons([sp1.id]);

      const person = await sut.getPersonById(sp1.id);
      expect(person!.name).toBe('Alice');
      expect(person!.faceCount).toBe(4);
      expect(person!.assetCount).toBe(4);
    });

    it('should find closest space person by embedding similarity', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 with embedding E1
      const embeddingE1 = newEmbedding();
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const { result: face1Id } = await ctx.newAssetFace({ assetId: asset1.id });
      await ctx.database.insertInto('face_search').values({ faceId: face1Id, embedding: embeddingE1 }).execute();

      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: 'SP1',
        representativeFaceId: face1Id,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1Id }]);

      // SP2 with embedding E2
      const embeddingE2 = newEmbedding();
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const { result: face2Id } = await ctx.newAssetFace({ assetId: asset2.id });
      await ctx.database.insertInto('face_search').values({ faceId: face2Id, embedding: embeddingE2 }).execute();

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: 'SP2',
        representativeFaceId: face2Id,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2Id }]);

      // Query with E1 should find SP1
      const result1 = await sut.findClosestSpacePerson(space.id, embeddingE1, { maxDistance: 0.6, numResults: 1 });
      expect(result1).toHaveLength(1);
      expect(result1[0].personId).toBe(sp1.id);

      // Query with E2 should find SP2
      const result2 = await sut.findClosestSpacePerson(space.id, embeddingE2, { maxDistance: 0.6, numResults: 1 });
      expect(result2).toHaveLength(1);
      expect(result2[0].personId).toBe(sp2.id);
    });

    it('should NOT find matches when embeddings are dissimilar', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // Create space person with random embedding
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp.id, assetFaceId: faceId }]);

      // Query with a different random embedding, using very tight threshold
      const differentEmbedding = newEmbedding();
      const results = await sut.findClosestSpacePerson(space.id, differentEmbedding, {
        maxDistance: 0.01,
        numResults: 1,
      });
      expect(results).toHaveLength(0);
    });

    it('should handle null representativeFaceId in getSpacePersonsWithEmbeddings', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // SP1 with valid representativeFaceId + face_search
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const face1Id = await createFaceWithEmbedding(ctx, { assetId: asset1.id });

      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: 'With embedding',
        representativeFaceId: face1Id,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1Id }]);

      // SP2 with representativeFaceId=null
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const face2Id = await createFaceWithEmbedding(ctx, { assetId: asset2.id });

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: 'Without representative',
        representativeFaceId: null as any,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2Id }]);

      // getSpacePersonsWithEmbeddings: INNER JOIN on representativeFaceId -> face_search
      const withEmbeddings = await sut.getSpacePersonsWithEmbeddings(space.id);
      expect(withEmbeddings).toHaveLength(1);
      expect(withEmbeddings[0].id).toBe(sp1.id);

      // SP2 still exists
      const sp2Check = await sut.getPersonById(sp2.id);
      expect(sp2Check).toBeDefined();
    });
  });

  // ==========================================
  // Group D: Recount accuracy
  // ==========================================

  describe('recount accuracy', () => {
    it('should count distinct assets for assetCount', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // Asset A with 2 faces
      const { asset: assetA } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetA.id });
      const faceA1 = await createFaceWithEmbedding(ctx, { assetId: assetA.id });
      const faceA2 = await createFaceWithEmbedding(ctx, { assetId: assetA.id });

      // Asset B with 1 face
      const { asset: assetB } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetB.id });
      const faceB = await createFaceWithEmbedding(ctx, { assetId: assetB.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceA1,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: sp.id, assetFaceId: faceA1 },
          { personId: sp.id, assetFaceId: faceA2 },
          { personId: sp.id, assetFaceId: faceB },
        ],
        { skipRecount: true },
      );

      await sut.recountPersons([sp.id]);

      const person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(3);
      expect(person!.assetCount).toBe(2);
    });

    it('should exclude invisible faces from counts', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      // 2 visible faces + 1 invisible
      const visible1 = await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: true });
      const visible2 = await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: true });
      const invisible = await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: false });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: visible1,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: sp.id, assetFaceId: visible1 },
          { personId: sp.id, assetFaceId: visible2 },
          { personId: sp.id, assetFaceId: invisible },
        ],
        { skipRecount: true },
      );

      await sut.recountPersons([sp.id]);

      const person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(2);
      expect(person!.assetCount).toBe(1);
    });

    it('should exclude trashed assets from counts', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // Asset A (normal)
      const { asset: assetA } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetA.id });
      const faceA = await createFaceWithEmbedding(ctx, { assetId: assetA.id });

      // Asset B (trashed)
      const { asset: assetB } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetB.id });
      const faceB = await createFaceWithEmbedding(ctx, { assetId: assetB.id });
      // Trash asset B
      await ctx.database.updateTable('asset').set({ deletedAt: new Date() }).where('id', '=', assetB.id).execute();

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceA,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: sp.id, assetFaceId: faceA },
          { personId: sp.id, assetFaceId: faceB },
        ],
        { skipRecount: true },
      );

      await sut.recountPersons([sp.id]);

      const person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(1);
      expect(person!.assetCount).toBe(1);
    });

    it('should have accurate counts after incremental additions', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const faceIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
        const faceId = await createFaceWithEmbedding(ctx, { assetId: asset.id });
        faceIds.push(faceId);
      }

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faceIds[0],
        type: 'person',
      });

      // Add 3 faces
      await sut.addPersonFaces(
        faceIds.slice(0, 3).map((fId) => ({ personId: sp.id, assetFaceId: fId })),
        { skipRecount: true },
      );
      await sut.recountPersons([sp.id]);

      let person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(3);

      // Add 2 more
      await sut.addPersonFaces(
        faceIds.slice(3).map((fId) => ({ personId: sp.id, assetFaceId: fId })),
        { skipRecount: true },
      );
      await sut.recountPersons([sp.id]);

      person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(5);
      expect(person!.assetCount).toBe(5);
    });

    it('should handle recount with zero faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: sp.id, assetFaceId: face1 },
          { personId: sp.id, assetFaceId: face2 },
        ],
        { skipRecount: true },
      );
      await sut.recountPersons([sp.id]);

      let person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(2);

      // Delete all face rows manually
      await ctx.database.deleteFrom('shared_space_person_face').where('personId', '=', sp.id).execute();
      await sut.recountPersons([sp.id]);

      person = await sut.getPersonById(sp.id);
      expect(person!.faceCount).toBe(0);
      expect(person!.assetCount).toBe(0);
    });
  });

  // ==========================================
  // Group E: Filtering and phantom photos
  // ==========================================

  describe('filtering and phantom photos', () => {
    it('should correctly identify assigned faces via isPersonFaceAssigned', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset.id });

      const sp = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp.id, assetFaceId: face1 }]);

      expect(await sut.isPersonFaceAssigned(face1, space.id)).toBe(true);
      expect(await sut.isPersonFaceAssigned(face2, space.id)).toBe(false);
    });

    it('should not have phantom assignments after reassignPersonFacesSafe', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset.id });

      // SP1 has face1
      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1 }], { skipRecount: true });

      // SP2 has face2
      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face2,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2 }], { skipRecount: true });

      // Reassign SP1 faces to SP2
      await sut.reassignPersonFacesSafe(sp1.id, sp2.id);
      await sut.recountPersons([sp1.id, sp2.id]);

      // SP2 should now have both faces
      const sp2After = await sut.getPersonById(sp2.id);
      expect(sp2After!.faceCount).toBe(2);

      // SP1 should have 0 faces
      const sp1After = await sut.getPersonById(sp1.id);
      expect(sp1After!.faceCount).toBe(0);

      // face1 is now assigned to SP2's space, not SP1
      expect(await sut.isPersonFaceAssigned(face1, space.id)).toBe(true);
    });

    it('should clean up orphaned persons after all faces removed', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset.id });

      // SP1 with 1 face
      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1 }], { skipRecount: true });

      // SP2 with its own face
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset2.id });

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face2,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2 }], { skipRecount: true });

      // Reassign SP1's face to SP2 -> SP1 now has no faces
      await sut.reassignPersonFacesSafe(sp1.id, sp2.id);

      // deleteOrphanedPersons should remove SP1 (no faces)
      await sut.deleteOrphanedPersons(space.id);

      const sp1After = await sut.getPersonById(sp1.id);
      expect(sp1After).toBeUndefined();

      // SP2 still exists with faces
      const sp2After = await sut.getPersonById(sp2.id);
      expect(sp2After).toBeDefined();
      await sut.recountPersons([sp2.id]);
      const sp2Recounted = await sut.getPersonById(sp2.id);
      expect(sp2Recounted!.faceCount).toBe(2);
    });

    it('should return faces for matching only when visible and not deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // F1: visible, not deleted, has face_search -> included
      const f1 = await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: true });

      // F2: invisible (isVisible=false), has face_search -> excluded
      await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: false });

      // F3: soft-deleted (deletedAt set), has face_search -> excluded
      const f3 = await createFaceWithEmbedding(ctx, { assetId: asset.id, isVisible: true });
      await ctx.database.updateTable('asset_face').set({ deletedAt: new Date() }).where('id', '=', f3).execute();

      const faces = await sut.getAssetFacesForMatching(asset.id);
      expect(faces).toHaveLength(1);
      expect(faces[0].id).toBe(f1);
    });

    it('should not have phantom assignments after face reassignment across persons', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset1.id });

      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      const face2 = await createFaceWithEmbedding(ctx, { assetId: asset2.id });

      // SP1 has face1, SP2 has face2
      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1 }], { skipRecount: true });

      const sp2 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face2,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp2.id, assetFaceId: face2 }], { skipRecount: true });

      // Reassign SP1 faces to SP2
      await sut.reassignPersonFacesSafe(sp1.id, sp2.id);

      // Verify via DB: face1 now points to SP2
      const faceRow = await ctx.database
        .selectFrom('shared_space_person_face')
        .selectAll()
        .where('assetFaceId', '=', face1)
        .executeTakeFirst();
      expect(faceRow!.personId).toBe(sp2.id);

      // face1 is still assigned in the space
      expect(await sut.isPersonFaceAssigned(face1, space.id)).toBe(true);

      // SP1 has 0 faces after recount
      await sut.recountPersons([sp1.id, sp2.id]);
      const sp1After = await sut.getPersonById(sp1.id);
      expect(sp1After!.faceCount).toBe(0);

      // deleteOrphanedPersons removes SP1
      await sut.deleteOrphanedPersons(space.id);
      const sp1Deleted = await sut.getPersonById(sp1.id);
      expect(sp1Deleted).toBeUndefined();

      // Only SP2 exists with both F1 and F2
      const sp2After = await sut.getPersonById(sp2.id);
      expect(sp2After).toBeDefined();
      expect(sp2After!.faceCount).toBe(2);
    });

    it('should track face personId changes independently of space assignment', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { result: personP1 } = await ctx.newPerson({ ownerId: user.id, name: 'P1' });
      const { result: personP2 } = await ctx.newPerson({ ownerId: user.id, name: 'P2' });

      // Create face F1 with personId=P1
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const face1 = await createFaceWithEmbedding(ctx, { assetId: asset.id, personId: personP1.id });

      // Create space person SP1, add F1 to SP1
      const sp1 = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face1,
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: sp1.id, assetFaceId: face1 }]);

      // Change F1's personId to P2 (simulate re-recognition)
      await ctx.database.updateTable('asset_face').set({ personId: personP2.id }).where('id', '=', face1).execute();

      // Space assignment is unchanged
      expect(await sut.isPersonFaceAssigned(face1, space.id)).toBe(true);

      // findSpacePersonByLinkedPersonId: P1 no longer linked (no faces with P1)
      const byP1 = await sut.findSpacePersonByLinkedPersonId(space.id, personP1.id);
      expect(byP1).toBeUndefined();

      // findSpacePersonByLinkedPersonId: P2 now linked (F1 has P2)
      const byP2 = await sut.findSpacePersonByLinkedPersonId(space.id, personP2.id);
      expect(byP2).toBeDefined();
      expect(byP2!.id).toBe(sp1.id);
    });
  });
});
