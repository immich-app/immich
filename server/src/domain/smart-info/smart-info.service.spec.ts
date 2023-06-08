import { AssetEntity } from '@app/infra/entities';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSmartInfoRepositoryMock,
} from '@test';
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

    assetMock.getByIds.mockResolvedValue([asset]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueObjectTagging', () => {
    it('should queue the assets without tags', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueObjectTagging({ force: false });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.CLASSIFY_IMAGE, data: { id: assetEntityStub.image.id } }],
      ]);
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.OBJECT_TAGS);
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueObjectTagging({ force: true });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.CLASSIFY_IMAGE, data: { id: assetEntityStub.image.id } }],
      ]);
      expect(assetMock.getAll).toHaveBeenCalled();
    });
  });

  describe('handleTagImage', () => {
    it('should skip assets without a resize path', async () => {
      const asset = { resizePath: '' } as AssetEntity;
      assetMock.getByIds.mockResolvedValue([asset]);

      await sut.handleClassifyImage({ id: asset.id });

      expect(smartMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.classifyImage).not.toHaveBeenCalled();
    });

    it('should save the returned tags', async () => {
      machineMock.classifyImage.mockResolvedValue(['tag1', 'tag2', 'tag3']);

      await sut.handleClassifyImage({ id: asset.id });

      expect(machineMock.classifyImage).toHaveBeenCalledWith({ imagePath: 'path/to/resize.ext' });
      expect(smartMock.upsert).toHaveBeenCalledWith({
        assetId: 'asset-1',
        tags: ['tag1', 'tag2', 'tag3'],
      });
    });

    it('should no update the smart info if no tags were returned', async () => {
      machineMock.classifyImage.mockResolvedValue([]);

      await sut.handleClassifyImage({ id: asset.id });

      expect(machineMock.classifyImage).toHaveBeenCalled();
      expect(smartMock.upsert).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueEncodeClip', () => {
    it('should queue the assets without clip embeddings', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { id: assetEntityStub.image.id } });
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.CLIP_ENCODING);
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: true });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { id: assetEntityStub.image.id } });
      expect(assetMock.getAll).toHaveBeenCalled();
    });
  });

  describe('handleEncodeClip', () => {
    it('should skip assets without a resize path', async () => {
      const asset = { resizePath: '' } as AssetEntity;
      assetMock.getByIds.mockResolvedValue([asset]);

      await sut.handleEncodeClip({ id: asset.id });

      expect(smartMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      machineMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);

      await sut.handleEncodeClip({ id: asset.id });

      expect(machineMock.encodeImage).toHaveBeenCalledWith({ imagePath: 'path/to/resize.ext' });
      expect(smartMock.upsert).toHaveBeenCalledWith({
        assetId: 'asset-1',
        clipEmbedding: [0.01, 0.02, 0.03],
      });
    });
  });
});
