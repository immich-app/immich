import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { mapFaces, mapPerson } from 'src/dtos/person.dto';
import { AssetFileType, CacheControl, JobName, JobStatus, SourceType, SystemMetadataKey } from 'src/enum';
import { PersonService } from 'src/services/person.service';
import { ImmichFileResponse } from 'src/utils/file';
import { AssetFaceFactory } from 'test/factories/asset-face.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { PersonGroupFactory } from 'test/factories/person-group.factory';
import { PersonFactory } from 'test/factories/person.factory';
import { UserFactory } from 'test/factories/user.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import {
  getAsDetectedFace,
  getForAsset,
  getForAssetFace,
  getForDetectedFaces,
  getForFaceSearch,
  getForFacialRecognitionJob,
} from 'test/mappers';
import { newDate, newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(PersonService.name, () => {
  let sut: PersonService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PersonService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all hidden and visible people with thumbnails', async () => {
      const auth = AuthFactory.create();
      const [person, hiddenPerson] = [PersonFactory.create(), PersonFactory.create({ isHidden: true })];

      mocks.person.getAllForUser.mockResolvedValue({
        items: [person, hiddenPerson],
        hasNextPage: false,
      });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 1 });
      await expect(sut.getAll(auth, { withHidden: true, page: 1, size: 10 })).resolves.toEqual({
        hasNextPage: false,
        total: 2,
        hidden: 1,
        people: [
          expect.objectContaining({ id: person.personGroupId, isHidden: false }),
          expect.objectContaining({
            id: hiddenPerson.personGroupId,
            isHidden: true,
          }),
        ],
      });
      expect(mocks.person.getAllForUser).toHaveBeenCalledWith({ skip: 0, take: 10 }, auth.user.id, {
        withHidden: true,
      });
    });

    it('should get all visible people and favorites should be first in the array', async () => {
      const auth = AuthFactory.create();
      const [isFavorite, person] = [PersonFactory.create({ isFavorite: true }), PersonFactory.create()];

      mocks.person.getAllForUser.mockResolvedValue({
        items: [isFavorite, person],
        hasNextPage: false,
      });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 1 });
      await expect(sut.getAll(auth, { withHidden: false, page: 1, size: 10 })).resolves.toEqual({
        hasNextPage: false,
        total: 2,
        hidden: 1,
        people: [
          expect.objectContaining({
            id: isFavorite.personGroupId,
            isFavorite: true,
          }),
          expect.objectContaining({ id: person.personGroupId, isFavorite: false }),
        ],
      });
      expect(mocks.person.getAllForUser).toHaveBeenCalledWith({ skip: 0, take: 10 }, auth.user.id, {
        withHidden: false,
      });
    });
  });

  describe('getById', () => {
    it('should require person.read permission', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();
      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(sut.getById(auth, person.personGroupId)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should throw a bad request when person is not found', async () => {
      const auth = AuthFactory.create();
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['unknown']));
      await expect(sut.getById(auth, 'unknown')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set(['unknown']));
    });

    it('should get a person by id', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      await expect(sut.getById(auth, person.personGroupId)).resolves.toEqual(
        expect.objectContaining({ id: person.personGroupId }),
      );
      expect(mocks.person.getByGroupId).toHaveBeenCalledWith({
        ownerId: auth.user.id,
        personGroupId: person.personGroupId,
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });
  });

  describe('getThumbnail', () => {
    it('should require person.read permission', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(sut.getThumbnail(auth, person.personGroupId)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should throw an error when personId is invalid', async () => {
      const auth = AuthFactory.create();

      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['unknown']));
      await expect(sut.getThumbnail(auth, 'unknown')).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set(['unknown']));
    });

    it('should throw an error when person has no thumbnail', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ thumbnailPath: '' });

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      await expect(sut.getThumbnail(auth, person.personGroupId)).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should serve the thumbnail', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      await expect(sut.getThumbnail(auth, person.personGroupId)).resolves.toEqual(
        new ImmichFileResponse({
          path: person.thumbnailPath,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithoutCache,
        }),
      );
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });
  });

  describe('update', () => {
    it('should require person.write permission', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(sut.update(auth, person.personGroupId, { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should throw an error when personId is invalid', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's name", async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ name: 'Person 1' });

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.update.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { name: 'Person 1' })).resolves.toEqual(
        expect.objectContaining({ id: person.personGroupId, name: 'Person 1' }),
      );

      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        name: 'Person 1',
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it("should update a person's date of birth", async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ birthDate: new Date('1976-06-30') });

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.update.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { birthDate: '1976-06-30' })).resolves.toEqual({
        id: person.personGroupId,
        name: person.name,
        birthDate: '1976-06-30',
        thumbnailPath: person.thumbnailPath,
        isHidden: false,
        isFavorite: false,
        updatedAt: expect.any(String),
      });
      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        birthDate: '1976-06-30',
      });
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should update a person visibility', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ isHidden: true });

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.update.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { isHidden: true })).resolves.toEqual(
        expect.objectContaining({ isHidden: true }),
      );

      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        isHidden: true,
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should update a person favorite status', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ isFavorite: true });

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.update.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { isFavorite: true })).resolves.toEqual(
        expect.objectContaining({ isFavorite: true }),
      );

      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        isFavorite: true,
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it("should update a person's thumbnailPath", async () => {
      const face = AssetFaceFactory.create();
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.update.mockResolvedValue(person);
      mocks.person.getForFeatureFaceUpdate.mockResolvedValue(face);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([face.assetId]));
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { featureFaceAssetId: face.assetId })).resolves.toEqual(
        expect.objectContaining({ id: person.personGroupId }),
      );

      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        faceAssetId: face.id,
      });
      expect(mocks.person.getForFeatureFaceUpdate).toHaveBeenCalledWith({
        assetId: face.assetId,
        personGroupId: person.personGroupId,
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.PersonGenerateThumbnail,
        data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should throw an error when the face feature assetId is invalid', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(sut.update(auth, person.personGroupId, { featureFaceAssetId: '-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });
  });

  describe('updateAll', () => {
    it('should throw an error when personId is invalid', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.updateAll(authStub.admin, { people: [{ id: 'person-1', name: 'Person 1' }] })).resolves.toEqual([
        { error: BulkIdErrorReason.UNKNOWN, id: 'person-1', success: false },
      ]);
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('reassignFaces', () => {
    it('should throw an error if user has no access to the person', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(
        sut.reassignFaces(AuthFactory.create(), 'person-id', {
          data: [{ personId: 'asset-face-1', assetId: '' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });

    it('should reassign a face', async () => {
      const face = AssetFaceFactory.create();
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.access.person.checkFaceOwnerAccess.mockResolvedValue(new Set([face.id]));
      mocks.person.getFacesByIds.mockResolvedValue([getForAssetFace(face)]);
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getRandomFace.mockResolvedValue(AssetFaceFactory.create());
      mocks.person.refreshFaces.mockResolvedValue();
      mocks.person.reassignFace.mockResolvedValue(5);
      mocks.person.update.mockResolvedValue(person);

      await expect(
        sut.reassignFaces(auth, person.personGroupId, {
          data: [{ personId: person.personGroupId, assetId: face.assetId }],
        }),
      ).resolves.toBeDefined();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
        },
      ]);
    });
  });

  describe('handlePersonMigration', () => {
    it('should not move person files', async () => {
      await expect(sut.handlePersonMigration(PersonFactory.create())).resolves.toBe(JobStatus.Failed);
    });
  });

  describe('getFacesById', () => {
    it('should get the bounding boxes for an asset', async () => {
      const auth = AuthFactory.create();
      const face = AssetFaceFactory.create();
      const asset = AssetFactory.from({ id: face.assetId }).exif().build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.person.getFaces.mockResolvedValue([getForAssetFace(face)]);
      mocks.asset.getForFaces.mockResolvedValue({ edits: [], ...asset.exifInfo });
      await expect(sut.getFacesById(auth, { id: face.assetId })).resolves.toStrictEqual([
        mapFaces(getForAssetFace(face), auth),
      ]);
    });

    it('should reject if the user has not access to the asset', async () => {
      const face = AssetFaceFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());
      mocks.person.getFaces.mockResolvedValue([getForAssetFace(face)]);
      await expect(sut.getFacesById(AuthFactory.create(), { id: face.assetId })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('createFace', () => {
    it('should create a manual face and initialize the person feature photo creation', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.create();
      const person = PersonFactory.create({ faceAssetId: null });
      const featureFace = AssetFaceFactory.create({
        assetId: asset.id,
        personGroupId: person.personGroupId,
        sourceType: SourceType.Manual,
      });

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      mocks.asset.getById.mockResolvedValue(getForAsset(asset));
      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.getRandomFace.mockResolvedValue(featureFace);
      mocks.person.update.mockResolvedValue({ ...person, faceAssetId: featureFace.id });

      await expect(
        sut.createFace(auth, {
          assetId: asset.id,
          personId: person.personGroupId,
          imageHeight: 500,
          imageWidth: 400,
          x: 10,
          y: 20,
          width: 100,
          height: 110,
        }),
      ).resolves.toBeUndefined();

      expect(mocks.asset.getById).toHaveBeenCalledWith(asset.id, { edits: true, exifInfo: true });
      expect(mocks.person.createAssetFace).toHaveBeenCalledWith({
        assetId: asset.id,
        personGroupId: person.personGroupId,
        imageHeight: 500,
        imageWidth: 400,
        boundingBoxX1: 10,
        boundingBoxX2: 110,
        boundingBoxY1: 20,
        boundingBoxY2: 130,
        sourceType: SourceType.Manual,
      });
      expect(mocks.person.getRandomFace).toHaveBeenCalledWith(person.personGroupId);
      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        faceAssetId: featureFace.id,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
        },
      ]);
    });

    it('should not update the person feature photo if one already exists', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.create();
      const person = PersonFactory.create({ faceAssetId: newUuid() });

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      mocks.asset.getById.mockResolvedValue(getForAsset(asset));
      mocks.person.getByGroupId.mockResolvedValue(person);

      await expect(
        sut.createFace(auth, {
          assetId: asset.id,
          personId: person.personGroupId,
          imageHeight: 500,
          imageWidth: 400,
          x: 10,
          y: 20,
          width: 100,
          height: 110,
        }),
      ).resolves.toBeUndefined();

      expect(mocks.person.createAssetFace).toHaveBeenCalledOnce();
      expect(mocks.person.getRandomFace).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should reject creating a face on an asset the user does not own', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.create();
      const person = PersonFactory.create({ faceAssetId: null });

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));

      await expect(
        sut.createFace(auth, {
          assetId: asset.id,
          personId: person.personGroupId,
          imageHeight: 500,
          imageWidth: 400,
          x: 10,
          y: 20,
          width: 100,
          height: 110,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.person.createAssetFace).not.toHaveBeenCalled();
    });
  });

  describe('createNewFeaturePhoto', () => {
    it('should change person feature photo', async () => {
      const person = PersonFactory.create();

      mocks.person.getRandomFace.mockResolvedValue(AssetFaceFactory.create());
      await sut.createNewFeaturePhoto([person]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
        },
      ]);
    });
  });

  describe('reassignFacesById', () => {
    it('should create a new person', async () => {
      const face = AssetFaceFactory.create();
      const person = PersonFactory.create();

      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      mocks.access.person.checkFaceOwnerAccess.mockResolvedValue(new Set([face.id]));
      mocks.person.getFaceById.mockResolvedValue(getForAssetFace(face));
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(sut.reassignFacesById(AuthFactory.create(), person.personGroupId, { id: face.id })).resolves.toEqual(
        {
          birthDate: person.birthDate,
          isHidden: person.isHidden,
          isFavorite: person.isFavorite,
          id: person.personGroupId,
          name: person.name,
          thumbnailPath: person.thumbnailPath,
          updatedAt: expect.any(String),
        },
      );

      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });

    it('should fail if user has not the correct permissions on the asset', async () => {
      const face = AssetFaceFactory.create();
      const person = PersonFactory.create();

      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      mocks.person.getFaceById.mockResolvedValue(getForAssetFace(face));
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(
        sut.reassignFacesById(AuthFactory.create(), person.personGroupId, {
          id: face.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });
  });

  describe('createPerson', () => {
    it('should create a new person in a new group', async () => {
      const auth = AuthFactory.create();
      const group = PersonGroupFactory.create();

      mocks.person.createGroup.mockResolvedValue(group);
      mocks.person.create.mockResolvedValue(PersonFactory.create({ personGroupId: group.id }));
      await expect(sut.create(auth, {})).resolves.toBeDefined();

      expect(mocks.person.createGroup).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.person.create).toHaveBeenCalledWith({ ownerId: auth.user.id, personGroupId: group.id });
    });
  });

  describe('handlePersonCleanup', () => {
    it('should delete people without faces', async () => {
      const person = PersonFactory.create();

      mocks.person.getAllWithoutFaces.mockResolvedValue([person]);
      mocks.person.delete.mockResolvedValue([person]);

      await sut.handlePersonCleanup();

      expect(mocks.person.delete).toHaveBeenCalledWith([person.personGroupId], undefined);
      expect(mocks.person.deleteEmptyGroups).toHaveBeenCalledWith();
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person.thumbnailPath);
    });
  });

  describe('handleQueueDetectFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleQueueDetectFaces({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForDetectFacesJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueDetectFaces({ force: false });

      expect(mocks.assetJob.streamForDetectFacesJob).toHaveBeenCalledWith(false);
      expect(mocks.person.vacuum).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectFaces,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      const asset = AssetFactory.create();
      const person = PersonFactory.create();

      mocks.assetJob.streamForDetectFacesJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([person]);
      mocks.person.delete.mockResolvedValue([person]);

      await sut.handleQueueDetectFaces({ force: true });

      expect(mocks.person.deleteFaces).toHaveBeenCalledWith({ sourceType: SourceType.MachineLearning });
      expect(mocks.person.delete).toHaveBeenCalledWith([person.personGroupId], undefined);
      expect(mocks.person.deleteEmptyGroups).toHaveBeenCalledWith();
      expect(mocks.person.vacuum).toHaveBeenCalledWith({ reindexVectors: true });
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person.thumbnailPath);
      expect(mocks.assetJob.streamForDetectFacesJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectFaces,
          data: { id: asset.id },
        },
      ]);
    });

    it('should refresh all assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForDetectFacesJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueDetectFaces({ force: undefined });

      expect(mocks.person.deleteGroups).not.toHaveBeenCalled();
      expect(mocks.person.deleteFaces).not.toHaveBeenCalled();
      expect(mocks.person.vacuum).not.toHaveBeenCalled();
      expect(mocks.storage.unlink).not.toHaveBeenCalled();
      expect(mocks.assetJob.streamForDetectFacesJob).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectFaces,
          data: { id: asset.id },
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.PersonCleanup });
    });

    it('should delete existing people and faces if forced', async () => {
      const asset = AssetFactory.create();
      const face = AssetFaceFactory.from().person().build();
      const person = PersonFactory.create();

      mocks.person.getAll.mockReturnValue(makeStream([face.person!, person]));
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.assetJob.streamForDetectFacesJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([person]);
      mocks.person.delete.mockResolvedValue([person]);
      mocks.person.deleteFaces.mockResolvedValue();

      await sut.handleQueueDetectFaces({ force: true });

      expect(mocks.assetJob.streamForDetectFacesJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectFaces,
          data: { id: asset.id },
        },
      ]);
      expect(mocks.person.delete).toHaveBeenCalledWith([person.personGroupId], undefined);
      expect(mocks.person.deleteEmptyGroups).toHaveBeenCalledWith();
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person.thumbnailPath);
      expect(mocks.person.vacuum).toHaveBeenCalledWith({ reindexVectors: true });
    });
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should skip if recognition jobs are already queued', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 1,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      const face = AssetFaceFactory.create();
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({});

      expect(mocks.person.getAllFaces).toHaveBeenCalledWith({
        personGroupId: null,
        sourceType: SourceType.MachineLearning,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FacialRecognition,
          data: { id: face.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FacialRecognitionState, {
        lastRun: expect.any(String),
      });
      expect(mocks.person.vacuum).not.toHaveBeenCalled();
    });

    it('should queue all assets', async () => {
      const face = AssetFaceFactory.create();
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream());
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(mocks.person.getAllFaces).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FacialRecognition,
          data: { id: face.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FacialRecognitionState, {
        lastRun: expect.any(String),
      });
      expect(mocks.person.vacuum).toHaveBeenCalledWith({ reindexVectors: false });
    });

    it('should run nightly if new face has been added since last run', async () => {
      const face = AssetFaceFactory.create();
      mocks.person.getLatestFaceDate.mockResolvedValue(new Date().toISOString());
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream());
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);
      mocks.person.unassignFaces.mockResolvedValue();

      await sut.handleQueueRecognizeFaces({ force: false, nightly: true });

      expect(mocks.systemMetadata.get).toHaveBeenCalledWith(SystemMetadataKey.FacialRecognitionState);
      expect(mocks.person.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(mocks.person.getAllFaces).toHaveBeenCalledWith({
        personGroupId: null,
        sourceType: SourceType.MachineLearning,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FacialRecognition,
          data: { id: face.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FacialRecognitionState, {
        lastRun: expect.any(String),
      });
      expect(mocks.person.vacuum).not.toHaveBeenCalled();
    });

    it('should skip nightly if no new face has been added since last run', async () => {
      const lastRun = new Date();

      mocks.systemMetadata.get.mockResolvedValue({ lastRun: lastRun.toISOString() });
      mocks.person.getLatestFaceDate.mockResolvedValue(new Date(lastRun.getTime() - 1).toISOString());
      mocks.person.getAllFaces.mockReturnValue(makeStream([AssetFaceFactory.create()]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true, nightly: true });

      expect(mocks.systemMetadata.get).toHaveBeenCalledWith(SystemMetadataKey.FacialRecognitionState);
      expect(mocks.person.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(mocks.person.getAllFaces).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.person.vacuum).not.toHaveBeenCalled();
    });

    it('should delete existing people if forced', async () => {
      const face = AssetFaceFactory.from().person().build();
      const person = PersonFactory.create();

      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream([face.person!, person]));
      mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([person]);
      mocks.person.delete.mockResolvedValue([person]);
      mocks.person.unassignFaces.mockResolvedValue();

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(mocks.person.deleteFaces).not.toHaveBeenCalled();
      expect(mocks.person.unassignFaces).toHaveBeenCalledWith({ sourceType: SourceType.MachineLearning });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FacialRecognition,
          data: { id: face.id, deferred: false },
        },
      ]);
      expect(mocks.person.delete).toHaveBeenCalledWith([person.personGroupId], undefined);
      expect(mocks.person.deleteEmptyGroups).toHaveBeenCalledWith();
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person.thumbnailPath);
      expect(mocks.person.vacuum).toHaveBeenCalledWith({ reindexVectors: false });
    });
  });

  describe('handleDetectFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleDetectFaces({ id: 'foo' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip when no resize path', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      await sut.handleDetectFaces({ id: asset.id });
      expect(mocks.machineLearning.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      const start = Date.now();
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).exif().build();

      mocks.machineLearning.detectFaces.mockResolvedValue({ imageHeight: 500, imageWidth: 400, faces: [] });
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      await sut.handleDetectFaces({ id: asset.id });
      expect(mocks.machineLearning.detectFaces).toHaveBeenCalledWith(
        asset.files[0].path,
        expect.objectContaining({ minScore: 0.7, modelName: 'buffalo_l' }),
      );
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();

      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: asset.id,
        facesRecognizedAt: expect.any(Date),
      });
      const facesRecognizedAt = mocks.asset.upsertJobStatus.mock.calls[0][0].facesRecognizedAt as Date;
      expect(facesRecognizedAt.getTime()).toBeGreaterThan(start);
    });

    it('should create a face with no person and queue recognition job', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).exif().build();
      const face = AssetFaceFactory.create({ assetId: asset.id });
      mocks.crypto.randomUUID.mockReturnValue(face.id);
      mocks.machineLearning.detectFaces.mockResolvedValue(getAsDetectedFace(face));
      mocks.search.searchFaces.mockResolvedValue([getForFaceSearch(face, 0.7)]);
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [expect.objectContaining({ id: face.id, assetId: asset.id })],
        [],
        [{ faceId: face.id, embedding: '[1, 2, 3, 4]' }],
      );
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.FacialRecognitionQueueAll, data: { force: false } },
        { name: JobName.FacialRecognition, data: { id: face.id } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should delete an existing face not among the new detected faces', async () => {
      const asset = AssetFactory.from().face().file({ type: AssetFileType.Preview }).exif().build();
      mocks.machineLearning.detectFaces.mockResolvedValue({ faces: [], imageHeight: 500, imageWidth: 400 });
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));

      await sut.handleDetectFaces({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([], [asset.faces[0].id], []);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add new face and delete an existing face not among the new detected faces', async () => {
      const assetId = newUuid();
      const face = AssetFaceFactory.create({
        assetId,
        boundingBoxX1: 200,
        boundingBoxX2: 300,
        boundingBoxY1: 200,
        boundingBoxY2: 300,
      });
      const asset = AssetFactory.from({ id: assetId }).face().file({ type: AssetFileType.Preview }).exif().build();
      mocks.machineLearning.detectFaces.mockResolvedValue(getAsDetectedFace(face));
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      mocks.crypto.randomUUID.mockReturnValue(face.id);
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [expect.objectContaining({ id: face.id, assetId: asset.id })],
        [asset.faces[0].id],
        [{ faceId: face.id, embedding: '[1, 2, 3, 4]' }],
      );
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.FacialRecognitionQueueAll, data: { force: false } },
        { name: JobName.FacialRecognition, data: { id: face.id } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add embedding to matching metadata face', async () => {
      const face = AssetFaceFactory.create({ sourceType: SourceType.Exif });
      const asset = AssetFactory.from().face(face).file({ type: AssetFileType.Preview }).exif().build();
      mocks.machineLearning.detectFaces.mockResolvedValue(getAsDetectedFace(face));
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([], [], [{ faceId: face.id, embedding: '[1, 2, 3, 4]' }]);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not add embedding to non-matching metadata face', async () => {
      const assetId = newUuid();
      const face = AssetFaceFactory.create({ assetId, sourceType: SourceType.Exif });
      const asset = AssetFactory.from({ id: assetId }).file({ type: AssetFileType.Preview }).exif().build();
      mocks.machineLearning.detectFaces.mockResolvedValue(getAsDetectedFace(face));
      mocks.assetJob.getForDetectFacesJob.mockResolvedValue(getForDetectedFaces(asset));
      mocks.crypto.randomUUID.mockReturnValue(face.id);

      await sut.handleDetectFaces({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [expect.objectContaining({ id: face.id, assetId: asset.id })],
        [],
        [{ faceId: face.id, embedding: '[1, 2, 3, 4]' }],
      );
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.FacialRecognitionQueueAll, data: { force: false } },
        { name: JobName.FacialRecognition, data: { id: face.id } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should fail if face does not exist', async () => {
      expect(await sut.handleRecognizeFaces({ id: 'unknown-face' })).toBe(JobStatus.Failed);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should fail if face does not have asset', async () => {
      const face = AssetFaceFactory.create();
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(face, null));

      expect(await sut.handleRecognizeFaces({ id: face.id })).toBe(JobStatus.Failed);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should skip if face already has an assigned person', async () => {
      const asset = AssetFactory.create();
      const face = AssetFaceFactory.from({ assetId: asset.id }).person().build();
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(face, asset));

      expect(await sut.handleRecognizeFaces({ id: face.id })).toBe(JobStatus.Skipped);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should match existing person', async () => {
      const asset = AssetFactory.create();

      const [noPerson1, noPerson2, primaryFace, face] = [
        AssetFaceFactory.create({ assetId: asset.id }),
        AssetFaceFactory.create(),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId }).build(),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId }).build(),
      ];

      const faces = [
        getForFaceSearch(noPerson1, 0),
        getForFaceSearch(primaryFace, 0.2),
        getForFaceSearch(noPerson2, 0.3),
        getForFaceSearch(face, 0.4),
      ];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson1, asset));
      mocks.person.getByGroupId.mockResolvedValue(primaryFace.person!);
      mocks.person.create.mockResolvedValue(primaryFace.person!);

      await sut.handleRecognizeFaces({ id: noPerson1.id });

      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.arrayContaining([noPerson1.id]),
        newPersonGroupId: primaryFace.person!.personGroupId,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.not.arrayContaining([face.id]),
        newPersonGroupId: primaryFace.person!.personGroupId,
      });
    });

    it('should match existing person if their birth date is unknown', async () => {
      const asset = AssetFactory.create();
      const [noPerson, face, faceWithBirthDate] = [
        AssetFaceFactory.create({ assetId: asset.id }),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId }).build(),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId, birthDate: newDate() }).build(),
      ];

      const faces = [
        getForFaceSearch(noPerson, 0),
        getForFaceSearch(face, 0.2),
        getForFaceSearch(faceWithBirthDate, 0.3),
      ];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson, asset));
      mocks.person.getByGroupId.mockResolvedValue(face.person!);
      mocks.person.create.mockResolvedValue(face.person!);

      await sut.handleRecognizeFaces({ id: noPerson.id });

      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.arrayContaining([noPerson.id]),
        newPersonGroupId: face.person!.personGroupId,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.not.arrayContaining([face.id]),
        newPersonGroupId: face.person!.personGroupId,
      });
    });

    it('should match existing person if their birth date is before file creation', async () => {
      const asset = AssetFactory.create();
      const [noPerson, face, faceWithBirthDate] = [
        AssetFaceFactory.create({ assetId: asset.id }),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId }).build(),
        AssetFaceFactory.from().person({ ownerId: asset.ownerId, birthDate: newDate() }).build(),
      ];

      const faces = [
        getForFaceSearch(noPerson, 0),
        getForFaceSearch(faceWithBirthDate, 0.2),
        getForFaceSearch(face, 0.3),
      ];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson, asset));
      mocks.person.getByGroupId.mockResolvedValue(faceWithBirthDate.person!);
      mocks.person.create.mockResolvedValue(face.person!);

      await sut.handleRecognizeFaces({ id: noPerson.id });

      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.arrayContaining([noPerson.id]),
        newPersonGroupId: faceWithBirthDate.person!.personGroupId,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.not.arrayContaining([face.id]),
        newPersonGroupId: faceWithBirthDate.person!.personGroupId,
      });
    });

    it('should create a new person if the face is a core point with no person', async () => {
      const asset = AssetFactory.create();
      const [noPerson1, noPerson2] = [AssetFaceFactory.create({ assetId: asset.id }), AssetFaceFactory.create()];
      const person = PersonFactory.create();

      const faces = [getForFaceSearch(noPerson1, 0), getForFaceSearch(noPerson2, 0.3)];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson1, asset));
      mocks.person.createGroup.mockResolvedValue(PersonGroupFactory.create({ id: person.personGroupId }));
      mocks.person.create.mockResolvedValue(person);

      await sut.handleRecognizeFaces({ id: noPerson1.id });

      expect(mocks.person.createGroup).toHaveBeenCalledWith(asset.ownerId);
      expect(mocks.person.create).toHaveBeenCalledWith({
        ownerId: asset.ownerId,
        faceAssetId: noPerson1.id,
        personGroupId: person.personGroupId,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: [noPerson1.id],
        newPersonGroupId: person.personGroupId,
      });
    });

    it('should create a person in the matched group when the match belongs to another user', async () => {
      const asset = AssetFactory.create();
      const [noPerson, otherOwnerFace] = [
        AssetFaceFactory.create({ assetId: asset.id }),
        AssetFaceFactory.from().person().build(),
      ];
      const person = PersonFactory.create({
        ownerId: asset.ownerId,
        personGroupId: otherOwnerFace.person!.personGroupId,
      });

      const faces = [getForFaceSearch(noPerson, 0), getForFaceSearch(otherOwnerFace, 0.2)];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson, asset));
      mocks.person.create.mockResolvedValue(person);

      await sut.handleRecognizeFaces({ id: noPerson.id });

      expect(mocks.person.createGroup).not.toHaveBeenCalled();
      expect(mocks.person.create).toHaveBeenCalledWith({
        ownerId: asset.ownerId,
        faceAssetId: noPerson.id,
        personGroupId: otherOwnerFace.person!.personGroupId,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: [noPerson.id],
        newPersonGroupId: otherOwnerFace.person!.personGroupId,
      });
    });

    it('should not queue face with no matches', async () => {
      const asset = AssetFactory.create();
      const face = AssetFaceFactory.create({ assetId: asset.id });
      const faces = [getForFaceSearch(face, 0)];

      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(face, asset));
      mocks.person.create.mockResolvedValue(PersonFactory.create());

      await sut.handleRecognizeFaces({ id: face.id });

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should defer non-core faces to end of queue', async () => {
      const asset = AssetFactory.create();
      const [noPerson1, noPerson2] = [AssetFaceFactory.create({ assetId: asset.id }), AssetFaceFactory.create()];

      const faces = [getForFaceSearch(noPerson1, 0), getForFaceSearch(noPerson2, 0.4)];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson1, asset));
      mocks.person.create.mockResolvedValue(PersonFactory.create());

      await sut.handleRecognizeFaces({ id: noPerson1.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FacialRecognition,
        data: { id: noPerson1.id, deferred: true },
      });
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not assign person to deferred non-core face with no matching person', async () => {
      const asset = AssetFactory.create();
      const [noPerson1, noPerson2] = [AssetFaceFactory.create({ assetId: asset.id }), AssetFaceFactory.create()];

      const faces = [getForFaceSearch(noPerson1, 0), getForFaceSearch(noPerson2, 0.4)];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      mocks.search.searchFaces.mockResolvedValueOnce(faces).mockResolvedValueOnce([]);
      mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson1, asset));
      mocks.person.create.mockResolvedValue(PersonFactory.create());

      await sut.handleRecognizeFaces({ id: noPerson1.id, deferred: true });

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(2);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should get correct number of person', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      mocks.person.getStatistics.mockResolvedValue({ assets: 3 });
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.personGroupId]));
      await expect(sut.getStatistics(auth, person.personGroupId)).resolves.toEqual({ assets: 3 });
      expect(mocks.person.getStatistics).toHaveBeenCalledWith(person.personGroupId, auth.user.id);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });

    it('should require person.read permission', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getByGroupId.mockResolvedValue(person);
      await expect(sut.getStatistics(auth, person.personGroupId)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([person.personGroupId]));
    });
  });

  describe('mapFace', () => {
    it('should map a face', () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create({ id: user.id });
      const person = PersonFactory.create({ ownerId: user.id });
      const face = AssetFaceFactory.from().person(person).build();

      expect(mapFaces(getForAssetFace(face), auth)).toEqual({
        boundingBoxX1: 100,
        boundingBoxX2: 200,
        boundingBoxY1: 100,
        boundingBoxY2: 200,
        id: face.id,
        imageHeight: 500,
        imageWidth: 400,
        sourceType: SourceType.MachineLearning,
        person: mapPerson(person),
      });
    });

    it('should not map person if person is null', () => {
      expect(mapFaces(getForAssetFace(AssetFaceFactory.create()), AuthFactory.create()).person).toBeNull();
    });
  });
});
