import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ClassificationCategoryCreateDto,
  ClassificationCategoryResponseDto,
  ClassificationCategoryUpdateDto,
} from 'src/dtos/classification.dto';
import { AssetVisibility, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { upsertTags } from 'src/utils/tag';

@Injectable()
export class ClassificationService extends BaseService {
  private mapCategory(
    category: {
      id: string;
      name: string;
      similarity: number;
      action: string;
      enabled: boolean;
      tagId: string | null;
      createdAt: unknown;
      updatedAt: unknown;
    },
    prompts: string[],
  ): ClassificationCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      prompts,
      similarity: category.similarity,
      action: category.action,
      enabled: category.enabled,
      tagId: category.tagId,
      createdAt: String(category.createdAt),
      updatedAt: String(category.updatedAt),
    };
  }

  async getCategories(auth: AuthDto): Promise<ClassificationCategoryResponseDto[]> {
    const rows = await this.classificationRepository.getCategoriesWithPrompts(auth.user.id);

    const categoryMap = new Map<string, { category: (typeof rows)[0]; prompts: string[] }>();
    for (const row of rows) {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, { category: row, prompts: [] });
      }
      if (row.prompt) {
        categoryMap.get(row.id)!.prompts.push(row.prompt);
      }
    }

    return [...categoryMap.values()].map(({ category, prompts }) => this.mapCategory(category, prompts));
  }

  async createCategory(
    auth: AuthDto,
    dto: ClassificationCategoryCreateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    const { machineLearning } = await this.getConfig({ withCache: true });

    const category = await this.classificationRepository.createCategory({
      userId: auth.user.id,
      name: dto.name,
      similarity: dto.similarity,
      action: dto.action,
    });

    for (const prompt of dto.prompts) {
      const embedding = await this.machineLearningRepository.encodeText(prompt, {
        modelName: machineLearning.clip.modelName,
      });
      await this.classificationRepository.upsertPromptEmbedding({
        categoryId: category.id,
        prompt,
        embedding,
      });
    }

    return this.mapCategory(category, dto.prompts);
  }

  async updateCategory(
    auth: AuthDto,
    id: string,
    dto: ClassificationCategoryUpdateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    const existing = await this.classificationRepository.getCategory(id);
    if (!existing || existing.userId !== auth.user.id) {
      throw new NotFoundException('Category not found');
    }

    const updateValues: Record<string, unknown> = {};
    if (dto.name !== void 0) {
      if (dto.name !== existing.name && existing.tagId) {
        await this.tagRepository.delete(existing.tagId);
        updateValues.tagId = null;
      }
      updateValues.name = dto.name;
    }
    if (dto.similarity !== void 0) {
      updateValues.similarity = dto.similarity;
    }
    if (dto.action !== void 0) {
      updateValues.action = dto.action;
    }
    if (dto.enabled !== void 0) {
      updateValues.enabled = dto.enabled;
    }

    const category = await this.classificationRepository.updateCategory(id, updateValues);

    if (dto.prompts !== void 0) {
      const { machineLearning } = await this.getConfig({ withCache: true });
      await this.classificationRepository.deletePromptEmbeddingsByCategory(id);
      for (const prompt of dto.prompts) {
        const embedding = await this.machineLearningRepository.encodeText(prompt, {
          modelName: machineLearning.clip.modelName,
        });
        await this.classificationRepository.upsertPromptEmbedding({
          categoryId: id,
          prompt,
          embedding,
        });
      }
    }

    const promptRows = await this.classificationRepository.getPromptEmbeddings(id);
    return this.mapCategory(
      category,
      promptRows.map((p) => p.prompt),
    );
  }

  async deleteCategory(auth: AuthDto, id: string): Promise<void> {
    const category = await this.classificationRepository.getCategory(id);
    if (!category || category.userId !== auth.user.id) {
      throw new NotFoundException('Category not found');
    }

    if (category.tagId) {
      await this.tagRepository.delete(category.tagId);
    }

    await this.classificationRepository.deleteCategory(id);
  }

  async scanLibrary(auth: AuthDto): Promise<void> {
    await this.classificationRepository.resetClassifiedAt(auth.user.id);
    await this.jobRepository.queue({
      name: JobName.AssetClassifyQueueAll,
      data: { userId: auth.user.id },
    });
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Microservices], server: true })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'ConfigUpdate'>) {
    if (oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      this.logger.log('CLIP model changed, re-encoding classification prompt embeddings');
      await this.reEncodeAllPrompts(newConfig.machineLearning.clip.modelName);
      await this.jobRepository.queue({ name: JobName.AssetClassifyQueueAll, data: {} });
    }
  }

  private async reEncodeAllPrompts(modelName: string) {
    const categories = await this.classificationRepository.getAllCategories();
    for (const category of categories) {
      const prompts = await this.classificationRepository.getPromptEmbeddings(category.id);
      await this.classificationRepository.deletePromptEmbeddingsByCategory(category.id);
      for (const { prompt } of prompts) {
        const embedding = await this.machineLearningRepository.encodeText(prompt, { modelName });
        await this.classificationRepository.upsertPromptEmbedding({
          categoryId: category.id,
          prompt,
          embedding,
        });
      }
    }
  }

  @OnJob({ name: JobName.AssetClassifyQueueAll, queue: QueueName.Classification })
  async handleClassifyQueueAll(data: { userId?: string }): Promise<JobStatus> {
    const stream = this.classificationRepository.streamUnclassifiedAssets(data.userId);

    let queue: Array<{ name: JobName.AssetClassify; data: { id: string } }> = [];
    for await (const asset of stream) {
      queue.push({ name: JobName.AssetClassify, data: { id: asset.id } });
      if (queue.length >= 1000) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetClassify, queue: QueueName.Classification })
  async handleClassify({ id }: { id: string }): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    const embedding = await this.searchRepository.getEmbedding(id);
    if (!embedding) {
      return JobStatus.Skipped;
    }

    const rows = await this.classificationRepository.getEnabledCategoriesWithEmbeddings(asset.ownerId);
    if (rows.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const categories = new Map<
      string,
      { name: string; similarity: number; action: string; tagId: string | null; embeddings: string[] }
    >();
    for (const row of rows) {
      if (!categories.has(row.categoryId)) {
        categories.set(row.categoryId, {
          name: row.name,
          similarity: row.similarity,
          action: row.action,
          tagId: row.tagId,
          embeddings: [],
        });
      }
      categories.get(row.categoryId)!.embeddings.push(row.embedding);
    }

    const assetEmbedding = this.parseEmbedding(embedding);
    let shouldArchive = false;

    for (const [categoryId, category] of categories) {
      let bestSimilarity = -1;
      for (const promptEmbedding of category.embeddings) {
        const similarity = this.cosineSimilarity(assetEmbedding, this.parseEmbedding(promptEmbedding));
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
        }
      }

      if (bestSimilarity >= category.similarity) {
        let tagId = category.tagId;
        if (!tagId) {
          const tags = await upsertTags(this.tagRepository, {
            userId: asset.ownerId,
            tags: [`Auto/${category.name}`],
          });
          tagId = tags[0].id;
          await this.classificationRepository.updateCategory(categoryId, { tagId });
        }

        await this.tagRepository.upsertAssetIds([{ tagId, assetId: id }]);

        if (category.action === 'tag_and_archive') {
          shouldArchive = true;
        }
      }
    }

    if (shouldArchive && asset.visibility === AssetVisibility.Timeline) {
      await this.assetRepository.updateAll([id], { visibility: AssetVisibility.Archive });
    }

    await this.classificationRepository.setClassifiedAt(id);
    return JobStatus.Success;
  }

  private parseEmbedding(raw: string): number[] {
    return raw.replaceAll(/[[\]]/g, '').split(',').map(Number);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
