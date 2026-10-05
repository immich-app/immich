import { NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto.js';
import { AssetFaceCreateDto, PersonSearchDto, PersonUserRole } from 'src/dtos/person.dto.js';
import { AssetFileType, JobName } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository.js';
import { AssetJobRepository } from 'src/repositories/asset-job.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { ClusterGroupRepository } from 'src/repositories/cluster-group.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository.js';
import { PersonUserRepository } from 'src/repositories/person-user.repository.js';
import { PersonRepository } from 'src/repositories/person.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { PersonService } from 'src/services/person.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory, newUuid } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(PersonService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AssetJobRepository,
      ConfigRepository,
      DatabaseRepository,
      PersonRepository,
      PersonUserRepository,
      AssetRepository,
      AssetEditRepository,
      SystemMetadataRepository,
      UserRepository,
      ClusterGroupRepository,
    ],
    mock: [JobRepository, LoggingRepository, StorageRepository, MachineLearningRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(PersonService.name, () => {
  describe('reassignFaces', () => {
    it('should require access to the person the auth user is assigning to', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user2.id });

      await expect(sut.reassignFaces(factory.auth({ user }), person.personGroupId, { data: [] })).rejects.toThrow(
        'Not found or no person.update access',
      );
    });

    it('should allow person owner access', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });

      await expect(sut.reassignFaces(factory.auth({ user }), person.personGroupId, { data: [] })).resolves.toEqual([]);
    });

    it('should not allow shared read only access', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user2.id });
      await ctx.newPersonUser({
        personGroupId: person.personGroupId,
        sharedById: user2.id,
        sharedWithId: user.id,
        role: PersonUserRole.Read,
      });

      await expect(
        sut.reassignFaces(factory.auth({ user }), person.personGroupId, {
          data: [{ personId: person.personGroupId, userId: user2.id, assetId: newUuid() }],
        }),
      ).rejects.toThrow('Not found or no person.update access');
    });

    it('should allow shared write access', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user2.id });
      await ctx.newPersonUser({
        personGroupId: person.personGroupId,
        sharedById: user2.id,
        sharedWithId: user.id,
        role: PersonUserRole.Write,
      });

      await expect(
        sut.reassignFaces(factory.auth({ user }), person.personGroupId, {
          data: [{ personId: person.personGroupId, userId: user2.id, assetId: newUuid() }],
        }),
      ).resolves.toEqual([expect.objectContaining({ id: person.personGroupId })]);
    });
  });

  describe('getAll', () => {
    it('should filter by sharing direction and user', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser({ clusterGroupId: user1.clusterGroupId });
      const { user: user3 } = await ctx.newUser({ clusterGroupId: user1.clusterGroupId });
      const { asset } = await ctx.newAsset({ ownerId: user1.id });

      const { person: sharedByMe } = await ctx.newPerson({ ownerId: user1.id, name: 'Shared by me' });
      const { person: notShared } = await ctx.newPerson({ ownerId: user1.id, name: 'Not shared' });
      const { person: sharedWithMe } = await ctx.newPerson({ ownerId: user3.id, name: 'Shared with me' });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: sharedByMe.personGroupId });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: notShared.personGroupId });
      await ctx.newPersonUser({
        personGroupId: sharedByMe.personGroupId,
        sharedById: user1.id,
        sharedWithId: user2.id,
      });
      await ctx.newPersonUser({
        personGroupId: sharedWithMe.personGroupId,
        sharedById: user3.id,
        sharedWithId: user1.id,
      });

      const auth = factory.auth({ user: user1 });
      const getIds = async (dto: Partial<PersonSearchDto>) => {
        const { people, total } = await sut.getAll(auth, { page: 1, size: 10, ...dto });
        expect(total).toBe(people.length);
        return people.map(({ id }) => id).toSorted();
      };

      await expect(getIds({})).resolves.toEqual(
        [sharedByMe.personGroupId, notShared.personGroupId, sharedWithMe.personGroupId].toSorted(),
      );
      await expect(getIds({ sharedById: user1.id })).resolves.toEqual([sharedByMe.personGroupId]);
      await expect(getIds({ sharedWithId: user2.id })).resolves.toEqual([sharedByMe.personGroupId]);
      await expect(getIds({ sharedWithId: user3.id })).resolves.toEqual([]);
      await expect(getIds({ sharedWithId: user1.id })).resolves.toEqual([sharedWithMe.personGroupId]);
      await expect(getIds({ sharedById: user3.id })).resolves.toEqual([sharedWithMe.personGroupId]);
      await expect(getIds({ sharedById: user2.id })).resolves.toEqual([]);
    });

    it('should filter by favorite and hidden', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person: favorite } = await ctx.newPerson({ ownerId: user.id, isFavorite: true });
      const { person: hidden } = await ctx.newPerson({ ownerId: user.id, isHidden: true });
      const { person: neither } = await ctx.newPerson({ ownerId: user.id });
      for (const person of [favorite, hidden, neither]) {
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      }

      const auth = factory.auth({ user });
      const getIds = async (dto: Partial<PersonSearchDto>) => {
        const { people, total } = await sut.getAll(auth, { page: 1, size: 10, withHidden: true, ...dto });
        expect(total).toBe(people.length);
        return people.map(({ id }) => id).toSorted();
      };

      await expect(getIds({ isFavorite: true })).resolves.toEqual([favorite.personGroupId]);
      await expect(getIds({ isFavorite: false })).resolves.toEqual(
        [hidden.personGroupId, neither.personGroupId].toSorted(),
      );
      await expect(getIds({ isHidden: true })).resolves.toEqual([hidden.personGroupId]);
      await expect(getIds({ isHidden: false })).resolves.toEqual(
        [favorite.personGroupId, neither.personGroupId].toSorted(),
      );
      await expect(getIds({ isFavorite: true, isHidden: true })).resolves.toEqual([]);
    });

    it('should include hidden people when filtering by isHidden without withHidden', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person: hidden } = await ctx.newPerson({ ownerId: user.id, isHidden: true });
      const { person: visible } = await ctx.newPerson({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: hidden.personGroupId });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: visible.personGroupId });

      const auth = factory.auth({ user });

      await expect(sut.getAll(auth, { page: 1, size: 10, isHidden: true })).resolves.toEqual(
        expect.objectContaining({ people: [expect.objectContaining({ id: hidden.personGroupId })], total: 1 }),
      );
      await expect(sut.getAll(auth, { page: 1, size: 10, isHidden: false })).resolves.toEqual(
        expect.objectContaining({ people: [expect.objectContaining({ id: visible.personGroupId })], total: 1 }),
      );
    });
  });

  describe('getById', () => {
    it('should require person.read access', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });

      await expect(sut.getById(factory.auth(), person.personGroupId)).rejects.toThrow(
        'Not found or no person.read access',
      );
    });

    it('should return own version of shared person but copy over a shared name and birth date', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user2.id, name: "User2's person", birthDate: new Date() });
      await ctx.newPersonUser({ personGroupId: person.personGroupId, sharedById: user2.id, sharedWithId: user.id });

      await expect(sut.getById(factory.auth({ user }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({
          id: person.personGroupId,
          name: person.name,
          birthDate: expect.any(String),
          otherPeople: [expect.objectContaining({ sharedById: user2.id })],
        }),
      );
    });

    it('should include the users the person is shared by and shared with', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      await ctx.newPersonUser({
        personGroupId: person.personGroupId,
        sharedById: owner.id,
        sharedWithId: user1.id,
        role: PersonUserRole.Write,
      });

      await expect(sut.getById(factory.auth({ user: owner }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({
          sharedBy: [],
          sharedWith: [expect.objectContaining({ id: user1.id, email: user1.email, role: PersonUserRole.Write })],
        }),
      );
      await expect(sut.getById(factory.auth({ user: user1 }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({
          sharedBy: [expect.objectContaining({ id: owner.id, email: owner.email, role: PersonUserRole.Write })],
          sharedWith: [],
        }),
      );
    });
  });

  describe('getThumbnail', () => {
    it('should require person.read access', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });

      await expect(sut.getThumbnail(factory.auth(), person.personGroupId)).rejects.toThrow(
        'Not found or no person.read access',
      );
    });

    it('should return own thumbnail path', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });

      await expect(sut.getThumbnail(factory.auth({ user }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({ path: person.thumbnailPath }),
      );
    });

    it('should fall back to shared thumbnail path', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user2.id });
      await ctx.newPersonUser({ personGroupId: person.personGroupId, sharedById: user2.id, sharedWithId: user.id });

      await expect(sut.getThumbnail(factory.auth({ user }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({ path: person.thumbnailPath }),
      );
    });

    it('should fail if there is no (shared) thumbnail available', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, thumbnailPath: undefined });
      await ctx.newPerson({ ownerId: user2.id, personGroupId: person.personGroupId });

      await expect(sut.getThumbnail(factory.auth({ user }), person.personGroupId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should throw an error when there is no access', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      const personId = factory.uuid();
      await expect(sut.delete(auth, personId, {})).rejects.toThrow('Not found or no person.delete access');
    });

    it('should delete the person', async () => {
      const { sut, ctx } = setup();
      const personRepo = ctx.get(PersonRepository);
      const storageMock = ctx.getMock(StorageRepository);
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const auth = factory.auth({ user });
      storageMock.unlink.mockResolvedValue();

      await expect(personRepo.getByGroupId(person)).resolves.toEqual(
        expect.objectContaining({ personGroupId: person.personGroupId }),
      );
      await expect(sut.delete(auth, person.personGroupId, {})).resolves.toBeUndefined();
      await expect(personRepo.getByGroupId(person)).resolves.toBeUndefined();

      expect(storageMock.unlink).toHaveBeenCalledWith(person.thumbnailPath);
    });
  });

  describe('deleteAll', () => {
    it('should throw an error when there is no access', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      const personId = factory.uuid();
      await expect(sut.deleteAll(auth, { ids: [personId] })).rejects.toThrow('Not found or no person.delete access');
    });

    it('should delete the person', async () => {
      const { sut, ctx } = setup();
      const storageMock = ctx.getMock(StorageRepository);
      const personRepo = ctx.get(PersonRepository);
      const { user } = await ctx.newUser();
      const { person: person1 } = await ctx.newPerson({ ownerId: user.id });
      const { person: person2 } = await ctx.newPerson({ ownerId: user.id });
      const auth = factory.auth({ user });
      storageMock.unlink.mockResolvedValue();

      await expect(
        sut.deleteAll(auth, { ids: [person1.personGroupId, person2.personGroupId] }),
      ).resolves.toBeUndefined();
      await expect(personRepo.getByGroupId(person1)).resolves.toBeUndefined();
      await expect(personRepo.getByGroupId(person2)).resolves.toBeUndefined();

      expect(storageMock.unlink).toHaveBeenCalledTimes(2);
      expect(storageMock.unlink).toHaveBeenCalledWith(person1.thumbnailPath);
      expect(storageMock.unlink).toHaveBeenCalledWith(person2.thumbnailPath);
    });
  });

  describe('handleDetectFaces', () => {
    it('should prefer an edited preview file', async () => {
      const { sut, ctx } = setup();
      const config = await ctx.getConfig();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        isEdited: true,
        path: 'edited_file.jpg',
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        isEdited: false,
        path: 'unedited_file.jpg',
      });
      ctx
        .getMock(MachineLearningRepository)
        .detectFaces.mockResolvedValue({ imageHeight: 42, imageWidth: 69, faces: [] });

      await sut.handleDetectFaces({ id: asset.id });

      expect(ctx.getMock(MachineLearningRepository).detectFaces).toHaveBeenCalledWith(
        'edited_file.jpg',
        config.machineLearning.facialRecognition,
      );
    });
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should delete all people and queue faces for recognition', async () => {
      const { sut, ctx } = setup();
      const jobRepo = ctx.getMock(JobRepository);
      ctx.getMock(StorageRepository).unlink.mockResolvedValue();
      jobRepo.waitForQueueCompletion.mockResolvedValue();
      jobRepo.getJobCounts.mockResolvedValue({ active: 0, waiting: 0, completed: 0, delayed: 0, failed: 0, paused: 0 });
      jobRepo.queueAll.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: assetUser1 } = await ctx.newAsset({ ownerId: user1.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { person: personUser1 } = await ctx.newPerson({ ownerId: user1.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      const { assetFace: assetFaceUser1 } = await ctx.newAssetFace({
        assetId: assetUser1.id,
        personGroupId: personUser1.personGroupId,
      });

      await sut.handleQueueRecognizeFaces({ force: true });

      await expect(ctx.database.selectFrom('person').selectAll().execute()).resolves.toHaveLength(0);
      expect(jobRepo.queueAll).toHaveBeenCalledWith(
        expect.objectContaining([
          { name: JobName.FacialRecognition, data: { id: assetFace.id, deferred: false } },
          { name: JobName.FacialRecognition, data: { id: assetFaceUser1.id, deferred: false } },
        ]),
      );
    });

    it('should only delete all people of a specified cluster group and queue their faces for recognition', async () => {
      const { sut, ctx } = setup();
      const jobRepo = ctx.getMock(JobRepository);
      ctx.getMock(StorageRepository).unlink.mockResolvedValue();
      jobRepo.waitForQueueCompletion.mockResolvedValue();
      jobRepo.getJobCounts.mockResolvedValue({ active: 0, waiting: 0, completed: 0, delayed: 0, failed: 0, paused: 0 });
      jobRepo.queueAll.mockResolvedValue();

      const { user } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: assetUser1 } = await ctx.newAsset({ ownerId: user1.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { person: personUser1 } = await ctx.newPerson({ ownerId: user1.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      const { assetFace: assetFaceUser1 } = await ctx.newAssetFace({
        assetId: assetUser1.id,
        personGroupId: personUser1.personGroupId,
      });

      await sut.handleQueueRecognizeFaces({ force: true, clusterGroupId: user.clusterGroupId });

      await expect(ctx.database.selectFrom('person').selectAll().execute()).resolves.toHaveLength(1);
      expect(jobRepo.queueAll).toHaveBeenCalledWith(
        expect.objectContaining([{ name: JobName.FacialRecognition, data: { id: assetFace.id, deferred: false } }]),
      );
      expect(jobRepo.queueAll).not.toHaveBeenCalledWith(
        expect.objectContaining([
          { name: JobName.FacialRecognition, data: { id: assetFace.id, deferred: false } },
          { name: JobName.FacialRecognition, data: { id: assetFaceUser1.id, deferred: false } },
        ]),
      );
    });
  });

  describe('mergePeople', () => {
    it('should merge people of multiple users', async () => {
      const { sut, ctx } = setup();
      const storageMock = ctx.getMock(StorageRepository);
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser({ clusterGroupId: user1.clusterGroupId });
      const { person: person1 } = await ctx.newPerson({ ownerId: user1.id, name: undefined });
      const { person: person2 } = await ctx.newPerson({ ownerId: user1.id });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person1.personGroupId,
      });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person2.personGroupId,
        name: undefined,
      });
      const { asset } = await ctx.newAsset({ ownerId: user2.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: person2.personGroupId });
      storageMock.unlink.mockResolvedValue();

      const auth = factory.auth({ user: user1 });

      await sut.mergePeople(auth, { ids: [person1.personGroupId, person2.personGroupId] });
      const user1People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user1.id }));
      const user2People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user2.id }));
      expect(user1People).toEqual([expect.objectContaining({ personGroupId: person1.personGroupId })]);
      expect(user2People).toEqual([expect.objectContaining({ personGroupId: person1.personGroupId })]);
      await expect(ctx.get(PersonRepository).getFaces(asset.id, { viewingUserId: asset.ownerId })).resolves.toEqual([
        expect.objectContaining({ personGroupId: person1.personGroupId }),
      ]);
    });

    it('should skip people with a different name', async () => {
      const { sut, ctx } = setup();
      const storageMock = ctx.getMock(StorageRepository);
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser({ clusterGroupId: user1.clusterGroupId });
      const { person: person1 } = await ctx.newPerson({ ownerId: user1.id });
      const { person: person2 } = await ctx.newPerson({ ownerId: user1.id });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person1.personGroupId,
        name: 'Person 1',
      });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person2.personGroupId,
        name: 'Person 2',
      });
      storageMock.unlink.mockResolvedValue();

      const auth = factory.auth({ user: user1 });

      await sut.mergePeople(auth, { ids: [person1.personGroupId, person2.personGroupId] });
      const user1People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user1.id }));
      const user2People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user2.id }));
      expect(user1People).toEqual([expect.objectContaining({ personGroupId: person1.personGroupId })]);
      expect(user2People).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ personGroupId: person1.personGroupId }),
          expect.objectContaining({ personGroupId: person2.personGroupId }),
        ]),
      );
    });

    it('should skip people with a different birth date', async () => {
      const { sut, ctx } = setup();
      const storageMock = ctx.getMock(StorageRepository);
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser({ clusterGroupId: user1.clusterGroupId });
      const { person: person1 } = await ctx.newPerson({ ownerId: user1.id });
      const { person: person2 } = await ctx.newPerson({ ownerId: user1.id });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person1.personGroupId,
        birthDate: DateTime.now().minus({ years: 1 }).toJSDate(),
      });
      await ctx.newPerson({
        ownerId: user2.id,
        personGroupId: person2.personGroupId,
        birthDate: DateTime.now().minus({ years: 2 }).toJSDate(),
      });
      storageMock.unlink.mockResolvedValue();

      const auth = factory.auth({ user: user1 });

      await sut.mergePeople(auth, { ids: [person1.personGroupId, person2.personGroupId] });
      const user1People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user1.id }));
      const user2People = await Array.fromAsync(ctx.get(PersonRepository).getAll({ ownerId: user2.id }));
      expect(user1People).toEqual([expect.objectContaining({ personGroupId: person1.personGroupId })]);
      expect(user2People).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ personGroupId: person1.personGroupId }),
          expect.objectContaining({ personGroupId: person2.personGroupId }),
        ]),
      );
    });
  });

  describe('createFace', () => {
    it('should store and retrieve the face as-is when there are no edits', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 200, height: 200 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 200,
        imageHeight: 200,
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      // retrieve an asset's faces
      const faces = sut.getFacesById(auth, { id: asset.id });

      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 50,
            boundingBoxX2: 200,
            boundingBoxY2: 200,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Crop)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 150, height: 200 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: {
              x: 50,
              y: 50,
              width: 150,
              height: 200,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 150,
        imageHeight: 200,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      // retrieve an asset's faces
      const faces = sut.getFacesById(auth, { id: asset.id });

      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 0,
            boundingBoxY1: 0,
            boundingBoxX2: 100,
            boundingBoxY2: 100,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });

      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toHaveLength(1);
      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 50,
            boundingBoxX2: 150,
            boundingBoxY2: 150,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Rotate 90)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 100, height: 200 });
      await ctx.newExif({ assetId: asset.id, exifImageWidth: 200, exifImageHeight: 100 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 90,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 100,
        imageHeight: 200,
        x: 25,
        y: 50,
        width: 10,
        height: 10,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: expect.closeTo(25, 1),
            boundingBoxY1: expect.closeTo(50, 1),
            boundingBoxX2: expect.closeTo(35, 1),
            boundingBoxY2: expect.closeTo(60, 1),
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 65,
            boundingBoxX2: 60,
            boundingBoxY2: 75,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Mirror Horizontal)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 200, height: 100 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 100, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 200,
        imageHeight: 100,
        x: 50,
        y: 25,
        width: 100,
        height: 50,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 25,
            boundingBoxX2: 150,
            boundingBoxY2: 75,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 25,
            boundingBoxX2: 150,
            boundingBoxY2: 75,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Crop + Rotate)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 200, height: 150 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: {
              x: 50,
              y: 0,
              width: 150,
              height: 200,
            },
          },
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 90,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 200,
        imageHeight: 150,
        x: 50,
        y: 25,
        width: 10,
        height: 20,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: expect.closeTo(50, 1),
            boundingBoxY1: expect.closeTo(25, 1),
            boundingBoxX2: expect.closeTo(60, 1),
            boundingBoxY2: expect.closeTo(45, 1),
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 75,
            boundingBoxY1: 140,
            boundingBoxX2: 95,
            boundingBoxY2: 150,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Crop + Mirror)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 150, height: 100 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 100, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: {
              x: 50,
              y: 0,
              width: 150,
              height: 100,
            },
          },
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 150,
        imageHeight: 100,
        x: 25,
        y: 25,
        width: 75,
        height: 50,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 25,
            boundingBoxY1: 25,
            boundingBoxX2: 100,
            boundingBoxY2: 75,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 100,
            boundingBoxY1: 25,
            boundingBoxX2: 175,
            boundingBoxY2: 75,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Rotate + Mirror)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 200, height: 150 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 150 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 90,
            },
          },
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 200,
        imageHeight: 150,
        x: 50,
        y: 25,
        width: 15,
        height: 20,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: expect.closeTo(50, 1),
            boundingBoxY1: expect.closeTo(25, 1),
            boundingBoxX2: expect.closeTo(65, 1),
            boundingBoxY2: expect.closeTo(45, 1),
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 25,
            boundingBoxY1: 50,
            boundingBoxX2: 45,
            boundingBoxY2: 65,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates when the asset is edited (Crop + Rotate + Mirror)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 150, height: 100 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 200 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: {
              x: 50,
              y: 25,
              width: 100,
              height: 150,
            },
          },
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 270,
            },
          },
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 150,
        imageHeight: 150,
        x: 25,
        y: 50,
        width: 75,
        height: 50,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 25,
            boundingBoxY1: 49,
            boundingBoxX2: 99,
            boundingBoxY2: 100,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 50,
            boundingBoxY1: 75,
            boundingBoxX2: 100,
            boundingBoxY2: 150,
          }),
        ]),
      );
    });

    it('should properly transform the coordinates with multiple mirrors in sequence', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 100, height: 100 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 100, exifImageWidth: 100 });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Vertical,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 100,
        imageHeight: 100,
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 10,
            boundingBoxY1: 10,
            boundingBoxX2: 90,
            boundingBoxY2: 90,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 10,
            boundingBoxY1: 10,
            boundingBoxX2: 90,
            boundingBoxY2: 90,
          }),
        ]),
      );
    });

    it('should properly handle exif orientation when creating a face on an edited asset', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ id: factory.uuid(), ownerId: user.id, width: 100, height: 100 });
      await ctx.newExif({ assetId: asset.id, exifImageHeight: 200, exifImageWidth: 100, orientation: '6' });
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await ctx.newEdits(asset.id, {
        edits: [
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Horizontal,
            },
          },
          {
            action: AssetEditAction.Mirror,
            parameters: {
              axis: MirrorAxis.Vertical,
            },
          },
        ],
      });

      const auth = factory.auth({ user });

      const dto: AssetFaceCreateDto = {
        imageWidth: 100,
        imageHeight: 100,
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        personId: person.personGroupId,
        assetId: asset.id,
      };

      await sut.createFace(auth, dto);

      const faces = sut.getFacesById(auth, { id: asset.id });
      await expect(faces).resolves.toHaveLength(1);
      await expect(faces).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 110,
            boundingBoxY1: 10,
            boundingBoxX2: 190,
            boundingBoxY2: 90,
          }),
        ]),
      );

      // remove edits and verify the stored coordinates map to the original image
      await ctx.newEdits(asset.id, { edits: [] });
      const facesAfterRemovingEdits = sut.getFacesById(auth, { id: asset.id });

      await expect(facesAfterRemovingEdits).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            person: expect.objectContaining({ id: person.personGroupId }),
            boundingBoxX1: 10,
            boundingBoxY1: 10,
            boundingBoxX2: 90,
            boundingBoxY2: 90,
          }),
        ]),
      );
    });
  });

  describe('addUsersToPeople', () => {
    it('should skip sharedWith users that are not in the same cluster group', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      const auth = factory.auth({ user: owner });

      await sut.addUsersToPeople(auth, {
        personIds: [person.personGroupId],
        sharedWithIds: [user1.id],
        role: PersonUserRole.Read,
      });

      await expect(sut.getUsersForPeople(auth, {})).resolves.toHaveLength(0);
    });

    it('should add user to person', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      const auth = factory.auth({ user: owner });

      await sut.addUsersToPeople(auth, {
        personIds: [person.personGroupId],
        sharedWithIds: [user1.id],
        role: PersonUserRole.Read,
      });

      await expect(sut.getUsersForPeople(auth, {})).resolves.toEqual([
        expect.objectContaining({
          sharedBy: expect.objectContaining({ id: owner.id }),
          sharedWith: expect.objectContaining({ id: user1.id }),
        }),
      ]);
    });

    it('should update the name and birthdate when sharing to an existing copy', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Owner name', birthDate: '1990-01-01' });
      await ctx.newPerson({ ownerId: user1.id, personGroupId: person.personGroupId, name: '', birthDate: null });

      await sut.addUsersToPeople(factory.auth({ user: owner }), {
        personIds: [person.personGroupId],
        sharedWithIds: [user1.id],
        role: PersonUserRole.Read,
      });

      await expect(sut.getById(factory.auth({ user: user1 }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({ name: 'Owner name', birthDate: '1990-01-01' }),
      );
    });

    it('should skip updating when sharing to an existing copy with values', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Owner name', birthDate: '1990-01-01' });
      await ctx.newPerson({
        ownerId: user1.id,
        personGroupId: person.personGroupId,
        name: 'User1 name',
        birthDate: '2000-02-02',
      });

      await sut.addUsersToPeople(factory.auth({ user: owner }), {
        personIds: [person.personGroupId],
        sharedWithIds: [user1.id],
        role: PersonUserRole.Read,
      });

      await expect(sut.getById(factory.auth({ user: user1 }), person.personGroupId)).resolves.toEqual(
        expect.objectContaining({ name: 'User1 name', birthDate: '2000-02-02' }),
      );
    });
  });

  describe('removeUsersFromPeople', () => {
    it('should work with an empty list', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: sharedWith } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      const auth = factory.auth({ user: owner });

      await sut.addUsersToPeople(auth, {
        personIds: [person.personGroupId],
        sharedWithIds: [sharedWith.id],
        role: PersonUserRole.Read,
      });

      await sut.removeUsersFromPeople(auth, []);

      await expect(sut.getUsersForPeople(auth, {})).resolves.toHaveLength(1);
    });

    it('should throw an error when there is no access', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: owner } = await ctx.newUser({ clusterGroupId: user.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      const auth = factory.auth({ user });

      await expect(
        sut.removeUsersFromPeople(auth, [{ personId: person.personGroupId, sharedWithId: user.id }]),
      ).rejects.toThrow('Not found or no person.update access');
    });

    it('should delete only the requested person and user pairs', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: user1 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { user: user2 } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person: person1 } = await ctx.newPerson({ ownerId: owner.id });
      const { person: person2 } = await ctx.newPerson({ ownerId: owner.id });
      const auth = factory.auth({ user: owner });

      await sut.addUsersToPeople(auth, {
        personIds: [person1.personGroupId, person2.personGroupId],
        sharedWithIds: [user1.id, user2.id],
        role: PersonUserRole.Read,
      });

      await expect(sut.getUsersForPeople(auth, {})).resolves.toHaveLength(4);

      await sut.removeUsersFromPeople(auth, [
        { personId: person1.personGroupId, sharedWithId: user1.id },
        { personId: person2.personGroupId, sharedWithId: user2.id },
      ]);

      const shares = await sut.getUsersForPeople(auth, {});
      expect(shares).toHaveLength(2);
      expect(shares).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ personId: person1.personGroupId, sharedWithId: user2.id }),
          expect.objectContaining({ personId: person2.personGroupId, sharedWithId: user1.id }),
        ]),
      );
    });

    it('should not delete the same pair shared by another user', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: otherOwner } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { user: sharedWith } = await ctx.newUser({ clusterGroupId: owner.clusterGroupId });
      const { person } = await ctx.newPerson({ ownerId: owner.id });
      await ctx.newPerson({ ownerId: otherOwner.id, personGroupId: person.personGroupId });

      const auth = factory.auth({ user: owner });
      const otherAuth = factory.auth({ user: otherOwner });
      const dto = { personIds: [person.personGroupId], sharedWithIds: [sharedWith.id], role: PersonUserRole.Read };

      await sut.addUsersToPeople(auth, dto);
      await sut.addUsersToPeople(otherAuth, dto);

      await sut.removeUsersFromPeople(auth, [{ personId: person.personGroupId, sharedWithId: sharedWith.id }]);

      await expect(sut.getUsersForPeople(auth, {})).resolves.toEqual([]);
      await expect(sut.getUsersForPeople(otherAuth, {})).resolves.toEqual([
        expect.objectContaining({ personId: person.personGroupId, sharedWithId: sharedWith.id }),
      ]);
    });
  });
});
