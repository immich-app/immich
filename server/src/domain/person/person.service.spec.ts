import { AssetFaceEntity, Colorspace, SystemConfigKey } from '@app/infra/entities';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IAccessRepositoryMock,
  assetStub,
  authStub,
  faceStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newMediaRepositoryMock,
  newMoveRepositoryMock,
  newPersonRepositoryMock,
  newSmartInfoRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  personStub,
} from '@test';
import { IsNull } from 'typeorm';
import { BulkIdErrorReason } from '../asset';
import { CacheControl, ImmichFileResponse } from '../domain.util';
import { JobName } from '../job';
import {
  FaceSearchResult,
  IAssetRepository,
  ICryptoRepository,
  IJobRepository,
  IMachineLearningRepository,
  IMediaRepository,
  IMoveRepository,
  IPersonRepository,
  ISmartInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  WithoutProperty,
} from '../repositories';
import { PersonResponseDto, mapFaces, mapPerson } from './person.dto';
import { PersonService } from './person.service';

const responseDto: PersonResponseDto = {
  id: 'person-1',
  name: 'Person 1',
  birthDate: null,
  thumbnailPath: '/path/to/thumbnail.jpg',
  isHidden: false,
};

const statistics = { assets: 3 };

const croppedFace = Buffer.from('Cropped Face');

const detectFaceMock = {
  assetId: 'asset-1',
  personId: 'person-1',
  boundingBox: {
    x1: 100,
    y1: 100,
    x2: 200,
    y2: 200,
  },
  imageHeight: 500,
  imageWidth: 400,
  embedding: [1, 2, 3, 4],
  score: 0.2,
};

