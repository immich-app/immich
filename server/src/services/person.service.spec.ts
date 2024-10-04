import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { PersonResponseDto, mapFaces, mapPerson } from 'src/dtos/person.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { CacheControl, Colorspace, ImageFormat, SourceType, SystemMetadataKey } from 'src/enum';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { DetectedFaces, IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { FaceSearchResult, ISearchRepository } from 'src/interfaces/search.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { PersonService } from 'src/services/person.service';
import { ImmichFileResponse } from 'src/utils/file';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { personStub } from 'test/fixtures/person.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { IsNull } from 'typeorm';
import { Mocked } from 'vitest';

const responseDto: PersonResponseDto = {
  id: 'person-1',
  name: 'Person 1',
  birthDate: null,
  thumbnailPath: '/path/to/thumbnail.jpg',
  isHidden: false,
  updatedAt: expect.any(Date),
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
const faceSearch = { faceId, embedding: [1, 2, 3, 4] };
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

  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let jobMock: Mocked<IJobRepository>;
  let machineLearningMock: Mocked<IMachineLearningRepository>;
  let mediaMock: Mocked<IMediaRepository>;
  let personMock: Mocked<IPersonRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({
      sut,
      accessMock,
      assetMock,
      cryptoMock,
      jobMock,
      machineLearningMock,
      mediaMock,
      personMock,
      searchMock,
      storageMock,
      systemMock,
    } = newTestService(PersonService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all hidden and visible people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue({
        items: [personStub.withName, personStub.hidden],
        hasNextPage: false,
      });
      personMock.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 1 });
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
            updatedAt: expect.any(Date),
          },
        ],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith({ skip: 0, take: 10 }, authStub.admin.user.id, {
        minimumFaceCount: 3,
        withHidden: true,
      });
    });
  });

  describe('getById', () => {
    it('should require person.read permission', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw a bad request when person is not found', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should get a person by id', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getById(authStub.admin, 'person-1')).resolves.toEqual(responseDto);
      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('getThumbnail', () => {
    it('should require person.read permission', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when person has no thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noThumbnail);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should serve the thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/thumbnail.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PRIVATE_WITHOUT_CACHE,
        }),
      );
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('update', () => {
    it('should require person.write permission', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when personId is invalid', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's name", async () => {
      personMock.update.mockResolvedValue(personStub.withName);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).resolves.toEqual(responseDto);

      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', name: 'Person 1' });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's date of birth", async () => {
      personMock.update.mockResolvedValue(personStub.withBirthDate);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { birthDate: '1976-06-30' })).resolves.toEqual({
        id: 'person-1',
        name: 'Person 1',
        birthDate: '1976-06-30',
        thumbnailPath: '/path/to/thumbnail.jpg',
        isHidden: false,
        updatedAt: expect.any(Date),
      });
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: '1976-06-30' });
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should update a person visibility', async () => {
      personMock.update.mockResolvedValue(personStub.withName);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { isHidden: false })).resolves.toEqual(responseDto);

      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', isHidden: false });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's thumbnailPath", async () => {
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getFacesByIds.mockResolvedValue([faceStub.face1]);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(
        sut.update(authStub.admin, 'person-1', { featureFaceAssetId: faceStub.face1.assetId }),
      ).resolves.toEqual(responseDto);

      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', faceAssetId: faceStub.face1.id });
      expect(personMock.getFacesByIds).toHaveBeenCalledWith([
        {
          assetId: faceStub.face1.assetId,
          personId: 'person-1',
        },
      ]);
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: 'person-1' } });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when the face feature assetId is invalid', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { featureFaceAssetId: '-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('updateAll', () => {
    it('should throw an error when personId is invalid', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.updateAll(authStub.admin, { people: [{ id: 'person-1', name: 'Person 1' }] })).resolves.toEqual([
        { error: BulkIdErrorReason.UNKNOWN, id: 'person-1', success: false },
      ]);
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('reassignFaces', () => {
    it('should throw an error if user has no access to the person', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(
        sut.reassignFaces(authStub.admin, personStub.noName.id, {
          data: [{ personId: 'asset-face-1', assetId: '' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(jobMock.queue).not.toHaveBeenCalledWith();
      expect(jobMock.queueAll).not.toHaveBeenCalledWith();
    });
    it('should reassign a face', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.withName.id]));
      personMock.getById.mockResolvedValue(personStub.noName);
      accessMock.person.checkFaceOwnerAccess.mockResolvedValue(new Set([faceStub.face1.id]));
      personMock.getFacesByIds.mockResolvedValue([faceStub.face1]);
      personMock.reassignFace.mockResolvedValue(1);
      personMock.getRandomFace.mockResolvedValue(faceStub.primaryFace1);
      await expect(
        sut.reassignFaces(authStub.admin, personStub.noName.id, {
          data: [{ personId: personStub.withName.id, assetId: assetStub.image.id }],
        }),
      ).resolves.toEqual([personStub.noName]);

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });
  });

  describe('handlePersonMigration', () => {
    it('should not move person files', async () => {
      personMock.getById.mockResolvedValue(null);
      await expect(sut.handlePersonMigration(personStub.noName)).resolves.toBe(JobStatus.FAILED);
    });
  });

  describe('getFacesById', () => {
    it('should get the bounding boxes for an asset', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([faceStub.face1.assetId]));
      personMock.getFaces.mockResolvedValue([faceStub.primaryFace1]);
      await expect(sut.getFacesById(authStub.admin, { id: faceStub.face1.assetId })).resolves.toStrictEqual([
        mapFaces(faceStub.primaryFace1, authStub.admin),
      ]);
    });
    it('should reject if the user has not access to the asset', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set());
      personMock.getFaces.mockResolvedValue([faceStub.primaryFace1]);
      await expect(sut.getFacesById(authStub.admin, { id: faceStub.primaryFace1.assetId })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('createNewFeaturePhoto', () => {
    it('should change person feature photo', async () => {
      personMock.getRandomFace.mockResolvedValue(faceStub.primaryFace1);
      await sut.createNewFeaturePhoto([personStub.newThumbnail.id]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });
  });

  describe('reassignFacesById', () => {
    it('should create a new person', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.noName.id]));
      accessMock.person.checkFaceOwnerAccess.mockResolvedValue(new Set([faceStub.face1.id]));
      personMock.getFaceById.mockResolvedValue(faceStub.face1);
      personMock.reassignFace.mockResolvedValue(1);
      personMock.getById.mockResolvedValue(personStub.noName);
      personMock.getRandomFace.mockResolvedValue(null);
      await expect(
        sut.reassignFacesById(authStub.admin, personStub.noName.id, {
          id: faceStub.face1.id,
        }),
      ).resolves.toEqual({
        birthDate: personStub.noName.birthDate,
        isHidden: personStub.noName.isHidden,
        id: personStub.noName.id,
        name: personStub.noName.name,
        thumbnailPath: personStub.noName.thumbnailPath,
        updatedAt: expect.any(Date),
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith();
      expect(jobMock.queueAll).not.toHaveBeenCalledWith();
    });

    it('should fail if user has not the correct permissions on the asset', async () => {
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set([personStub.noName.id]));
      personMock.getFaceById.mockResolvedValue(faceStub.face1);
      personMock.reassignFace.mockResolvedValue(1);
      personMock.getById.mockResolvedValue(personStub.noName);
      personMock.getRandomFace.mockResolvedValue(null);
      await expect(
        sut.reassignFacesById(authStub.admin, personStub.noName.id, {
          id: faceStub.face1.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalledWith();
      expect(jobMock.queueAll).not.toHaveBeenCalledWith();
    });
  });

  describe('createPerson', () => {
    it('should create a new person', async () => {
      personMock.create.mockResolvedValue(personStub.primaryPerson);

      await expect(sut.create(authStub.admin, {})).resolves.toBe(personStub.primaryPerson);

      expect(personMock.create).toHaveBeenCalledWith({ ownerId: authStub.admin.user.id });
    });
  });

  describe('handlePersonCleanup', () => {
    it('should delete people without faces', async () => {
      personMock.getAllWithoutFaces.mockResolvedValue([personStub.noName]);

      await sut.handlePersonCleanup();

      expect(personMock.delete).toHaveBeenCalledWith([personStub.noName]);
      expect(storageMock.unlink).toHaveBeenCalledWith(personStub.noName.thumbnailPath);
    });
  });

  describe('handleQueueDetectFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleQueueDetectFaces({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({ force: false });

      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.FACES);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([personStub.withName]);

      await sut.handleQueueDetectFaces({ force: true });

      expect(personMock.deleteFaces).toHaveBeenCalledWith({ sourceType: SourceType.MACHINE_LEARNING });
      expect(personMock.delete).toHaveBeenCalledWith([personStub.withName]);
      expect(storageMock.unlink).toHaveBeenCalledWith(personStub.withName.thumbnailPath);
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should refresh all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({ force: undefined });

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(personMock.deleteFaces).not.toHaveBeenCalled();
      expect(storageMock.unlink).not.toHaveBeenCalled();
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.PERSON_CLEANUP });
    });

    it('should delete existing people and faces if forced', async () => {
      personMock.getAll.mockResolvedValue({
        items: [faceStub.face1.person, personStub.randomPerson],
        hasNextPage: false,
      });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([personStub.randomPerson]);

      await sut.handleQueueDetectFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
      expect(personMock.delete).toHaveBeenCalledWith([personStub.randomPerson]);
      expect(storageMock.unlink).toHaveBeenCalledWith(personStub.randomPerson.thumbnailPath);
    });
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should skip if machine learning is disabled', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should skip if recognition jobs are already queued', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 1, paused: 0, completed: 0, failed: 0, delayed: 0 });

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({});

      expect(personMock.getAllFaces).toHaveBeenCalledWith(
        { skip: 0, take: 1000 },
        { where: { personId: IsNull(), sourceType: SourceType.MACHINE_LEARNING } },
      );
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should queue all assets', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(personMock.getAllFaces).toHaveBeenCalledWith({ skip: 0, take: 1000 }, {});
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should run nightly if new face has been added since last run', async () => {
      personMock.getLatestFaceDate.mockResolvedValue(new Date().toISOString());
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true, nightly: true });

      expect(systemMock.get).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE);
      expect(personMock.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(personMock.getAllFaces).toHaveBeenCalledWith({ skip: 0, take: 1000 }, {});
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE, {
        lastRun: expect.any(String),
      });
    });

    it('should skip nightly if no new face has been added since last run', async () => {
      const lastRun = new Date();

      systemMock.get.mockResolvedValue({ lastRun: lastRun.toISOString() });
      personMock.getLatestFaceDate.mockResolvedValue(new Date(lastRun.getTime() - 1).toISOString());
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });
      personMock.getAllWithoutFaces.mockResolvedValue([]);

      await sut.handleQueueRecognizeFaces({ force: true, nightly: true });

      expect(systemMock.get).toHaveBeenCalledWith(SystemMetadataKey.FACIAL_RECOGNITION_STATE);
      expect(personMock.getLatestFaceDate).toHaveBeenCalledOnce();
      expect(personMock.getAllFaces).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should delete existing people if forced', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAll.mockResolvedValue({
        items: [faceStub.face1.person, personStub.randomPerson],
        hasNextPage: false,
      });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });

      personMock.getAllWithoutFaces.mockResolvedValue([personStub.randomPerson]);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(personMock.deleteFaces).not.toHaveBeenCalled();
      expect(personMock.unassignFaces).toHaveBeenCalledWith({ sourceType: SourceType.MACHINE_LEARNING });
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(personMock.delete).toHaveBeenCalledWith([personStub.randomPerson]);
      expect(storageMock.unlink).toHaveBeenCalledWith(personStub.randomPerson.thumbnailPath);
    });
  });

  describe('handleDetectFaces', () => {
    beforeEach(() => {
      cryptoMock.randomUUID.mockReturnValue(faceId);
    });

    it('should skip if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleDetectFaces({ id: 'foo' })).resolves.toBe(JobStatus.SKIPPED);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
    });

    it('should skip when no resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleDetectFaces({ id: assetStub.noResizePath.id });
      expect(machineLearningMock.detectFaces).not.toHaveBeenCalled();
    });

    it('should skip it the asset has already been processed', async () => {
      assetMock.getByIds.mockResolvedValue([
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
      expect(machineLearningMock.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      const start = Date.now();

      machineLearningMock.detectFaces.mockResolvedValue({ imageHeight: 500, imageWidth: 400, faces: [] });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleDetectFaces({ id: assetStub.image.id });
      expect(machineLearningMock.detectFaces).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ minScore: 0.7, modelName: 'buffalo_l' }),
      );
      expect(personMock.createFaces).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();

      expect(assetMock.upsertJobStatus).toHaveBeenCalledWith({
        assetId: assetStub.image.id,
        facesRecognizedAt: expect.any(Date),
      });
      expect(assetMock.upsertJobStatus.mock.calls[0][0].facesRecognizedAt?.getTime()).toBeGreaterThan(start);
    });

    it('should create a face with no person and queue recognition job', async () => {
      personMock.createFaces.mockResolvedValue([faceStub.face1.id]);
      machineLearningMock.detectFaces.mockResolvedValue(detectFaceMock);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.refreshFaces).toHaveBeenCalledWith([face], [], [faceSearch]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should delete an existing face not among the new detected faces', async () => {
      machineLearningMock.detectFaces.mockResolvedValue({ faces: [], imageHeight: 500, imageWidth: 400 });
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.primaryFace1] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.refreshFaces).toHaveBeenCalledWith([], [faceStub.primaryFace1.id], []);
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add new face and delete an existing face not among the new detected faces', async () => {
      personMock.createFaces.mockResolvedValue([faceStub.face1.id]);
      machineLearningMock.detectFaces.mockResolvedValue(detectFaceMock);
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.primaryFace1] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.refreshFaces).toHaveBeenCalledWith([face], [faceStub.primaryFace1.id], [faceSearch]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should add embedding to matching metadata face', async () => {
      machineLearningMock.detectFaces.mockResolvedValue(detectFaceMock);
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.fromExif1] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.refreshFaces).toHaveBeenCalledWith(
        [],
        [],
        [{ faceId: faceStub.fromExif1.id, embedding: faceSearch.embedding }],
      );
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not add embedding to non-matching metadata face', async () => {
      machineLearningMock.detectFaces.mockResolvedValue(detectFaceMock);
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, faces: [faceStub.fromExif2] }]);

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.refreshFaces).toHaveBeenCalledWith([face], [], [faceSearch]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceId } },
      ]);
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should fail if face does not exist', async () => {
      personMock.getFaceByIdWithAssets.mockResolvedValue(null);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.FAILED);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.createFaces).not.toHaveBeenCalled();
    });

    it('should fail if face does not have asset', async () => {
      const face = { ...faceStub.face1, asset: null } as AssetFaceEntity & { asset: null };
      personMock.getFaceByIdWithAssets.mockResolvedValue(face);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.FAILED);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.createFaces).not.toHaveBeenCalled();
    });

    it('should skip if face already has an assigned person', async () => {
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(JobStatus.SKIPPED);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.createFaces).not.toHaveBeenCalled();
    });

    it('should match existing person', async () => {
      if (!faceStub.primaryFace1.person) {
        throw new Error('faceStub.primaryFace1.person is null');
      }

      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.primaryFace1, distance: 0.2 },
        { face: faceStub.noPerson2, distance: 0.3 },
        { face: faceStub.face1, distance: 0.4 },
      ] as FaceSearchResult[];

      systemMock.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      searchMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(faceStub.primaryFace1.person);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).toHaveBeenCalledTimes(1);
      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.arrayContaining([faceStub.noPerson1.id]),
        newPersonId: faceStub.primaryFace1.person.id,
      });
      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        faceIds: expect.not.arrayContaining([faceStub.face1.id]),
        newPersonId: faceStub.primaryFace1.person.id,
      });
    });

    it('should create a new person if the face is a core point with no person', async () => {
      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.noPerson2, distance: 0.3 },
      ] as FaceSearchResult[];

      systemMock.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
      searchMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(personMock.create).toHaveBeenCalledWith({
        ownerId: faceStub.noPerson1.asset.ownerId,
        faceAssetId: faceStub.noPerson1.id,
      });
      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        faceIds: [faceStub.noPerson1.id],
        newPersonId: personStub.withName.id,
      });
    });

    it('should not queue face with no matches', async () => {
      const faces = [{ face: faceStub.noPerson1, distance: 0 }] as FaceSearchResult[];

      searchMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(searchMock.searchFaces).toHaveBeenCalledTimes(1);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should defer non-core faces to end of queue', async () => {
      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      systemMock.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      searchMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.FACIAL_RECOGNITION,
        data: { id: faceStub.noPerson1.id, deferred: true },
      });
      expect(searchMock.searchFaces).toHaveBeenCalledTimes(1);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not assign person to deferred non-core face with no matching person', async () => {
      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      systemMock.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 3 } } });
      searchMock.searchFaces.mockResolvedValueOnce(faces).mockResolvedValueOnce([]);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id, deferred: true });

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(searchMock.searchFaces).toHaveBeenCalledTimes(2);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleGeneratePersonThumbnail', () => {
    it('should skip if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleGeneratePersonThumbnail({ id: 'person-1' })).resolves.toBe(JobStatus.SKIPPED);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
    });

    it('should skip a person not found', async () => {
      personMock.getById.mockResolvedValue(null);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person without a face asset id', async () => {
      personMock.getById.mockResolvedValue(personStub.noThumbnail);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id not found', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.id });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id without a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.middle);
      assetMock.getById.mockResolvedValue(assetStub.primaryImage);

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(assetMock.getById).toHaveBeenCalledWith(faceStub.middle.assetId, { exifInfo: true, files: true });
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/admin_id/pe/rs');
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      expect(personMock.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.start.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.start);
      assetMock.getById.mockResolvedValue(assetStub.image);

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.end.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.end);
      assetMock.getById.mockResolvedValue(assetStub.primaryImage);

      await sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id });

      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(personStub.mergePerson);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(personMock.reassignFaces).not.toHaveBeenCalled();

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should merge two people without smart merge', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(personStub.mergePerson);
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: true },
      ]);

      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.primaryPerson.id,
        oldPersonId: personStub.mergePerson.id,
      });

      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should merge two people with smart merge', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.randomPerson);
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.update.mockResolvedValue({ ...personStub.randomPerson, name: personStub.primaryPerson.name });
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-3']));
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));

      await expect(sut.mergePerson(authStub.admin, 'person-3', { ids: ['person-1'] })).resolves.toEqual([
        { id: 'person-1', success: true },
      ]);

      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.randomPerson.id,
        oldPersonId: personStub.primaryPerson.id,
      });

      expect(personMock.update).toHaveBeenCalledWith({
        id: personStub.randomPerson.id,
        name: personStub.primaryPerson.name,
      });

      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw an error when the primary person is not found', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should handle invalid merge ids', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(null);
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should handle an error reassigning faces', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(personStub.mergePerson);
      personMock.reassignFaces.mockRejectedValue(new Error('update failed'));
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-1']));
      accessMock.person.checkOwnerAccess.mockResolvedValueOnce(new Set(['person-2']));

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.UNKNOWN },
      ]);

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });
  });

  describe('getStatistics', () => {
    it('should get correct number of person', async () => {
      personMock.getById.mockResolvedValue(personStub.primaryPerson);
      personMock.getStatistics.mockResolvedValue(statistics);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.getStatistics(authStub.admin, 'person-1')).resolves.toEqual({ assets: 3 });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should require person.read permission', async () => {
      personMock.getById.mockResolvedValue(personStub.primaryPerson);
      await expect(sut.getStatistics(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
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
