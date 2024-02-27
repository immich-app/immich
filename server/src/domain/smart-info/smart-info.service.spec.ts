import { AssetEntity, SystemConfigKey } from '@app/infra/entities';
import {
  assetStub,
  newAssetRepositoryMock,
  newDatabaseRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSearchRepositoryMock,
  newSystemConfigRepositoryMock,
} from '@test';
import { JobName } from '../job';
import {
  IAssetRepository,
  IDatabaseRepository,
  IJobRepository,
  IMachineLearningRepository,
  ISearchRepository,
  ISystemConfigRepository,
  WithoutProperty,
} from '../repositories';
import { cleanModelName, getCLIPModelInfo } from './smart-info.constant';
import { SmartInfoService } from './smart-info.service';

const asset = {
  id: 'asset-1',
  resizePath: 'path/to/resize.ext',
} as AssetEntity;

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let databaseMock: jest.Mocked<IDatabaseRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    searchMock = newSearchRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    databaseMock = newDatabaseRepositoryMock();
    sut = new SmartInfoService(assetMock, databaseMock, jobMock, machineMock, searchMock, configMock);

    assetMock.getByIds.mockResolvedValue([asset]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await sut.handleQueueEncodeClip({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
    });

    it('should queue the assets without clip embeddings', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: false });

      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } }]);
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.SMART_SEARCH);
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: true });

      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } }]);
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).toHaveBeenCalled();
    });
  });

  describe('handleEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await sut.handleEncodeClip({ id: '123' });

      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      const asset = { resizePath: '' } as AssetEntity;
      assetMock.getByIds.mockResolvedValue([asset]);

      await sut.handleEncodeClip({ id: asset.id });

      expect(searchMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      searchMock.upsert.mockResolvedValue();
      machineMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);

      await sut.handleEncodeClip({ id: asset.id });

      expect(machineMock.encodeImage).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        { imagePath: 'path/to/resize.ext' },
        { enabled: true, modelName: 'ViT-B-32__openai' },
      );
      expect(searchMock.upsert).toHaveBeenCalledWith(
        {
          assetId: 'asset-1',
        },
        [0.01, 0.02, 0.03],
      );
    });
  });

  describe('cleanModelName', () => {
    it('should clean name', () => {
      expect(cleanModelName('ViT-B-32::openai')).toEqual('ViT-B-32__openai');
      expect(cleanModelName('M-CLIP/XLM-Roberta-Large-Vit-L-14')).toEqual('XLM-Roberta-Large-Vit-L-14');
    });
  });

  describe('getCLIPModelInfo', () => {
    it('should return the model info', () => {
      expect(getCLIPModelInfo('ViT-B-32__openai')).toEqual({ dimSize: 512 });
    });

    it('should throw an error if the model is not present', () => {
      expect(() => getCLIPModelInfo('test-model')).toThrow('Unknown CLIP model: test-model');
    });
  });
});
