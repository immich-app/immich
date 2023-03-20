import { AssetEntity } from '@app/infra/db/entities';
import {
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSmartInfoRepositoryMock,
} from '../../test';
import { IAssetRepository } from '../asset';
import { IJobRepository } from '../job';
import { IMachineLearningRepository } from './machine-learning.interface';
import { ISmartInfoRepository } from './smart-info.repository';
import { SmartInfoService } from './smart-info.service';

const asset = {
  id: 'asset-1',
  resizePath: 'path/to/resize.ext',
} as AssetEntity;

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let smartMock: jest.Mocked<ISmartInfoRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    smartMock = newSmartInfoRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    sut = new SmartInfoService(assetMock, jobMock, smartMock, machineMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleTagImage', () => {
    it('should skip assets without a resize path', async () => {
      await sut.handleClassifyImage({ asset: { resizePath: '' } as AssetEntity });

      expect(smartMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.classifyImage).not.toHaveBeenCalled();
    });

    it('should save the returned tags', async () => {
      machineMock.classifyImage.mockResolvedValue(['tag1', 'tag2', 'tag3']);

      await sut.handleClassifyImage({ asset });

      expect(machineMock.classifyImage).toHaveBeenCalledWith({ thumbnailPath: 'path/to/resize.ext' });
      expect(smartMock.upsert).toHaveBeenCalledWith({
        assetId: 'asset-1',
        tags: ['tag1', 'tag2', 'tag3'],
      });
    });

    it('should handle an error with the machine learning pipeline', async () => {
      machineMock.classifyImage.mockRejectedValue(new Error('Unable to read thumbnail'));

      await sut.handleClassifyImage({ asset });

      expect(smartMock.upsert).not.toHaveBeenCalled();
    });

    it('should no update the smart info if no tags were returned', async () => {
      machineMock.classifyImage.mockResolvedValue([]);

      await sut.handleClassifyImage({ asset });

      expect(machineMock.classifyImage).toHaveBeenCalled();
      expect(smartMock.upsert).not.toHaveBeenCalled();
    });
  });

  describe('handleDetectObjects', () => {
    it('should skip assets without a resize path', async () => {
      await sut.handleDetectObjects({ asset: { resizePath: '' } as AssetEntity });

      expect(smartMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.detectObjects).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      machineMock.detectObjects.mockResolvedValue(['obj1', 'obj2', 'obj3']);

      await sut.handleDetectObjects({ asset });

      expect(machineMock.detectObjects).toHaveBeenCalledWith({ thumbnailPath: 'path/to/resize.ext' });
      expect(smartMock.upsert).toHaveBeenCalledWith({
        assetId: 'asset-1',
        objects: ['obj1', 'obj2', 'obj3'],
      });
    });

    it('should handle an error with the machine learning pipeline', async () => {
      machineMock.detectObjects.mockRejectedValue(new Error('Unable to read thumbnail'));

      await sut.handleDetectObjects({ asset });

      expect(smartMock.upsert).not.toHaveBeenCalled();
    });

    it('should no update the smart info if no objects were returned', async () => {
      machineMock.detectObjects.mockResolvedValue([]);

      await sut.handleDetectObjects({ asset });

      expect(machineMock.detectObjects).toHaveBeenCalled();
      expect(smartMock.upsert).not.toHaveBeenCalled();
    });
  });
});
