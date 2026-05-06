import { AssetImageEnrichmentAction } from 'src/dtos/asset.dto';
import { AssetMetadataKey, AssetStatus, AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { ImageEnrichmentService } from 'src/services/image-enrichment.service';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

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

  it('should queue description backfill jobs in batches when description generation is enabled', async () => {
    const firstAssetId = newUuid();
    const secondAssetId = newUuid();
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { enabled: true, nsfwDetection: { enabled: false }, imageDescription: { enabled: true } },
    });
    mocks.assetJob.streamForImageDescriptionJob.mockReturnValue(
      makeStream([{ id: firstAssetId }, { id: secondAssetId }]),
    );

    await expect(sut.handleQueueImageDescription({ force: false })).resolves.toBe(JobStatus.Success);

    expect(mocks.assetJob.streamForImageDescriptionJob).toHaveBeenCalledWith(false);
    expect(mocks.job.queueAll).toHaveBeenCalledWith([
      { name: JobName.ImageDescription, data: { id: firstAssetId } },
      { name: JobName.ImageDescription, data: { id: secondAssetId } },
    ]);
  });

  it('should skip NSFW backfill when NSFW detection is disabled', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { enabled: true, nsfwDetection: { enabled: false }, imageDescription: { enabled: true } },
    });

    await expect(sut.handleQueueNsfwDetection({ force: false })).resolves.toBe(JobStatus.Skipped);

    expect(mocks.assetJob.streamForNsfwDetectionJob).not.toHaveBeenCalled();
    expect(mocks.job.queueAll).not.toHaveBeenCalled();
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

  it('should store description failures without applying visible metadata', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: {
        enabled: true,
        nsfwDetection: { enabled: false },
        imageDescription: { enabled: true, modelName: 'Qwen/Qwen2.5-VL-3B-Instruct' },
      },
    });
    mocks.machineLearning.describeImage.mockRejectedValue(new Error('model unavailable'));

    await expect(sut.handleImageDescription({ id: assetId })).resolves.toBe(JobStatus.Failed);

    expect(mocks.asset.upsertExif).not.toHaveBeenCalled();
    expect(mocks.tag.upsertValue).not.toHaveBeenCalled();
    expect(mocks.job.queue).not.toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
    expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(
      assetId,
      expect.arrayContaining([
        expect.objectContaining({
          key: AssetMetadataKey.MlEnrichment,
          value: expect.objectContaining({
            description: expect.objectContaining({
              status: 'failed',
              modelName: 'Qwen/Qwen2.5-VL-3B-Instruct',
              error: 'model unavailable',
            }),
          }),
        }),
      ]),
    );
  });

  it('should not append an existing generated description block again', async () => {
    const description = 'A bright kitchen with a wooden table.';
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: {
        enabled: true,
        nsfwDetection: { enabled: false },
        imageDescription: { enabled: true, modelName: 'Qwen/Qwen2.5-VL-3B-Instruct' },
      },
    });
    mocks.assetJob.getForImageEnrichment.mockResolvedValue({
      id: assetId,
      ownerId,
      type: AssetType.Image,
      status: AssetStatus.Active,
      deletedAt: null,
      visibility: AssetVisibility.Timeline,
      description: `User note\n\nAI description: ${description}`,
      previewFile,
    });
    mocks.machineLearning.describeImage.mockResolvedValue({
      description,
      people: [],
      environment: 'kitchen',
      objects: ['table'],
      visible_text: [],
      context: 'indoor home photo',
      tags: [],
    });

    await expect(sut.handleImageDescription({ id: assetId })).resolves.toBe(JobStatus.Success);

    expect(mocks.asset.upsertExif).not.toHaveBeenCalled();
    expect(mocks.job.queue).not.toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
    expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(
      assetId,
      expect.arrayContaining([
        expect.objectContaining({
          key: AssetMetadataKey.MlEnrichment,
          value: expect.objectContaining({
            description: expect.objectContaining({
              appliedDescriptionHash: expect.any(String),
            }),
          }),
        }),
      ]),
    );
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

  it('should mark an NSFW result as safe and remove generated NSFW tags', async () => {
    mocks.asset.getById.mockResolvedValue({
      id: assetId,
      ownerId,
      exifInfo: { description: '' },
      tags: [],
    } as never);
    mocks.asset.getMetadataByKey.mockResolvedValue({
      key: AssetMetadataKey.MlEnrichment,
      updatedAt: new Date(),
      value: {
        nsfwDetection: {
          status: 'success',
          modelName: 'onnx-community/nsfw_image_detection-ONNX',
          updatedAt: '2026-05-05T00:00:00.000Z',
          appliedTagHash: 'hash',
          result: {
            isNsfw: true,
            score: 0.95,
            labels: { explicit: 0.95 },
          },
        },
      },
    });
    mocks.tag.getByValue
      .mockResolvedValueOnce({
        id: 'nsfw-id',
        value: 'nsfw',
        color: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'explicit-id',
        value: 'explicit',
        color: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

    const result = await sut.updateAssetEnrichment(authStub.admin, assetId, {
      action: AssetImageEnrichmentAction.MarkSafe,
    });

    expect(result.nsfwDetection.effectiveIsNsfw).toBe(false);
    expect(result.nsfwDetection.review).toEqual(
      expect.objectContaining({ action: 'marked-safe', isNsfw: false, reviewedBy: authStub.admin.user.id }),
    );
    expect(mocks.tag.removeAssetIds).toHaveBeenCalledWith('nsfw-id', [assetId]);
    expect(mocks.tag.removeAssetIds).toHaveBeenCalledWith('explicit-id', [assetId]);
    expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(
      assetId,
      expect.arrayContaining([
        expect.objectContaining({
          value: expect.objectContaining({
            nsfwDetection: expect.objectContaining({
              result: expect.objectContaining({ isNsfw: true }),
              review: expect.objectContaining({ action: 'marked-safe', isNsfw: false }),
            }),
          }),
        }),
      ]),
    );
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
  });

  it('should clear generated description without removing user text', async () => {
    mocks.asset.getById.mockResolvedValue({
      id: assetId,
      ownerId,
      exifInfo: { description: 'User note\n\nAI description: A generated caption.' },
      tags: [],
    } as never);
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.asset.getMetadataByKey.mockResolvedValue({
      key: AssetMetadataKey.MlEnrichment,
      updatedAt: new Date(),
      value: {
        description: {
          status: 'success',
          modelName: 'Qwen/Qwen2.5-VL-3B-Instruct',
          updatedAt: '2026-05-05T00:00:00.000Z',
          appliedDescriptionHash: 'hash',
          result: {
            description: 'A generated caption.',
            people: [],
            environment: '',
            objects: [],
            visible_text: [],
            context: '',
            tags: [],
          },
        },
      },
    });

    await sut.updateAssetEnrichment(authStub.admin, assetId, {
      action: AssetImageEnrichmentAction.ClearGeneratedDescription,
    });

    expect(mocks.asset.upsertExif).toHaveBeenCalledWith({
      exif: expect.objectContaining({ assetId, description: 'User note' }),
      lockedPropertiesBehavior: 'append',
    });
    expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(
      assetId,
      expect.arrayContaining([
        expect.objectContaining({
          value: {
            description: expect.not.objectContaining({ appliedDescriptionHash: expect.any(String) }),
          },
        }),
      ]),
    );
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: assetId } });
  });
});
