import { NotFoundException } from '@nestjs/common';
import { AssetVisibility, JobName, JobStatus } from 'src/enum';
import { ClassificationService } from 'src/services/classification.service';
import { authStub } from 'test/fixtures/auth.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';

const makeConfig = (modelName: string) => ({
  machineLearning: { clip: { modelName } },
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

    it('should return Skipped when no CLIP embedding exists', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue(null);

      await expect(sut.handleClassify({ id: 'asset-1' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should return Skipped when user has no enabled categories', async () => {
      mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
      mocks.search.getEmbedding.mockResolvedValue('[0.1,0.2,0.3]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([]);

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
    });

    it('should tag asset when similarity exceeds threshold', async () => {
      // Asset embedding = [1,0,0], prompt embedding = [1,0,0] => cosine = 1.0
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Sunsets',
          similarity: 0.8,
          action: 'tag',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
      ]);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-1', assetId: 'asset-1' }]);
    });

    it('should NOT tag when similarity is below threshold', async () => {
      // Asset embedding = [1,0,0], prompt embedding = [0,1,0] => cosine = 0.0
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Sunsets',
          similarity: 0.8,
          action: 'tag',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[0,1,0]',
        },
      ]);

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
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Screenshots',
          similarity: 0.5,
          action: 'tag_and_archive',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
      ]);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

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
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Screenshots',
          similarity: 0.5,
          action: 'tag_and_archive',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
      ]);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

      await sut.handleClassify({ id: 'asset-1' });

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should create Auto/{name} tag when tagId is null', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Sunsets',
          similarity: 0.5,
          action: 'tag',
          tagId: null,
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
      ]);
      mocks.tag.upsertValue.mockResolvedValue({ id: 'new-tag-id', value: 'Auto/Sunsets' } as any);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);
      mocks.classification.updateCategory.mockResolvedValue(void 0 as any);

      await sut.handleClassify({ id: 'asset-1' });

      // upsertTags calls upsertValue for 'Auto' and then 'Auto/Sunsets'
      expect(mocks.tag.upsertValue).toHaveBeenCalledTimes(2);
      expect(mocks.classification.updateCategory).toHaveBeenCalledWith('cat-1', { tagId: 'new-tag-id' });
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'new-tag-id', assetId: 'asset-1' }]);
    });

    it('should handle multiple categories matching the same asset', async () => {
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Sunsets',
          similarity: 0.5,
          action: 'tag',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
        {
          categoryId: 'cat-2',
          name: 'Nature',
          similarity: 0.5,
          action: 'tag',
          tagId: 'tag-2',
          promptId: 'prompt-2',
          prompt: 'nature scene',
          embedding: '[1,0,0]',
        },
      ]);
      mocks.tag.upsertAssetIds.mockResolvedValue(void 0 as any);

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledTimes(2);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-1', assetId: 'asset-1' }]);
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-2', assetId: 'asset-1' }]);
    });

    it('should handle malformed embedding gracefully (NaN similarity < threshold)', async () => {
      // Empty embedding string => parseEmbedding returns [NaN] => cosine is NaN => NaN < threshold is false => no tag
      mocks.asset.getById.mockResolvedValue({
        id: 'asset-1',
        ownerId: 'user-1',
        visibility: AssetVisibility.Timeline,
      } as any);
      mocks.search.getEmbedding.mockResolvedValue('[]' as any);
      mocks.classification.getEnabledCategoriesWithEmbeddings.mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Test',
          similarity: 0.5,
          action: 'tag',
          tagId: 'tag-1',
          promptId: 'prompt-1',
          prompt: 'sunset sky',
          embedding: '[1,0,0]',
        },
      ]);

      const result = await sut.handleClassify({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
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

      const result = await sut.handleClassifyQueueAll({ userId: 'user-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.classification.streamUnclassifiedAssets).toHaveBeenCalledWith('user-1');
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetClassify, data: { id: 'a1' } },
        { name: JobName.AssetClassify, data: { id: 'a2' } },
        { name: JobName.AssetClassify, data: { id: 'a3' } },
      ]);
    });

    it('should flush exactly at 1000 boundary', async () => {
      const assets = Array.from({ length: 1000 }, (_, i) => ({ id: `asset-${i}`, ownerId: 'user-1' }));
      mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream(assets));

      await sut.handleClassifyQueueAll({});

      // First call with 1000, second call with empty remainder
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(2);
      const firstCall = mocks.job.queueAll.mock.calls[0][0] as any[];
      expect(firstCall).toHaveLength(1000);
      const secondCall = mocks.job.queueAll.mock.calls[1][0] as any[];
      expect(secondCall).toHaveLength(0);
    });
  });

  describe('createCategory', () => {
    it('should encode prompts via ML service and store embeddings', async () => {
      mocks.classification.createCategory.mockResolvedValue({
        id: 'cat-1',
        name: 'Sunsets',
        similarity: 0.8,
        action: 'tag',
        enabled: true,
        tagId: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      } as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0.1,0.2,0.3]');
      mocks.classification.upsertPromptEmbedding.mockResolvedValue(void 0 as any);

      const result = await sut.createCategory(authStub.user1, {
        name: 'Sunsets',
        prompts: ['golden hour', 'sunset sky'],
        similarity: 0.8,
        action: 'tag',
      });

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Sunsets');
      expect(result.prompts).toEqual(['golden hour', 'sunset sky']);
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(2);
      expect(mocks.classification.upsertPromptEmbedding).toHaveBeenCalledTimes(2);
      expect(mocks.classification.upsertPromptEmbedding).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        prompt: 'golden hour',
        embedding: '[0.1,0.2,0.3]',
      });
    });
  });

  describe('updateCategory', () => {
    const existingCategory = {
      id: 'cat-1',
      userId: 'user-id',
      name: 'Sunsets',
      similarity: 0.8,
      action: 'tag',
      enabled: true,
      tagId: 'tag-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('should throw NotFoundException for non-existent category', async () => {
      mocks.classification.getCategory.mockResolvedValue(void 0);

      await expect(sut.updateCategory(authStub.user1, 'non-existent', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for category owned by different user', async () => {
      mocks.classification.getCategory.mockResolvedValue({ ...existingCategory, userId: 'other-user' } as any);

      await expect(sut.updateCategory(authStub.user1, 'cat-1', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should re-encode prompts when prompts change', async () => {
      mocks.classification.getCategory.mockResolvedValue(existingCategory as any);
      mocks.classification.updateCategory.mockResolvedValue(existingCategory as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0.5,0.5,0.5]');
      mocks.classification.deletePromptEmbeddingsByCategory.mockResolvedValue(void 0 as any);
      mocks.classification.upsertPromptEmbedding.mockResolvedValue(void 0 as any);
      mocks.classification.getPromptEmbeddings.mockResolvedValue([{ prompt: 'new prompt' }] as any);

      await sut.updateCategory(authStub.user1, 'cat-1', { prompts: ['new prompt'] });

      expect(mocks.classification.deletePromptEmbeddingsByCategory).toHaveBeenCalledWith('cat-1');
      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
      expect(mocks.classification.upsertPromptEmbedding).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        prompt: 'new prompt',
        embedding: '[0.5,0.5,0.5]',
      });
    });

    it('should NOT re-encode when only name/similarity/action change', async () => {
      mocks.classification.getCategory.mockResolvedValue(existingCategory as any);
      mocks.classification.updateCategory.mockResolvedValue({ ...existingCategory, name: 'New Name' } as any);
      mocks.classification.getPromptEmbeddings.mockResolvedValue([{ prompt: 'old prompt' }] as any);
      mocks.tag.delete.mockResolvedValue(void 0 as any);

      await sut.updateCategory(authStub.user1, 'cat-1', { name: 'New Name', similarity: 0.9, action: 'tag' });

      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
      expect(mocks.classification.deletePromptEmbeddingsByCategory).not.toHaveBeenCalled();
    });

    it('should delete old tag when name changes', async () => {
      mocks.classification.getCategory.mockResolvedValue(existingCategory as any);
      mocks.classification.updateCategory.mockResolvedValue({
        ...existingCategory,
        name: 'New Name',
        tagId: null,
      } as any);
      mocks.classification.getPromptEmbeddings.mockResolvedValue([{ prompt: 'p' }] as any);

      await sut.updateCategory(authStub.user1, 'cat-1', { name: 'New Name' });

      expect(mocks.tag.delete).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('deleteCategory', () => {
    it('should delete associated tag', async () => {
      mocks.classification.getCategory.mockResolvedValue({
        id: 'cat-1',
        userId: 'user-id',
        tagId: 'tag-1',
      } as any);
      mocks.tag.delete.mockResolvedValue(void 0 as any);
      mocks.classification.deleteCategory.mockResolvedValue(void 0 as any);

      await sut.deleteCategory(authStub.user1, 'cat-1');

      expect(mocks.tag.delete).toHaveBeenCalledWith('tag-1');
      expect(mocks.classification.deleteCategory).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException for non-existent category', async () => {
      mocks.classification.getCategory.mockResolvedValue(void 0);

      await expect(sut.deleteCategory(authStub.user1, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategories', () => {
    it('should return categories with prompts grouped correctly', async () => {
      mocks.classification.getCategoriesWithPrompts.mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Sunsets',
          similarity: 0.8,
          action: 'tag',
          enabled: true,
          tagId: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          prompt: 'golden hour',
        },
        {
          id: 'cat-1',
          name: 'Sunsets',
          similarity: 0.8,
          action: 'tag',
          enabled: true,
          tagId: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          prompt: 'sunset sky',
        },
        {
          id: 'cat-2',
          name: 'Pets',
          similarity: 0.7,
          action: 'tag_and_archive',
          enabled: true,
          tagId: 'tag-2',
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
          prompt: 'cute dog',
        },
      ] as any);

      const result = await sut.getCategories(authStub.user1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[0].prompts).toEqual(['golden hour', 'sunset sky']);
      expect(result[1].id).toBe('cat-2');
      expect(result[1].prompts).toEqual(['cute dog']);
    });
  });

  describe('scanLibrary', () => {
    it('should reset classifiedAt and queue AssetClassifyQueueAll', async () => {
      mocks.classification.resetClassifiedAt.mockResolvedValue(void 0 as any);
      mocks.job.queue.mockResolvedValue(void 0 as any);

      await sut.scanLibrary(authStub.user1);

      expect(mocks.classification.resetClassifiedAt).toHaveBeenCalledWith('user-id');
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetClassifyQueueAll,
        data: { userId: 'user-id' },
      });
    });
  });

  describe('onConfigUpdate', () => {
    it('should re-encode all prompts when CLIP model changes', async () => {
      mocks.classification.getAllCategories.mockResolvedValue([{ id: 'cat-1' }] as any);
      mocks.classification.getPromptEmbeddings.mockResolvedValue([{ prompt: 'sunset' }] as any);
      mocks.classification.deletePromptEmbeddingsByCategory.mockResolvedValue(void 0 as any);
      mocks.machineLearning.encodeText.mockResolvedValue('[0.1,0.2,0.3]');
      mocks.classification.upsertPromptEmbedding.mockResolvedValue(void 0 as any);

      await sut.onConfigUpdate({
        oldConfig: makeConfig('old-model'),
        newConfig: makeConfig('new-model'),
      } as any);

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('sunset', { modelName: 'new-model' });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetClassifyQueueAll, data: {} });
    });

    it('should do nothing when CLIP model is unchanged', async () => {
      await sut.onConfigUpdate({
        oldConfig: makeConfig('same-model'),
        newConfig: makeConfig('same-model'),
      } as any);

      expect(mocks.classification.getAllCategories).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
    });

    it('should skip if no categories exist', async () => {
      mocks.classification.getAllCategories.mockResolvedValue([]);

      await sut.onConfigUpdate({
        oldConfig: makeConfig('old-model'),
        newConfig: makeConfig('new-model'),
      } as any);

      // Still queues the classify-all job even with no categories
      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetClassifyQueueAll, data: {} });
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