describe(PersonService.name, () => {
  let accessMock: IAccessRepositoryMock;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineLearningMock: jest.Mocked<IMachineLearningRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let moveMock: jest.Mocked<IMoveRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let smartInfoMock: jest.Mocked<ISmartInfoRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let sut: PersonService;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineLearningMock = newMachineLearningRepositoryMock();
    moveMock = newMoveRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    smartInfoMock = newSmartInfoRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    sut = new PersonService(
      accessMock,
      assetMock,
      machineLearningMock,
      moveMock,
      mediaMock,
      personMock,
      configMock,
      storageMock,
      jobMock,
      smartInfoMock,
      cryptoMock,
    );

    mediaMock.crop.mockResolvedValue(croppedFace);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.noThumbnail]);
      personMock.getNumberOfPeople.mockResolvedValue(1);
      await expect(sut.getAll(authStub.admin, { withHidden: undefined })).resolves.toEqual({
        total: 1,
        people: [responseDto],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.user.id, {
        minimumFaceCount: 3,
        withHidden: false,
      });
    });
    it('should get all visible people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.hidden]);
      personMock.getNumberOfPeople.mockResolvedValue(2);
      await expect(sut.getAll(authStub.admin, { withHidden: false })).resolves.toEqual({
        total: 2,
        people: [responseDto],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.user.id, {
        minimumFaceCount: 3,
        withHidden: false,
      });
    });
    it('should get all hidden and visible people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.hidden]);
      personMock.getNumberOfPeople.mockResolvedValue(2);
      await expect(sut.getAll(authStub.admin, { withHidden: true })).resolves.toEqual({
        total: 2,
        people: [
          responseDto,
          {
            id: 'person-1',
            name: '',
            birthDate: null,
            thumbnailPath: '/path/to/thumbnail.jpg',
            isHidden: true,
          },
        ],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.user.id, {
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

  describe('getAssets', () => {
    it('should require person.read permission', async () => {
      personMock.getAssets.mockResolvedValue([assetStub.image, assetStub.video]);
      await expect(sut.getAssets(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(personMock.getAssets).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should return a person's assets", async () => {
      personMock.getAssets.mockResolvedValue([assetStub.image, assetStub.video]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await sut.getAssets(authStub.admin, 'person-1');
      expect(personMock.getAssets).toHaveBeenCalledWith('person-1');
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
      personMock.getById.mockResolvedValue(null);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's name", async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', name: 'Person 1' });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's date of birth", async () => {
      personMock.getById.mockResolvedValue(personStub.noBirthDate);
      personMock.update.mockResolvedValue(personStub.withBirthDate);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { birthDate: new Date('1976-06-30') })).resolves.toEqual({
        id: 'person-1',
        name: 'Person 1',
        birthDate: new Date('1976-06-30'),
        thumbnailPath: '/path/to/thumbnail.jpg',
        isHidden: false,
      });
      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: new Date('1976-06-30') });
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it('should throw BadRequestException if birthDate is in the future', async () => {
      personMock.getById.mockResolvedValue(personStub.noBirthDate);
      personMock.update.mockResolvedValue(personStub.withBirthDate);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 1); // Set birthDate to one minute in the future

      await expect(sut.update(authStub.admin, 'person-1', { birthDate: futureDate })).rejects.toThrow(
        new BadRequestException('Date of birth cannot be in the future'),
      );
    });

    it('should not throw an error if birthdate is in the past', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 1); // Set birthDate to one minute in the past

      personMock.getById.mockResolvedValue(personStub.noBirthDate);
      personMock.update.mockResolvedValue({ ...personStub.withBirthDate, birthDate: pastDate });
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      const result = await sut.update(authStub.admin, 'person-1', { birthDate: pastDate });

      expect(result.birthDate).toEqual(pastDate);
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: pastDate });
    });

    it('should not throw an error if birthdate is today', async () => {
      const today = new Date(); // Set birthDate to now()

      personMock.getById.mockResolvedValue(personStub.noBirthDate);
      personMock.update.mockResolvedValue({ ...personStub.withBirthDate, birthDate: today });
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      const result = await sut.update(authStub.admin, 'person-1', { birthDate: today });

      expect(result.birthDate).toEqual(today);
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: today });
    });

    it('should update a person visibility', async () => {
      personMock.getById.mockResolvedValue(personStub.hidden);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(sut.update(authStub.admin, 'person-1', { isHidden: false })).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', isHidden: false });
      expect(accessMock.person.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['person-1']));
    });

    it("should update a person's thumbnailPath", async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getFacesByIds.mockResolvedValue([faceStub.face1]);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(
        sut.update(authStub.admin, 'person-1', { featureFaceAssetId: faceStub.face1.assetId }),
      ).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
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
      personMock.getById.mockResolvedValue(null);
      accessMock.person.checkOwnerAccess.mockResolvedValue(new Set(['person-1']));

      await expect(
        sut.updatePeople(authStub.admin, { people: [{ id: 'person-1', name: 'Person 1' }] }),
      ).resolves.toEqual([{ error: BulkIdErrorReason.UNKNOWN, id: 'person-1', success: false }]);
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
      await expect(sut.handlePersonMigration(personStub.noName)).resolves.toStrictEqual(false);
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
      personMock.getFaceById.mockResolvedValue(faceStub.face1);
      accessMock.person.checkFaceOwnerAccess.mockResolvedValue(new Set([faceStub.face1.id]));

      await expect(sut.createPerson(authStub.admin)).resolves.toBe(personStub.primaryPerson);
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
    it('should return if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleQueueDetectFaces({})).resolves.toBe(true);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({});

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
      personMock.getAll.mockResolvedValue({
        items: [personStub.withName],
        hasNextPage: false,
      });

      await sut.handleQueueDetectFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should delete existing people and faces if forced', async () => {
      personMock.getAll.mockResolvedValue({
        items: [faceStub.face1.person],
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

      await sut.handleQueueDetectFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
      expect(personMock.delete).toHaveBeenCalledWith([faceStub.face1.person]);
      expect(storageMock.unlink).toHaveBeenCalledWith(faceStub.face1.person.thumbnailPath);
    });
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should return if machine learning is disabled', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(true);
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
    });

    it('should return if recognition jobs are already queued', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 1, paused: 0, completed: 0, failed: 0, delayed: 0 });

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(true);
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });

      await sut.handleQueueRecognizeFaces({});

      expect(personMock.getAllFaces).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { personId: IsNull() } });
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
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

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(personMock.getAllFaces).toHaveBeenCalledWith({ skip: 0, take: 1000 }, {});
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
    });

    it('should delete existing people and faces if forced', async () => {
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0, paused: 0, completed: 0, failed: 0, delayed: 0 });
      personMock.getAll.mockResolvedValue({
        items: [faceStub.face1.person],
        hasNextPage: false,
      });
      personMock.getAllFaces.mockResolvedValue({
        items: [faceStub.face1],
        hasNextPage: false,
      });

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(personMock.getAllFaces).toHaveBeenCalledWith({ skip: 0, take: 1000 }, {});
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.FACIAL_RECOGNITION,
          data: { id: faceStub.face1.id, deferred: false },
        },
      ]);
      expect(personMock.delete).toHaveBeenCalledWith([faceStub.face1.person]);
      expect(storageMock.unlink).toHaveBeenCalledWith(faceStub.face1.person.thumbnailPath);
    });
  });

  describe('handleDetectFaces', () => {
    it('should return if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleDetectFaces({ id: 'foo' })).resolves.toBe(true);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
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

      machineLearningMock.detectFaces.mockResolvedValue([]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleDetectFaces({ id: assetStub.image.id });
      expect(machineLearningMock.detectFaces).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        {
          imagePath: assetStub.image.resizePath,
        },
        {
          enabled: true,
          maxDistance: 0.6,
          minScore: 0.7,
          minFaces: 3,
          modelName: 'buffalo_l',
        },
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
      machineLearningMock.detectFaces.mockResolvedValue([detectFaceMock]);
      smartInfoMock.searchFaces.mockResolvedValue([{ face: faceStub.face1, distance: 0.7 }]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      const face = {
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageHeight: 500,
        imageWidth: 400,
      };

      await sut.handleDetectFaces({ id: assetStub.image.id });

      expect(personMock.createFaces).toHaveBeenCalledWith([face]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.FACIAL_RECOGNITION, data: { id: faceStub.face1.id } },
      ]);
      expect(personMock.reassignFace).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should return false if face does not exist', async () => {
      personMock.getFaceByIdWithAssets.mockResolvedValue(null);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(false);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.createFaces).not.toHaveBeenCalled();
    });

    it('should return false if face does not have asset', async () => {
      const face = { ...faceStub.face1, asset: null } as AssetFaceEntity & { asset: null };
      personMock.getFaceByIdWithAssets.mockResolvedValue(face);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(false);

      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.createFaces).not.toHaveBeenCalled();
    });

    it('should return true if face already has an assigned person', async () => {
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);

      expect(await sut.handleRecognizeFaces({ id: faceStub.face1.id })).toBe(true);

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

      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_FACES, value: 1 },
      ]);
      smartInfoMock.searchFaces.mockResolvedValue(faces);
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

      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_FACES, value: 1 },
      ]);
      smartInfoMock.searchFaces.mockResolvedValue(faces);
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

      smartInfoMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(smartInfoMock.searchFaces).toHaveBeenCalledTimes(1);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should defer non-core faces to end of queue', async () => {
      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_FACES, value: 3 },
      ]);
      smartInfoMock.searchFaces.mockResolvedValue(faces);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.FACIAL_RECOGNITION,
        data: { id: faceStub.noPerson1.id, deferred: true },
      });
      expect(smartInfoMock.searchFaces).toHaveBeenCalledTimes(1);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });

    it('should not assign person to deferred non-core face with no matching person', async () => {
      const faces = [
        { face: faceStub.noPerson1, distance: 0 },
        { face: faceStub.noPerson2, distance: 0.4 },
      ] as FaceSearchResult[];

      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_FACES, value: 3 },
      ]);
      smartInfoMock.searchFaces.mockResolvedValueOnce(faces).mockResolvedValueOnce([]);
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.noPerson1);
      personMock.create.mockResolvedValue(personStub.withName);

      await sut.handleRecognizeFaces({ id: faceStub.noPerson1.id, deferred: true });

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(smartInfoMock.searchFaces).toHaveBeenCalledTimes(2);
      expect(personMock.create).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleGeneratePersonThumbnail', () => {
    it('should return if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleGeneratePersonThumbnail({ id: 'person-1' })).resolves.toBe(true);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
    });

    it('should skip a person not found', async () => {
      personMock.getById.mockResolvedValue(null);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip a person without a face asset id', async () => {
      personMock.getById.mockResolvedValue(personStub.noThumbnail);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id not found', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.id });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id without a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.face1);
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.middle);
      assetMock.getByIds.mockResolvedValue([assetStub.primaryImage]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(assetMock.getByIds).toHaveBeenCalledWith([faceStub.middle.assetId]);
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/admin_id/pe/rs');
      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/admin-id/thumbs/path.jpg', {
        left: 95,
        top: 95,
        width: 110,
        height: 110,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/admin_id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
      expect(personMock.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.start.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.start);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 0,
        top: 0,
        width: 510,
        height: 510,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/admin_id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
    });

    it('should generate a thumbnail without overflowing', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.end.assetId });
      personMock.getFaceByIdWithAssets.mockResolvedValue(faceStub.end);
      assetMock.getByIds.mockResolvedValue([assetStub.primaryImage]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/admin-id/thumbs/path.jpg', {
        left: 297,
        top: 297,
        width: 202,
        height: 202,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/admin_id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
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
