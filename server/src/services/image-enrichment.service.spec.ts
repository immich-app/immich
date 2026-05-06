import { AssetMetadataKey, AssetStatus, AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { ImageEnrichmentService } from 'src/services/image-enrichment.service';
import { newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(ImageEnrichmentService.name, () => {
  let sut: ImageEnrichmentService;
  let mocks: ServiceMocks;

  const ownerId = newUuid();
  const assetId = newUuid();
  const previewFile = '/data/thumbs/preview.webp';

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ImageEnrichmentService));

    mocks.assetJob.getForImageEnrichment.mockResolvedValue({
      id: assetId,
      ownerId,
      type: AssetType.Image,
      status: AssetStatus.Active,
      deletedAt: null,
      visibility: AssetVisibility.Timeline,
      description: '',
      previewFile,
    });
    mocks.asset.getForUpdateTags.mockResolvedValue({
      tags: [{ value: 'nsfw' }, { value: 'explicit' }, { value: 'beach' }],
    });
    mocks.tag.upsertValue.mockImplementation(({ userId, value }) =>
      Promise.resolve({ id: `${value}-id`, userId, value, parentId: null } as never),
    );
    mocks.tag.upsertAssetIds.mockResolvedValue([{ assetId, tagId: 'nsfw-id' } as never]);
  });

  it('should store NSFW results and apply visible NSFW tags when only NSFW detection is enabled', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { nsfwDetection: { enabled: true }, imageDescription: { enabled: false } },
    });
    mocks.machineLearning.detectNsfw.mockResolvedValue({
      isNsfw: true,
      score: 0.95,
      labels: { explicit: 0.95, normal: 0.05 },
    });

    await expect(sut.handleNsfwDetection({ id: assetId })).resolves.toBe(JobStatus.Success);

    expect(mocks.machineLearning.detectNsfw).toHaveBeenCalledWith(
      previewFile,
      expect.objectContaining({ modelName: 'onnx-community/nsfw_image_detection-ONNX', threshold: 0.85 }),
    );
    expect(mocks.tag.upsertValue).toHaveBeenCalledWith(expect.objectContaining({ userId: ownerId, value: 'nsfw' }));
    expect(mocks.tag.upsertValue).toHaveBeenCalledWith(expect.objectContaining({ userId: ownerId, value: 'explicit' }));
    expect(mocks.asset.upsertExif).toHaveBeenCalledWith({
      exif: expect.objectContaining({ assetId, tags: ['nsfw', 'explicit', 'beach'] }),
      lockedPropertiesBehavior: 'append',
    });
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
    expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(
      assetId,
      expect.arrayContaining([expect.objectContaining({ key: AssetMetadataKey.MlEnrichment })]),
    );
  });

  it('should run NSFW detection before image description when both scans are enabled', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { nsfwDetection: { enabled: true }, imageDescription: { enabled: true } },
    });
    mocks.assetJob.getForImageEnrichment.mockResolvedValue({
      id: assetId,
      ownerId,
      type: AssetType.Image,
      status: AssetStatus.Active,
      deletedAt: null,
      visibility: AssetVisibility.Timeline,
      description: 'User note',
      previewFile,
    });
    const nsfw = {
      isNsfw: true,
      score: 0.91,
      labels: { sexy: 0.91, normal: 0.03 },
    };
    mocks.machineLearning.detectNsfw.mockResolvedValue(nsfw);
    mocks.machineLearning.describeImage.mockResolvedValue({
      description: 'A person standing on a beach.',
      people: [],
      environment: 'beach',
      objects: ['sand'],
      visible_text: [],
      context: 'beach photo',
      tags: ['Beach', 'Person'],
    });

    await expect(sut.handleImageDescription({ id: assetId })).resolves.toBe(JobStatus.Success);

    expect(mocks.machineLearning.detectNsfw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.machineLearning.describeImage.mock.invocationCallOrder[0],
    );
    expect(mocks.machineLearning.describeImage).toHaveBeenCalledWith(
      previewFile,
      expect.objectContaining({ modelName: 'Qwen/Qwen2.5-VL-3B-Instruct' }),
      nsfw,
    );
    expect(mocks.asset.upsertExif).toHaveBeenCalledWith({
      exif: expect.objectContaining({
        assetId,
        description: 'User note\n\nAI description: A person standing on a beach.',
      }),
      lockedPropertiesBehavior: 'append',
    });
    expect(mocks.tag.upsertValue).toHaveBeenCalledWith(expect.objectContaining({ userId: ownerId, value: 'beach' }));
    expect(mocks.tag.upsertValue).toHaveBeenCalledWith(expect.objectContaining({ userId: ownerId, value: 'nsfw' }));
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
  });

  it.each([
    ['trashed', AssetStatus.Trashed, new Date()] as const,
    ['deleted', AssetStatus.Deleted, new Date()] as const,
  ])('should skip %s assets for single image enrichment jobs', async (_label, status, deletedAt) => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { nsfwDetection: { enabled: true }, imageDescription: { enabled: true } },
    });
    mocks.assetJob.getForImageEnrichment.mockResolvedValue({
      id: assetId,
      ownerId,
      type: AssetType.Image,
      status,
      deletedAt,
      visibility: AssetVisibility.Timeline,
      description: '',
      previewFile,
    });

    await expect(sut.handleImageDescription({ id: assetId })).resolves.toBe(JobStatus.Skipped);

    expect(mocks.machineLearning.detectNsfw).not.toHaveBeenCalled();
    expect(mocks.machineLearning.describeImage).not.toHaveBeenCalled();
    expect(mocks.asset.upsertMetadata).not.toHaveBeenCalled();
  });

  it('should skip locked assets for single image enrichment jobs', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { nsfwDetection: { enabled: true }, imageDescription: { enabled: true } },
    });
    mocks.assetJob.getForImageEnrichment.mockResolvedValue({
      id: assetId,
      ownerId,
      type: AssetType.Image,
      status: AssetStatus.Active,
      deletedAt: null,
      visibility: AssetVisibility.Locked,
      description: '',
      previewFile,
    });

    await expect(sut.handleNsfwDetection({ id: assetId })).resolves.toBe(JobStatus.Skipped);

    expect(mocks.machineLearning.detectNsfw).not.toHaveBeenCalled();
    expect(mocks.asset.upsertMetadata).not.toHaveBeenCalled();
  });
});
