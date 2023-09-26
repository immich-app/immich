import { Colorspace, SystemConfigKey } from '@app/infra/entities';
import {
  assetStub,
  faceStub,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newMediaRepositoryMock,
  newPersonRepositoryMock,
  newSearchRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  personStub,
} from '@test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IMediaRepository } from '../media';
import { IPersonRepository } from '../person';
import { ISearchRepository } from '../search';
import { IMachineLearningRepository } from '../smart-info';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IFaceRepository } from './face.repository';
import { FacialRecognitionService } from './facial-recognition.services';

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

const faceSearch = {
  noMatch: {
    total: 0,
    count: 0,
    page: 1,
    items: [],
    distances: [],
    facets: [],
  },
  oneMatch: {
    total: 1,
    count: 1,
    page: 1,
    items: [faceStub.face1],
    distances: [0.1],
    facets: [],
  },
  oneRemoteMatch: {
    total: 1,
    count: 1,
    page: 1,
    items: [faceStub.face1],
    distances: [0.8],
    facets: [],
  },
};

describe(FacialRecognitionService.name, () => {
  let sut: FacialRecognitionService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let faceMock: jest.Mocked<IFaceRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineLearningMock: jest.Mocked<IMachineLearningRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    faceMock = newFaceRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineLearningMock = newMachineLearningRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    personMock = newPersonRepositoryMock();
    searchMock = newSearchRepositoryMock();
    storageMock = newStorageRepositoryMock();

    mediaMock.crop.mockResolvedValue(croppedFace);

    sut = new FacialRecognitionService(
      assetMock,
      configMock,
      faceMock,
      jobMock,
      machineLearningMock,
      mediaMock,
      personMock,
      searchMock,
      storageMock,
    );
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueRecognizeFaces', () => {
    it('should return if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleQueueRecognizeFaces({})).resolves.toBe(true);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      await sut.handleQueueRecognizeFaces({});

      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.FACES);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.deleteAll.mockResolvedValue(5);
      searchMock.deleteAllFaces.mockResolvedValue(100);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetStub.image.id },
      });
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should return if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleRecognizeFaces({ id: 'foo' })).resolves.toBe(true);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
    });

    it('should skip when no resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleRecognizeFaces({ id: assetStub.noResizePath.id });
      expect(machineLearningMock.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleRecognizeFaces({ id: assetStub.image.id });
      expect(machineLearningMock.detectFaces).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        {
          imagePath: assetStub.image.resizePath,
        },
        {
          enabled: true,
          maxDistance: 0.6,
          minScore: 0.7,
          minFaces: 1,
          modelName: 'buffalo_l',
        },
      );
      expect(faceMock.create).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should match existing people', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([detectFaceMock]);
      searchMock.searchFaces.mockResolvedValue(faceSearch.oneMatch);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleRecognizeFaces({ id: assetStub.image.id });

      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageHeight: 500,
        imageWidth: 400,
      });
    });

    it('should create a new person', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([detectFaceMock]);
      searchMock.searchFaces.mockResolvedValue(faceSearch.oneRemoteMatch);
      personMock.create.mockResolvedValue(personStub.noName);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleRecognizeFaces({ id: assetStub.image.id });

      expect(personMock.create).toHaveBeenCalledWith({ ownerId: assetStub.image.ownerId });
      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
        boundingBoxX1: 100,
        boundingBoxY1: 100,
        boundingBoxX2: 200,
        boundingBoxY2: 200,
        imageHeight: 500,
        imageWidth: 400,
      });
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.SEARCH_INDEX_FACE, data: { personId: 'person-1', assetId: 'asset-id' } }],
        [{ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: 'person-1' } }],
      ]);
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

    it('should skip an person with a face asset id not found', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      faceMock.getByIds.mockResolvedValue([faceStub.face1]);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip a person with a face asset id without a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      faceMock.getByIds.mockResolvedValue([faceStub.face1]);
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.middle.assetId });
      faceMock.getByIds.mockResolvedValue([faceStub.middle]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(assetMock.getByIds).toHaveBeenCalledWith([faceStub.middle.assetId]);
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/pe/rs');
      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 95,
        top: 95,
        width: 110,
        height: 110,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
      expect(personMock.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/user-id/pe/rs/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.start.assetId });
      faceMock.getByIds.mockResolvedValue([faceStub.start]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 0,
        top: 0,
        width: 510,
        height: 510,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
    });

    it('should generate a thumbnail without overflowing', async () => {
      personMock.getById.mockResolvedValue({ ...personStub.primaryPerson, faceAssetId: faceStub.end.assetId });
      faceMock.getByIds.mockResolvedValue([faceStub.end]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg', {
        left: 297,
        top: 297,
        width: 202,
        height: 202,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/pe/rs/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      });
    });
  });
});
