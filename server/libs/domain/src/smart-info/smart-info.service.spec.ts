import { AssetEntity } from '@app/infra/entities';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSmartInfoRepositoryMock,
} from '../../test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
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

  describe('handleQueueObjectTagging', () => {
    it('should queue the assets without tags', async () => {
      assetMock.getWithout.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueObjectTagging({ force: false });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.CLASSIFY_IMAGE, data: { asset: assetEntityStub.image } }],
        [{ name: JobName.DETECT_OBJECTS, data: { asset: assetEntityStub.image } }],
      ]);
      expect(assetMock.getWithout).toHaveBeenCalledWith(WithoutProperty.OBJECT_TAGS);
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueObjectTagging({ force: true });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.CLASSIFY_IMAGE, data: { asset: assetEntityStub.image } }],
        [{ name: JobName.DETECT_OBJECTS, data: { asset: assetEntityStub.image } }],
      ]);
      expect(assetMock.getAll).toHaveBeenCalled();
    });
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

  describe('handleQueueEncodeClip', () => {
    it('should queue the assets without clip embeddings', async () => {
      assetMock.getWithout.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueEncodeClip({ force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { asset: assetEntityStub.image } });
      expect(assetMock.getWithout).toHaveBeenCalledWith(WithoutProperty.CLIP_ENCODING);
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueEncodeClip({ force: true });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { asset: assetEntityStub.image } });
      expect(assetMock.getAll).toHaveBeenCalled();
    });
  });

  describe('handleEncodeClip', () => {
    it('should skip assets without a resize path', async () => {
      await sut.handleEncodeClip({ asset: { resizePath: '' } as AssetEntity });

      expect(smartMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      machineMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);

      await sut.handleEncodeClip({ asset });

      expect(machineMock.encodeImage).toHaveBeenCalledWith({ thumbnailPath: 'path/to/resize.ext' });
      expect(smartMock.upsert).toHaveBeenCalledWith({
        assetId: 'asset-1',
        clipEmbedding: [0.01, 0.02, 0.03],
      });
    });

    it('should handle an error with the machine learning pipeline', async () => {
      machineMock.encodeImage.mockRejectedValue(new Error('Unable to read thumbnail'));

      await sut.handleEncodeClip({ asset });

      expect(smartMock.upsert).not.toHaveBeenCalled();
    });
  });
});
