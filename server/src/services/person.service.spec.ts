import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { mapFaces, mapPerson, PersonResponseDto } from 'src/dtos/person.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { CacheControl, Colorspace, ImageFormat, JobName, JobStatus, SourceType, SystemMetadataKey } from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { DetectedFaces } from 'src/repositories/machine-learning.repository';
import { FaceSearchResult } from 'src/repositories/search.repository';
import { PersonService } from 'src/services/person.service';
import { ImmichFileResponse } from 'src/utils/file';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { personStub } from 'test/fixtures/person.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const responseDto: PersonResponseDto = {
  id: 'person-1',
  name: 'Person 1',
  birthDate: null,
  thumbnailPath: '/path/to/thumbnail.jpg',
  isHidden: false,
  updatedAt: expect.any(Date),
  isFavorite: false,
};

const statistics = { assets: 3 };

const faceId = 'face-id';
const face = {
  id: faceId,
  assetId: 'asset-id',
  boundingBoxX1: 100,
  boundingBoxY1: 100,
  boundingBoxX2: 200,
  boundingBoxY2: 200,
  imageHeight: 500,
  imageWidth: 400,
};
const faceSearch = { faceId, embedding: '[1, 2, 3, 4]' };
const detectFaceMock: DetectedFaces = {
  faces: [
    {
      boundingBox: {
        x1: face.boundingBoxX1,
        y1: face.boundingBoxY1,
        x2: face.boundingBoxX2,
        y2: face.boundingBoxY2,
      },
      embedding: faceSearch.embedding,
      score: 0.2,
    },
  ],
  imageHeight: face.imageHeight,
  imageWidth: face.imageWidth,
};

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
      mocks.person.getAllForUser.mockResolvedValue({
        items: [personStub.withName, personStub.hidden],
        hasNextPage: false,
      });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 1 });
      await expect(sut.getAll(authStub.admin, { withHidden: true, page: 1, size: 10 })).resolves.toEqual({
        hasNextPage: false,
        total: 2,
        hidden: 1,
        people: [
          responseDto,
          {
            id: 'person-1',
            name: '',
            birthDate: null,
            thumbnailPath: '/path/to/thumbnail.jpg',
            isHidden: true,
            isFavorite: false,
            updatedAt: expect.any(Date),
          },
        ],
      });
      expect(mocks.person.getAllForUser).toHaveBeenCalledWith({ skip: 0, take: 10 }, authStub.admin.user.id, {
        minimumFaceCount: 3,
        withHidden: true,
      });
    });

    it('should get all visible people and favorites should be first in the array', async () => {
      mocks.person.getAllForUser.mockResolvedValue({
        items: [personStub.isFavorite, personStub.withName],
        hasNextPage: false,
      });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 1 });
      await expect(sut.getAll(authStub.admin, { withHidden: false, page: 1, size: 10 })).resolves.toEqual({
        hasNextPage: false,
        total: 2,
        hidden: 1,
        people: [
          {
            id: 'person-4',
            name: personStub.isFavorite.name,
            birthDate: null,
            thumbnailPath: '/path/to/thumbnail.jpg',
            isHidden: false,
            isFavorite: true,
            updatedAt: expect.any(Date),
          },
          responseDto,
        ],
      });
      expect(mocks.person.getAllForUser).toHaveBeenCalledWith({ skip: 0, take: 10 }, authStub.admin.user.id, {
        minimumFaceCount: 3,
        withHidden: false,
      });
    });
  });

  describe('getById', () => {
    it('should require person.read permission', async () => {
      mocks.person.getById.mockResolvedValue(personStub.withName);
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw a bad request when person is not found', async () => {
      mocks.person.getById.mockResolvedValue(null);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should get a person by id', async () => {
      mocks.person.getById.mockResolvedValue(personStub.withName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getById(authStub.admin, 'person-1')).resolves.toEqual(responseDto);
      expect(mocks.person.getById).toHaveBeenCalledWith('person-1');
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('getThumbnail', () => {
    it('should require person.read permission', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noName);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when personId is invalid', async () => {
      mocks.person.getById.mockResolvedValue(null);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when person has no thumbnail', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noThumbnail);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.storage.createReadStream).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should serve the thumbnail', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/thumbnail.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PRIVATE_WITHOUT_CACHE,
        }),
      );
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('update', () => {
    it('should require person.write permission', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noName);
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
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
      mocks.person.update.mockResolvedValue(personStub.withName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).resolves.toEqual(responseDto);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'person-1', name: 'Person 1' });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's date of birth", async () => {
      mocks.person.update.mockResolvedValue(personStub.withBirthDate);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { birthDate: new Date('1976-06-30') })).resolves.toEqual({
        id: 'person-1',
        name: 'Person 1',
        birthDate: '1976-06-30',
        thumbnailPath: '/path/to/thumbnail.jpg',
        isHidden: false,
        isFavorite: false,
        updatedAt: expect.any(Date),
      });
      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: new Date('1976-06-30') });
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should update a person visibility', async () => {
      mocks.person.update.mockResolvedValue(personStub.withName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { isHidden: false })).resolves.toEqual(responseDto);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'person-1', isHidden: false });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should update a person favorite status', async () => {
      mocks.person.update.mockResolvedValue(personStub.withName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { isFavorite: true })).resolves.toEqual(responseDto);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'person-1', isFavorite: true });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's thumbnailPath", async () => {
      mocks.person.update.mockResolvedValue(personStub.withName);
      mocks.person.getFacesByIds.mockResolvedValue([faceStub.face1]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(
        sut.update(authStub.admin, 'person-1', { featureFaceAssetId: faceStub.face1.assetId }),
      ).resolves.toEqual(responseDto);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'person-1', faceAssetId: faceStub.face1.id });
      expect(mocks.person.getFacesByIds).toHaveBeenCalledWith([
        {
          assetId: faceStub.face1.assetId,
          personId: 'person-1',
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_PERSON_THUMBNAIL,
        data: { id: 'person-1' },
      });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when the face feature assetId is invalid', async () => {
      mocks.person.getById.mockResolvedValue(personStub.withName);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { featureFaceAssetId: '-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
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
        sut.reassignFaces(authStub.admin, personStub.noName.id, {
          data: [{ personId: 'asset-face-1', assetId: '' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });
    it('should reassign a face', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.withName.id]));
      mocks.person.getById.mockResolvedValue(personStub.noName);
      mocks.access.person.checkFaceOwnerAccess.mockResolvedValue(new Set([faceStub.face1.id]));
      mocks.person.getFacesByIds.mockResolvedValue([faceStub.face1]);
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getRandomFace.mockResolvedValue(faceStub.primaryFace1);
      mocks.person.refreshFaces.mockResolvedValue();
      mocks.person.reassignFace.mockResolvedValue(5);
      mocks.person.update.mockResolvedValue(personStub.noName);

      await expect(
        sut.reassignFaces(authStub.admin, personStub.noName.id, {
          data: [{ personId: personStub.withName.id, assetId: assetStub.image.id }],
        }),
      ).resolves.toBeDefined();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });
  });

  describe('handlePersonMigration', () => {
    it('should not move person files', async () => {
      mocks.person.getById.mockResolvedValue(null);
      await expect(sut.handlePersonMigration(personStub.noName)).resolves.toBe(JobStatus.FAILED);
    });
  });

  describe('getFacesById', () => {
    it('should get the bounding boxes for an asset', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([faceStub.face1.assetId]));
      mocks.person.getFaces.mockResolvedValue([faceStub.primaryFace1]);
      await expect(sut.getFacesById(authStub.admin, { id: faceStub.face1.assetId })).resolves.toStrictEqual([
        mapFaces(faceStub.primaryFace1, authStub.admin),
      ]);
    });
    it('should reject if the user has not access to the asset', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());
      mocks.person.getFaces.mockResolvedValue([faceStub.primaryFace1]);
      await expect(sut.getFacesById(authStub.admin, { id: faceStub.primaryFace1.assetId })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('createNewFeaturePhoto', () => {
    it('should change person feature photo', async () => {
      mocks.person.getRandomFace.mockResolvedValue(faceStub.primaryFace1);
      await sut.createNewFeaturePhoto([personStub.newThumbnail.id]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });
  });

  describe('reassignFacesById', () => {
    it('should create a new person', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.noName.id]));
      mocks.access.person.checkFaceOwnerAccess.mockResolvedValue(new Set([faceStub.face1.id]));
      mocks.person.getFaceById.mockResolvedValue(faceStub.face1);
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getById.mockResolvedValue(personStub.noName);
      await expect(
        sut.reassignFacesById(authStub.admin, personStub.noName.id, {
          id: faceStub.face1.id,
        }),
      ).resolves.toEqual({
        birthDate: personStub.noName.birthDate,
        isHidden: personStub.noName.isHidden,
        isFavorite: personStub.noName.isFavorite,
        id: personStub.noName.id,
        name: personStub.noName.name,
        thumbnailPath: personStub.noName.thumbnailPath,
        updatedAt: expect.any(Date),
      });

      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });

    it('should fail if user has not the correct permissions on the asset', async () => {
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.noName.id]));
      mocks.person.getFaceById.mockResolvedValue(faceStub.face1);
      mocks.person.reassignFace.mockResolvedValue(1);
      mocks.person.getById.mockResolvedValue(personStub.noName);
      await expect(
        sut.reassignFacesById(authStub.admin, personStub.noName.id, {
          id: faceStub.face1.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalledWith();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });
  });

  describe('createPerson', () => {
    it('should create a new person', async () => {
      mocks.person.create.mockResolvedValue(personStub.primaryPerson);

      await expect(sut.create(authStub.admin, {})).resolves.toBeDefined();

      expect(mocks.person.create).toHaveBeenCalledWith({ ownerId: authStub.admin.user.id });
    });
  });

  describe('handlePersonCleanup', () => {
    it('should delete people without faces', async () => {
      mocks.person.getAllWithoutFaces.mockResolvedValue([personStub.noName]);

      await sut.handlePersonCleanup();

      expect(mocks.person.delete).toHaveBeenCalledWith([personStub.noName]);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(personStub.noName.thumbnailPath);
    });
  });

  describe('handleQueueDetectFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleQueueDetectFaces({})).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      mocks.asset.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({ force: false });

      expect(mocks.asset.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.FACES);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.person.getAllWithoutFaces.mockResolvedValue([personStub.withName]);

      await sut.handleQueueDetectFaces({ force: true });

      expect(mocks.person.deleteFaces).toHaveBeenCalledWith({ sourceType: SourceType.MACHINE_LEARNING });
      expect(mocks.person.delete).toHaveBeenCalledWith([personStub.withName]);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(personStub.withName.thumbnailPath);
      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should refresh all assets', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({ force: undefined });

      expect(mocks.person.delete).not.toHaveBeenCalled();
      expect(mocks.person.deleteFaces).not.toHaveBeenCalled();
      expect(mocks.storage.unlink).not.toHaveBeenCalled();
      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.PERSON_CLEANUP });
    });

    it('should delete existing people and faces if forced', async () => {
      mocks.person.getAll.mockReturnValue(makeStream([faceStub.face1.person, personStub.randomPerson]));
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.person.getAllWithoutFaces.mockResolvedValue([personStub.randomPerson]);
      mocks.person.deleteFaces.mockResolvedValue();

      await sut.handleQueueDetectFaces({ force: true });

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
      expect(mocks.person.delete).toHaveBeenCalledWith([personStub.randomPerson]);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(personStub.randomPerson.thumbnailPath);
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

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.SKIPPED);
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

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({});

      expect(mocks.person.getAllFaces).toHaveBeenCalledWith({
        personId: null,
        sourceType: SourceType.MACHINE_LEARNING,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should queue all assets', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream());
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(mocks.person.getAllFaces).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should run nightly if new face has been added since last run', async () => {
      mocks.person.getLatestFaceDate.mockResolvedValue(new Date().toISOString());
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream());
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);
      mocks.person.unassignFaces.mockResolvedValue();

      await sut.handleQueueRecognizeFaces({ force: true, nightly: true });

      expect(mocks.systemMetadata.get).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE);
      expect(mocks.person.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(mocks.person.getAllFaces).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should skip nightly if no new face has been added since last run', async () => {
      const lastRun = new Date();

      mocks.systemMetadata.get.mockResolvedValue({ lastRun: lastRun.toISOString() });
      mocks.person.getLatestFaceDate.mockResolvedValue(new Date(lastRun.getTime() - 1).toISOString());
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true, nightly: true });

      expect(mocks.systemMetadata.get).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE);
      expect(mocks.person.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(mocks.person.getAllFaces).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should delete existing people if forced', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        waiting: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
      mocks.person.getAll.mockReturnValue(makeStream([faceStub.face1.person, personStub.randomPerson]));
      mocks.person.getAllFaces.mockReturnValue(makeStream([faceStub.face1]));
      mocks.person.getAllWithoutFaces.mockResolvedValue([personStub.randomPerson]);
      mocks.person.unassignFaces.mockResolvedValue();

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(mocks.person.deleteFaces).not.toHaveBeenCalled();
      expect(mocks.person.unassignFaces).toHaveBeenCalledWith({ sourceType: SourceType.MACHINE_LEARNING });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(mocks.person.delete).toHaveBeenCalledWith([personStub.randomPerson]);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(personStub.randomPerson.thumbnailPath);
    });
  });

  describe('handleDetectFaces', () => {
    beforeEach(() => {
      mocks.crypto.randomUUID.mockReturnValue(faceId);
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleDetectFaces({ id: 'foo' })).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip when no resize path', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleDetectFaces({ id: assetStub.noResizePath.id });
      expect(mocks.machineLearning.detectFaces).not.toHaveBeenCalled();
    });

    it('should skip it the asset has already been processed', async () => {
      mocks.asset.getByIds.mockResolvedValue([
        {
          ...assetStub.noResizePath,
          faces: [
            {
              id: 'asset-face-1',
              assetId: assetStub.noResizePath.id,
              personId: faceStub.face1.personId,
            } as AssetFaceEntity,
          ],
        },
      ]);
      await sut.handleDetectFaces({ id: assetStub.noResizePath.id });
      expect(mocks.machineLearning.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      const start = Date.now();

      mocks.machineLearning.detectFaces.mockResolvedValue({ imageHeight: 500, imageWidth: 400, faces: [] });
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleDetectFaces({ id: assetStub.image.id });
      expect(mocks.machineLearning.detectFaces).toHaveBeenCalledWith(
        ['http://immich-machine-learning:3003'],
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ minScore: 0.7, modelName: 'buffalo_l' }),
      );
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();

      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: assetStub.image.id,
        facesRecognizedAt: expect.any(Date),
      });
      const facesRecognizedAt = mocks.asset.upsertJobStatus.mock.calls[0][0].facesRecognizedAt as Date;
      expect(facesRecognizedAt.getTime()).toBeGreaterThan(start);
    });

    it('should create a face with no person and queue recognition job', async () => {
      mocks.machineLearning.detectFaces.mockResolvedValue(detectFaceMock);
      mocks.search.searchFaces.mockResolvedValue([{ ...faceStub.face1, distance: 0.7 }]);
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([face], [], [faceSearch]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should delete an existing face not among the new detected faces', async () => {
      mocks.machineLearning.detectFaces.mockResolvedValue({ faces: [], imageHeight: 500, imageWidth: 400 });
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.primaryFace1] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([], [faceStub.primaryFace1.id], []);
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add new face and delete an existing face not among the new detected faces', async () => {
      mocks.machineLearning.detectFaces.mockResolvedValue(detectFaceMock);
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.primaryFace1] }]);
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([face], [faceStub.primaryFace1.id], [faceSearch]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add embedding to matching metadata face', async () => {
      mocks.machineLearning.detectFaces.mockResolvedValue(detectFaceMock);
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.fromExif1] }]);
      mocks.person.refreshFaces.mockResolvedValue();

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [],
        [],
        [{ faceId: faceStub.fromExif1.id, embedding: faceSearch.embedding }],
      );
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not add embedding to non-matching metadata face', async () => {
      mocks.machineLearning.detectFaces.mockResolvedValue(detectFaceMock);
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.fromExif2] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith([face], [], [faceSearch]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(mocks.person.reassignFace).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should fail if face does not exist', async () => {
      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.FAILED);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should fail if face does not have asset', async () => {
      const face = { ...faceStub.face1, asset: null } as AssetFaceEntity & { asset: null };
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(face);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.FAILED);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should skip if face already has an assigned person', async () => {
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.SKIPPED);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.create).not.toHaveBeenCalled();
    });

    it('should match existing person', async () => {
      if (!faceStub.primaryFace1.person) {
        throw new Error('faceStub.primaryFace1.person is null');
      }

      const faces = [
        { ...faceStub.noPerson1, distance: 0 },
        { ...faceStub.primaryFace1, distance: 0.2 },
        { ...faceStub.noPerson2, distance: 0.3 },
        { ...faceStub.face1, distance: 0.4 },
      ] as FaceSearchResult[];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      mocks.person.create.mockResolvedValue(faceStub.primaryFace1.person);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.arrayContaining([faceStub.noPerson1.id]),
        newPersonId: faceStub.primaryFace1.person.id,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.not.arrayContaining([faceStub.face1.id]),
        newPersonId: faceStub.primaryFace1.person.id,
      });
    });

    it('should create a new person if the face is a core point with no person', async () => {
      const faces = [
        { ...faceStub.noPerson1, distance: 0 },
        { ...faceStub.noPerson2, distance: 0.3 },
      ] as FaceSearchResult[];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      mocks.person.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(mocks.person.create).toHaveBeenCalledWith({
        ownerId: faceStub.noPerson1.asset.ownerId,
        faceAssetId: faceStub.noPerson1.id,
      });
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        faceIds: [faceStub.noPerson1.id],
        newPersonId: personStub.withName.id,
      });
    });

    it('should not queue face with no matches', async () => {
      const faces = [{ ...faceStub.noPerson1, distance: 0 }] as FaceSearchResult[];

      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      mocks.person.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should defer non-core faces to end of queue', async () => {
      const faces = [
        { ...faceStub.noPerson1, distance: 0 },
        { ...faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      mocks.search.searchFaces.mockResolvedValue(faces);
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      mocks.person.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FACIAL_RECOGNITION,
        data: { id: faceStub.noPerson1.id, deferred: true },
      });
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(1);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not assign person to deferred non-core face with no matching person', async () => {
      const faces = [
        { ...faceStub.noPerson1, distance: 0 },
        { ...faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      mocks.search.searchFaces.mockResolvedValueOnce(faces).mockResolvedValueOnce([]);
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      mocks.person.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id, deferred: true });

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.search.searchFaces).toHaveBeenCalledTimes(2);
      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleGeneratePersonThumbnail', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleGeneratePersonThumbnail({ id: 'person-1' })).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip a person not found', async () => {
      mocks.person.getById.mockResolvedValue(null);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person without a face asset id', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noThumbnail);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id not found', async () => {
      mocks.person.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.id });
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id without a thumbnail', async () => {
      mocks.person.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      mocks.asset.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      mocks.person.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.middle);
      mocks.asset.getById.mockResolvedValue(assetStub.primaryImage);
      mocks.media.generateThumbnail.mockResolvedValue();

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(mocks.asset.getById).toHaveBeenCalledWith(faceStub.middle.assetId, { exifInfo: true, files: true });
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/admin_id/pe/rs');
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        assetStub.primaryImage.originalPath,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 250,
          quality: 80,
          crop: {
            left: 238,
            top: 163,
            width: 274,
            height: 274,
          },
          processInvalidImages: false,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
      expect(mocks.person.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      mocks.person.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.start.assetId });
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.start);
      mocks.asset.getById.mockResolvedValue(assetStub.image);
      mocks.media.generateThumbnail.mockResolvedValue();

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        assetStub.primaryImage.originalPath,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 250,
          quality: 80,
          crop: {
            left: 0,
            top: 85,
            width: 510,
            height: 510,
          },
          processInvalidImages: false,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should generate a thumbnail without overflowing', async () => {
      mocks.person.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.end.assetId });
      mocks.person.getFaceByIdWithAssets.mockResolvedValue(faceStub.end);
      mocks.person.update.mockResolvedValue(personStub.primaryPerson);
      mocks.asset.getById.mockResolvedValue(assetStub.primaryImage);
      mocks.media.generateThumbnail.mockResolvedValue();

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        assetStub.primaryImage.originalPath,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 250,
          quality: 80,
          crop: {
            left: 591,
            top: 591,
            width: 408,
            height: 408,
          },
          processInvalidImages: false,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });
  });

  describe('mergePerson', () => {
    it('should require person.write and person.merge permission', async () => {
      mocks.person.getById.mockResolvedValueOnce(personStub.primaryPerson);
      mocks.person.getById.mockResolvedValueOnce(personStub.mergePerson);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();

      expect(mocks.person.delete).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should merge two people without smart merge', async () => {
      mocks.person.getById.mockResolvedValueOnce(personStub.primaryPerson);
      mocks.person.getById.mockResolvedValueOnce(personStub.mergePerson);
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: true },
      ]);

      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.primaryPerson.id,
        oldPersonId: personStub.mergePerson.id,
      });

      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should merge two people with smart merge', async () => {
      mocks.person.getById.mockResolvedValueOnce(personStub.randomPerson);
      mocks.person.getById.mockResolvedValueOnce(personStub.primaryPerson);
      mocks.person.update.mockResolvedValue({ ...personStub.randomPerson, name: personStub.primaryPerson.name });
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-3']));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));

      await expect(sut.mergePerson(authStub.admin, 'person-3', { ids: ['person-1'] })).resolves.toEqual([
        { id: 'person-1', success: true },
      ]);

      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.randomPerson.id,
        oldPersonId: personStub.primaryPerson.id,
      });

      expect(mocks.person.update).toHaveBeenCalledWith({
        id: personStub.randomPerson.id,
        name: personStub.primaryPerson.name,
      });

      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when the primary person is not found', async () => {
      mocks.person.getById.mockResolvedValue(null);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.person.delete).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should handle invalid merge ids', async () => {
      mocks.person.getById.mockResolvedValueOnce(personStub.primaryPerson);
      mocks.person.getById.mockResolvedValueOnce(null);
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
      expect(mocks.person.delete).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should handle an error reassigning faces', async () => {
      mocks.person.getById.mockResolvedValueOnce(personStub.primaryPerson);
      mocks.person.getById.mockResolvedValueOnce(personStub.mergePerson);
      mocks.person.reassignFaces.mockRejectedValue(new Error('update failed'));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.UNKNOWN },
      ]);

      expect(mocks.person.delete).not.toHaveBeenCalled();
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('getStatistics', () => {
    it('should get correct number of person', async () => {
      mocks.person.getById.mockResolvedValue(personStub.primaryPerson);
      mocks.person.getStatistics.mockResolvedValue(statistics);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getStatistics(authStub.admin, 'person-1')).resolves.toEqual({ assets: 3 });
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should require person.read permission', async () => {
      mocks.person.getById.mockResolvedValue(personStub.primaryPerson);
      await expect(sut.getStatistics(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.access.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('mapFace', () => {
    it('should map a face', () => {
      expect(mapFaces(faceStub.face1, { user: personStub.withName.owner })).toEqual({
        boundingBoxX1: 0,
        boundingBoxX2: 1,
        boundingBoxY1: 0,
        boundingBoxY2: 1,
        id: faceStub.face1.id,
        imageHeight: 1024,
        imageWidth: 1024,
        sourceType: SourceType.MACHINE_LEARNING,
        person: mapPerson(personStub.withName),
      });
    });

    it('should not map person if person is null', () => {
      expect(mapFaces({ ...faceStub.face1, person: null }, authStub.user1).person).toBeNull();
    });

    it('should not map person if person does not match auth user id', () => {
      expect(mapFaces(faceStub.face1, authStub.user1).person).toBeNull();
    });
  });
});
