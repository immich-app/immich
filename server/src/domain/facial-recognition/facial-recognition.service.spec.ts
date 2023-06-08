import {
  assetEntityStub,
  faceStub,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newMediaRepositoryMock,
  newPersonRepositoryMock,
  newSearchRepositoryMock,
  newStorageRepositoryMock,
  personStub,
} from '@test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IMediaRepository } from '../media';
import { IPersonRepository } from '../person';
import { ISearchRepository } from '../search';
import { IMachineLearningRepository } from '../smart-info';
import { IStorageRepository } from '../storage';
import { IFaceRepository } from './face.repository';
import { FacialRecognitionService } from './facial-recognition.services';

const croppedFace = Buffer.from('Cropped Face');

const face = {
  start: {
    assetId: 'asset-1',
    personId: 'person-1',
    boundingBox: {
      x1: 5,
      y1: 5,
      x2: 505,
      y2: 505,
    },
    imageHeight: 1000,
    imageWidth: 1000,
  },
  middle: {
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
  },
  end: {
    assetId: 'asset-1',
    personId: 'person-1',
    boundingBox: {
      x1: 300,
      y1: 300,
      x2: 495,
      y2: 495,
    },
    imageHeight: 500,
    imageWidth: 500,
  },
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
  let faceMock: jest.Mocked<IFaceRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineLearningMock: jest.Mocked<IMachineLearningRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
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
    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      await sut.handleQueueRecognizeFaces({});

      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.FACES);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetEntityStub.image.id },
      });
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      personMock.deleteAll.mockResolvedValue(5);
      searchMock.deleteAllFaces.mockResolvedValue(100);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { id: assetEntityStub.image.id },
      });
    });
  });

  describe('handleRecognizeFaces', () => {
    it('should skip when no resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.noResizePath]);
      await sut.handleRecognizeFaces({ id: assetEntityStub.noResizePath.id });
      expect(machineLearningMock.detectFaces).not.toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleRecognizeFaces({ id: assetEntityStub.image.id });
      expect(machineLearningMock.detectFaces).toHaveBeenCalledWith({
        imagePath: assetEntityStub.image.resizePath,
      });
      expect(faceMock.create).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should match existing people', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([face.middle]);
      searchMock.searchFaces.mockResolvedValue(faceSearch.oneMatch);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleRecognizeFaces({ id: assetEntityStub.image.id });

      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
      });
    });

    it('should create a new person', async () => {
      machineLearningMock.detectFaces.mockResolvedValue([face.middle]);
      searchMock.searchFaces.mockResolvedValue(faceSearch.oneRemoteMatch);
      personMock.create.mockResolvedValue(personStub.noName);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);

      await sut.handleRecognizeFaces({ id: assetEntityStub.image.id });

      expect(personMock.create).toHaveBeenCalledWith({ ownerId: assetEntityStub.image.ownerId });
      expect(faceMock.create).toHaveBeenCalledWith({
        personId: 'person-1',
        assetId: 'asset-id',
        embedding: [1, 2, 3, 4],
      });
      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.GENERATE_FACE_THUMBNAIL,
            data: {
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
              score: 0.2,
            },
          },
        ],
        [{ name: JobName.SEARCH_INDEX_FACE, data: { personId: 'person-1', assetId: 'asset-id' } }],
      ]);
    });
  });

  describe('handleGenerateFaceThumbnail', () => {
    it('should skip an asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should skip an asset without a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.noResizePath]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(mediaMock.crop).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);

      await sut.handleGenerateFaceThumbnail(face.middle);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1']);
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.ext', {
        left: 95,
        top: 95,
        width: 110,
        height: 110,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
      expect(personMock.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/user-id/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);

      await sut.handleGenerateFaceThumbnail(face.start);

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.ext', {
        left: 0,
        top: 0,
        width: 510,
        height: 510,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
    });

    it('should generate a thumbnail without overflowing', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);

      await sut.handleGenerateFaceThumbnail(face.end);

      expect(mediaMock.crop).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.ext', {
        left: 297,
        top: 297,
        width: 202,
        height: 202,
      });
      expect(mediaMock.resize).toHaveBeenCalledWith(croppedFace, 'upload/thumbs/user-id/person-1.jpeg', {
        format: 'jpeg',
        size: 250,
      });
    });
  });
});
