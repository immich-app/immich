import {
  assetEntityStub,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newMediaRepositoryMock,
  newPersonRepositoryMock,
  newSearchRepositoryMock,
  newStorageRepositoryMock,
} from '../../test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IMediaRepository } from '../media';
import { IPersonRepository } from '../person';
import { ISearchRepository } from '../search';
import { IMachineLearningRepository } from '../smart-info';
import { IStorageRepository } from '../storage';
import { IFaceRepository } from './face.repository';
import { FacialRecognitionService } from './facial-recognition.services';

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
      assetMock.getWithout.mockResolvedValue([assetEntityStub.image]);
      await sut.handleQueueRecognizeFaces({});

      expect(assetMock.getWithout).toHaveBeenCalledWith(WithoutProperty.FACES);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      personMock.deleteAll.mockResolvedValue(5);
      searchMock.deleteAllFaces.mockResolvedValue(100);

      await sut.handleQueueRecognizeFaces({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.RECOGNIZE_FACES,
        data: { asset: assetEntityStub.image },
      });
    });
  });
});
