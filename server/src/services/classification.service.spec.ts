import { AssetVisibility, JobName, JobStatus, QueueName, SystemMetadataKey } from 'src/enum';
import { ClassificationService } from 'src/services/classification.service';
import { authStub } from 'test/fixtures/auth.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeClassificationConfig = (
  categories: Array<{
    name: string;
    prompts: string[];
    similarity: number;
    action: string;
    enabled?: boolean;
    faceExclusion?: 'off' | 'any_assigned_face' | 'named_people' | 'named_visible_people';
  }> = [],
  enabled = true,
  facialRecognitionEnabled = true,
) => ({
  classification: {
    enabled,
    categories: categories.map((c) => ({ ...c, enabled: c.enabled ?? true, faceExclusion: c.faceExclusion ?? 'off' })),
  },
  machineLearning: {
    enabled: true,
    clip: { modelName: 'test-model' },
    facialRecognition: { enabled: facialRecognitionEnabled },
  },
});

describe(ClassificationService.name, () => {
  let sut: ClassificationService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ClassificationService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleClassify', () => {
    it('should return Failed when asset not found', async () => {
      mocks.asset.getById.mockResolvedValue(void 0);
      await expect(sut.handleClassify({ id: 'missing-id' })).resolves.toBe(JobStatus.Failed);
    });

    it('should return Skipped when classification.enabled is false', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig([], false));

      await expect(sut.handleClassify({ id: 'asset-1' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should return Skipped when no CLIP embedding exists', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue(null);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );

      await expect(sut.handleClassify({ id: 'asset-1' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should return Skipped when no enabled categories (empty array)', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue('[0.1,0.2,0.3]' as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig([]));

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
    });

    it('should return Skipped when all categories are disabled', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue('[0.1,0.2,0.3]' as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          { name: 'Sunsets', prompts: ['sunset'], similarity: 0.5, action: 'tag', enabled: false },
          { name: 'Pets', prompts: ['cat'], similarity: 0.5, action: 'tag', enabled: false },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
    });

    it('should not wait for face queues or load face summary when all enabled categories are face exclusion off', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Sunsets' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'Sunsets',
            prompts: ['sunset sky'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'off',
          },
        ]),
      );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.job.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(mocks.classification.getFaceSummary).not.toHaveBeenCalled();
    });

    it('should skip any_assigned_face category when the asset has an assigned face', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.classification.getFaceSummary.mockResolvedValue({
        hasAssignedFace: true,
        hasNamedPerson: false,
        hasNamedVisiblePerson: false,
      });
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Screenshots' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'any_assigned_face',
          },
          {
            name: 'Screenshots',
            prompts: ['a screenshot'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'off',
          },
        ]),
      );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.job.waitForQueueCompletion).toHaveBeenCalledWith(
        QueueName.FaceDetection,
        QueueName.FacialRecognition,
      );
      expect(mocks.job.waitForQueueCompletion.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.classification.getFaceSummary.mock.invocationCallOrder[0],
      );
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a screenshot', { modelName: 'test-model' });
    });

    it('should skip named_people category only when a named person exists', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.classification.getFaceSummary.mockResolvedValue({
        hasAssignedFace: true,
        hasNamedPerson: false,
        hasNamedVisiblePerson: false,
      });
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/People' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'named_people',
          },
        ]),
      );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a portrait', { modelName: 'test-model' });
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-id', assetId: 'asset-1' }]);
    });

    it('should skip named_people category when a named person exists', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getFaceSummary.mockResolvedValue({
        hasAssignedFace: true,
        hasNamedPerson: true,
        hasNamedVisiblePerson: true,
      });
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'named_people',
          },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
    });

    it('should ignore hidden named people for named_visible_people', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.classification.getFaceSummary.mockResolvedValue({
        hasAssignedFace: true,
        hasNamedPerson: true,
        hasNamedVisiblePerson: false,
      });
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/People' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'named_visible_people',
          },
        ]),
      );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-id', assetId: 'asset-1' }]);
    });

    it('should skip named_visible_people category when a visible named person exists', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getFaceSummary.mockResolvedValue({
        hasAssignedFace: true,
        hasNamedPerson: true,
        hasNamedVisiblePerson: true,
      });
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'named_visible_people',
          },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
    });

    it('should skip face-aware categories when facial recognition is disabled and still classify off categories', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Screenshots' } as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig(
          [
            {
              name: 'People',
              prompts: ['a portrait'],
              similarity: 0.8,
              action: 'tag',
              faceExclusion: 'named_people',
            },
            {
              name: 'Screenshots',
              prompts: ['a screenshot'],
              similarity: 0.8,
              action: 'tag',
              faceExclusion: 'off',
            },
          ],
          true,
          false,
        ),
      );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.job.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(mocks.classification.getFaceSummary).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a screenshot', { modelName: 'test-model' });
    });

    it('should mark classified when all enabled categories require disabled facial recognition', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig(
          [
            {
              name: 'People',
              prompts: ['a portrait'],
              similarity: 0.8,
              action: 'tag',
              faceExclusion: 'named_people',
            },
          ],
          true,
          false,
        ),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
    });

    it('should tag asset when similarity exceeds threshold', async () => {
      // Asset embedding = [1,0,0], prompt embedding = [1,0,0] => cosine = 1.0
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'new-tag-id', value: 'Auto/Sunsets' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Sunsets', prompts: ['sunset sky'], similarity: 0.8, action: 'tag' }]),
        );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'new-tag-id', assetId: 'asset-1' }]);
    });

    it('should NOT tag when similarity is below threshold', async () => {
      // Asset embedding = [1,0,0], prompt embedding = [0,1,0] => cosine = 0.0
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0,1,0]');
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Sunsets', prompts: ['sunset sky'], similarity: 0.8, action: 'tag' }]),
        );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
    });

    it('should archive when action is tag_and_archive and asset visibility is Timeline', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'new-tag-id', value: 'Auto/Screenshots' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([
            { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.5, action: 'tag_and_archive' },
          ]),
        );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-1'], { visibility: AssetVisibility.Archive });
    });

    it('should NOT archive when asset is already archived', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Archive,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'new-tag-id', value: 'Auto/Screenshots' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([
            { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.5, action: 'tag_and_archive' },
          ]),
        );

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should handle multiple categories matching the same asset', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue
        .mockResolvedValueOnce({ id: 'tag-auto', value: 'Auto' } as any)
        .mockResolvedValueOnce({ id: 'tag-sunsets', value: 'Auto/Sunsets' } as any)
        .mockResolvedValueOnce({ id: 'tag-auto', value: 'Auto' } as any)
        .mockResolvedValueOnce({ id: 'tag-nature', value: 'Auto/Nature' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          { name: 'Sunsets', prompts: ['sunset sky'], similarity: 0.5, action: 'tag' },
          { name: 'Nature', prompts: ['nature scene'], similarity: 0.5, action: 'tag' },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledTimes(2);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-sunsets', assetId: 'asset-1' }]);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-nature', assetId: 'asset-1' }]);
    });

    it('should still classify enabled categories when some are disabled', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Enabled' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          { name: 'Disabled', prompts: ['disabled'], similarity: 0.5, action: 'tag', enabled: false },
          { name: 'Enabled', prompts: ['enabled'], similarity: 0.5, action: 'tag', enabled: true },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledTimes(1);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-id', assetId: 'asset-1' }]);
    });

    it('should resume classifying when a category is re-enabled', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/ReEnabled' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

      // First call: category disabled
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([
            { name: 'ReEnabled', prompts: ['test'], similarity: 0.5, action: 'tag', enabled: false },
          ]),
        );
      const result1 = await sut.handleClassify({ id: 'asset-1' });
      expect(result1).toBe(JobStatus.Skipped);
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();

      // Second call: category re-enabled
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([
            { name: 'ReEnabled', prompts: ['test'], similarity: 0.5, action: 'tag', enabled: true },
          ]),
        );
      const result2 = await sut.handleClassify({ id: 'asset-1' });
      expect(result2).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledTimes(1);
    });

    it('should NOT match when similarity threshold is increased (stricter)', async () => {
      // cosine([1,0,0], [0,1,0]) = 0 — does not match at 0.99
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0,1,0]'); // orthogonal = cosine 0
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.99, action: 'tag' }]),
        );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
    });

    it('should match when similarity threshold is decreased (looser)', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0.9,0.4,0]'); // cosine ≈ 0.91
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalled();
    });

    it('should match with strict similarity when prompts are more specific', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      // More specific prompt encodes to a closer vector
      mocks.machineLearning.encodeText.mockResolvedValue('[0.99,0.01,0]'); // cosine ≈ 0.9999
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([
            { name: 'Test', prompts: ['very specific prompt'], similarity: 0.99, action: 'tag' },
          ]),
        );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalled();
    });

    it('should archive when action changes from tag to tag_and_archive', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

      // First call: action is 'tag' — no archive
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );
      await sut.handleClassify({ id: 'asset-1' });
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();

      // Second call: action is 'tag_and_archive' — should archive
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag_and_archive' }]),
        );
      await sut.handleClassify({ id: 'asset-1' });
      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-1'], { visibility: AssetVisibility.Archive });
    });

    it('should tag new category added to config', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue
        .mockResolvedValueOnce({ id: 'tag-auto', value: 'Auto' } as any)
        .mockResolvedValueOnce({ id: 'tag-old', value: 'Auto/Old' } as any)
        .mockResolvedValueOnce({ id: 'tag-auto', value: 'Auto' } as any)
        .mockResolvedValueOnce({ id: 'tag-new', value: 'Auto/New' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          { name: 'Old', prompts: ['old'], similarity: 0.5, action: 'tag' },
          { name: 'New', prompts: ['new'], similarity: 0.5, action: 'tag' },
        ]),
      );

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledTimes(2);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-old', assetId: 'asset-1' }]);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-new', assetId: 'asset-1' }]);
    });
  });

  describe('embedding cache', () => {
    it('should cache prompt embeddings (second call skips encodeText)', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );

      await sut.handleClassify({ id: 'asset-1' });
      await sut.handleClassify({ id: 'asset-1' });

      // encodeText should only be called once — second call uses cache
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed encodeText calls', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );

      // First call: encodeText fails
      mocks.machineLearning.encodeText.mockRejectedValueOnce(new Error('ML unavailable'));
      await expect(sut.handleClassify({ id: 'asset-1' })).rejects.toThrow('ML unavailable');

      // Second call: encodeText succeeds — should actually call it again
      mocks.machineLearning.encodeText.mockResolvedValueOnce('[1,0,0]');
      const result = await sut.handleClassify({ id: 'asset-1' });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate concurrent encode calls for the same prompt', async () => {
      let resolveEncode: (value: string) => void;
      mocks.machineLearning.encodeText.mockReturnValue(
        new Promise((resolve) => {
          resolveEncode = resolve;
        }),
      );
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Test' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      sut['getConfig'] = vi
        .fn()
        .mockResolvedValue(
          makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]),
        );

      // Start two classify calls concurrently
      const p1 = sut.handleClassify({ id: 'asset-1' });
      const p2 = sut.handleClassify({ id: 'asset-1' });

      // Resolve the single encode call
      resolveEncode!('[1,0,0]');
      await Promise.all([p1, p2]);

      // encodeText should have been called exactly once despite two concurrent jobs
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleClassifyQueueAll', () => {
    it('should stream unclassified assets and queue jobs in batches', async () => {
      const assets = [
        { id: 'a1', ownerId: 'user-1' },
        { id: 'a2', ownerId: 'user-1' },
        { id: 'a3', ownerId: 'user-1' },
      ];
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream(assets));
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig());

      const result = await sut.handleClassifyQueueAll({});

      expect(result).toBe(JobStatus.Success);
      expect(mocks.classification.resetClassifiedAt).not.toHaveBeenCalled();
      expect(mocks.classification.streamUnclassifiedAssets).toHaveBeenCalledWith();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetClassify, data: { id: 'a1' } },
        { name: JobName.AssetClassify, data: { id: 'a2' } },
        { name: JobName.AssetClassify, data: { id: 'a3' } },
      ]);
    });

    it('should reset classifiedAt when force is true', async () => {
      mocks.classification.resetClassifiedAt.mockResolvedValue(void 0 as any);
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream([]));
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig());

      await sut.handleClassifyQueueAll({ force: true });

      expect(mocks.classification.resetClassifiedAt).toHaveBeenCalledWith();
    });

    it('should flush exactly at 1000 boundary', async () => {
      const assets = Array.from({ length: 1000 }, (_, i) => ({ id: `asset-${i}`, ownerId: 'user-1' }));
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream(assets));
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig());

      await sut.handleClassifyQueueAll({});

      // First call with 1000, second call with empty remainder
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(2);
      const firstCall = mocks.job.queueAll.mock.calls[0][0] as any[];
      expect(firstCall).toHaveLength(1000);
      const secondCall = mocks.job.queueAll.mock.calls[1][0] as any[];
      expect(secondCall).toHaveLength(0);
    });

    it('should return Skipped when classification.enabled is false', async () => {
      sut['getConfig'] = vi.fn().mockResolvedValue(makeClassificationConfig([], false));

      const result = await sut.handleClassifyQueueAll({ force: true });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.classification.resetClassifiedAt).not.toHaveBeenCalled();
      expect(mocks.classification.streamUnclassifiedAssets).not.toHaveBeenCalled();
    });

    it('should queue face work before forced classification when enabled categories are face-aware', async () => {
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream([{ id: 'asset-1', ownerId: 'user-1' }]));
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig([
          {
            name: 'People',
            prompts: ['a portrait'],
            similarity: 0.8,
            action: 'tag',
            faceExclusion: 'named_people',
          },
        ]),
      );

      await sut.handleClassifyQueueAll({ force: true });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetDetectFacesQueueAll,
        data: { force: true },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FacialRecognitionQueueAll,
        data: { force: true },
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetClassify, data: { id: 'asset-1' } }]);
    });

    it('should not queue face work before forced classification when facial recognition is disabled', async () => {
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream([{ id: 'asset-1', ownerId: 'user-1' }]));
      sut['getConfig'] = vi.fn().mockResolvedValue(
        makeClassificationConfig(
          [
            {
              name: 'People',
              prompts: ['a portrait'],
              similarity: 0.8,
              action: 'tag',
              faceExclusion: 'named_people',
            },
          ],
          true,
          false,
        ),
      );

      await sut.handleClassifyQueueAll({ force: true });

      expect(mocks.job.queue).not.toHaveBeenCalledWith({
        name: JobName.AssetDetectFacesQueueAll,
        data: { force: true },
      });
      expect(mocks.job.queue).not.toHaveBeenCalledWith({
        name: JobName.FacialRecognitionQueueAll,
        data: { force: true },
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetClassify, data: { id: 'asset-1' } }]);
    });
  });

  describe('scanLibrary', () => {
    it('should queue AssetClassifyQueueAll with force', async () => {
      mocks.job.queue.mockResolvedValue(void 0 as any);

      await sut.scanLibrary(authStub.user1);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetClassifyQueueAll,
        data: { force: true },
      });
    });
  });

  describe('onConfigUpdate', () => {
    it('should clear cache and clean up removed categories', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Sunsets', prompts: ['sunset'], similarity: 0.5, action: 'tag' },
        { name: 'ToRemove', prompts: ['remove'], similarity: 0.5, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'Sunsets', prompts: ['sunset'], similarity: 0.5, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('ToRemove');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(1);
    });

    it('should treat renamed category as removed', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'OldName', prompts: ['test'], similarity: 0.5, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'NewName', prompts: ['test'], similarity: 0.5, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('OldName');
    });

    it('should not clear cache for unrelated config changes', async () => {
      const config = makeClassificationConfig([{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }]);
      // Both old and new config are the same — only unrelated changes
      await sut.onConfigUpdate({ oldConfig: config, newConfig: config } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should clear cache when CLIP model changes', async () => {
      const oldConfig = {
        classification: { enabled: true, categories: [] },
        machineLearning: { clip: { modelName: 'old-model' } },
      };
      const newConfig = {
        classification: { enabled: true, categories: [] },
        machineLearning: { clip: { modelName: 'new-model' } },
      };

      // Pre-populate the cache
      sut['embeddingCache'].set('old-model::test', [1, 0, 0]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(sut['embeddingCache'].size).toBe(0);
    });

    it('should handle multiple removed categories at once', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Cat1', prompts: ['test1'], similarity: 0.5, action: 'tag' },
        { name: 'Cat2', prompts: ['test2'], similarity: 0.5, action: 'tag' },
        { name: 'Cat3', prompts: ['test3'], similarity: 0.5, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(3);
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Cat1');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Cat2');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Cat3');
    });

    it('should handle enabled to disabled transition (clear cache, no tag cleanup)', async () => {
      const oldConfig = makeClassificationConfig(
        [{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }],
        true,
      );
      const newConfig = makeClassificationConfig(
        [{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }],
        false,
      );

      sut['embeddingCache'].set('test-model::test', [1, 0, 0]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(sut['embeddingCache'].size).toBe(0);
      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should handle disabled to enabled transition (clear cache, no tag cleanup)', async () => {
      const oldConfig = makeClassificationConfig(
        [{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }],
        false,
      );
      const newConfig = makeClassificationConfig(
        [{ name: 'Test', prompts: ['test'], similarity: 0.5, action: 'tag' }],
        true,
      );

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(sut['embeddingCache'].size).toBe(0);
      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should NOT clean up tags when a new category is added', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Existing', prompts: ['test'], similarity: 0.5, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'Existing', prompts: ['test'], similarity: 0.5, action: 'tag' },
        { name: 'NewCategory', prompts: ['new'], similarity: 0.3, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should clean up old tags when category is renamed', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'OldName', prompts: ['sunset'], similarity: 0.5, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'NewName', prompts: ['sunset changed'], similarity: 0.5, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('OldName');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(1);
    });

    it('should clean up tags when similarity is increased (stricter)', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.28, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.4, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Screenshots');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(1);
    });

    it('should NOT clean up tags when similarity is decreased (looser)', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.35, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.2, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should NOT clean up tags when similarity stays the same', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.28, action: 'tag' },
      ]);
      const newConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot changed'], similarity: 0.28, action: 'tag' },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should not clean up tags when only face exclusion changes', async () => {
      const oldConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.28, action: 'tag', faceExclusion: 'off' },
      ]);
      const newConfig = makeClassificationConfig([
        {
          name: 'Screenshots',
          prompts: ['screenshot'],
          similarity: 0.28,
          action: 'tag',
          faceExclusion: 'named_people',
        },
      ]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.ClassificationConfigState,
        newConfig.classification,
      );
    });

    it('should write classification snapshot to system metadata after diff', async () => {
      const oldConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.3, action: 'tag' }]);
      const newConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.5, action: 'tag' }]);

      await sut.onConfigUpdate({ oldConfig, newConfig } as any);

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.ClassificationConfigState,
        newConfig.classification,
      );
    });
  });

  describe('onConfigInit', () => {
    it('should store baseline snapshot and skip cleanup when no snapshot exists', async () => {
      const newConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.5, action: 'tag' }]);
      mocks.systemMetadata.get.mockResolvedValue(null);

      await sut.onConfigInit({ newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.ClassificationConfigState,
        newConfig.classification,
      );
    });

    it('should clean up tags when current similarity is stricter than snapshot', async () => {
      const newConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.6, action: 'tag' },
      ]);
      const snapshot = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.3, action: 'tag' },
      ]).classification;
      mocks.systemMetadata.get.mockResolvedValue(snapshot as any);

      await sut.onConfigInit({ newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Screenshots');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(1);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.ClassificationConfigState,
        newConfig.classification,
      );
    });

    it('should read snapshot, reconcile, then write snapshot in that order', async () => {
      const newConfig = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.6, action: 'tag' },
      ]);
      const snapshot = makeClassificationConfig([
        { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.3, action: 'tag' },
      ]).classification;
      const callOrder: string[] = [];
      mocks.systemMetadata.get.mockImplementation(() => {
        callOrder.push('get');
        return Promise.resolve(snapshot as any);
      });
      mocks.classification.removeAutoTagAssignments.mockImplementation(() => {
        callOrder.push('reconcile');
        return Promise.resolve();
      });
      mocks.systemMetadata.set.mockImplementation(() => {
        callOrder.push('set');
        return Promise.resolve();
      });

      await sut.onConfigInit({ newConfig } as any);

      expect(callOrder).toEqual(['get', 'reconcile', 'set']);
    });

    it('should clean up tags for categories removed from config', async () => {
      const newConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.3, action: 'tag' }]);
      const snapshot = makeClassificationConfig([
        { name: 'Cats', prompts: ['cat'], similarity: 0.3, action: 'tag' },
        { name: 'Removed', prompts: ['removed'], similarity: 0.3, action: 'tag' },
      ]).classification;
      mocks.systemMetadata.get.mockResolvedValue(snapshot as any);

      await sut.onConfigInit({ newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledWith('Removed');
      expect(mocks.classification.removeAutoTagAssignments).toHaveBeenCalledTimes(1);
    });

    it('should not clean up tags when current similarity matches snapshot', async () => {
      const newConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.5, action: 'tag' }]);
      const snapshot = makeClassificationConfig([
        { name: 'Cats', prompts: ['cat'], similarity: 0.5, action: 'tag' },
      ]).classification;
      mocks.systemMetadata.get.mockResolvedValue(snapshot as any);

      await sut.onConfigInit({ newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });

    it('should not clean up tags when current similarity is looser than snapshot', async () => {
      const newConfig = makeClassificationConfig([{ name: 'Cats', prompts: ['cat'], similarity: 0.2, action: 'tag' }]);
      const snapshot = makeClassificationConfig([
        { name: 'Cats', prompts: ['cat'], similarity: 0.5, action: 'tag' },
      ]).classification;
      mocks.systemMetadata.get.mockResolvedValue(snapshot as any);

      await sut.onConfigInit({ newConfig } as any);

      expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
    });
  });

  describe('cosineSimilarity (indirect)', () => {
    it('should return 1.0 for identical vectors', () => {
      const result = (sut as any).cosineSimilarity([1, 2, 3], [1, 2, 3]);
      expect(result).toBeCloseTo(1);
    });

    it('should return 0.0 for orthogonal vectors', () => {
      const result = (sut as any).cosineSimilarity([1, 0, 0], [0, 1, 0]);
      expect(result).toBeCloseTo(0);
    });
  });
});
