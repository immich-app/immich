import { Injectable } from '@nestjs/common';
import { type ClassificationFaceExclusion, type SystemConfig } from 'src/config';
import { OnEvent, OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetVisibility, ImmichWorker, JobName, JobStatus, QueueName, SystemMetadataKey } from 'src/enum';
import { type ClassificationFaceSummary } from 'src/repositories/classification.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { isFacialRecognitionEnabled } from 'src/utils/misc';
import { upsertTags } from 'src/utils/tag';

type ClassificationConfig = SystemConfig['classification'];

@Injectable()
export class ClassificationService extends BaseService {
  private embeddingCache = new Map<string, number[]>();
  private pendingEncodes = new Map<string, Promise<number[]>>();

  private async getOrEncodePrompt(prompt: string, modelName: string): Promise<number[]> {
    const key = `${modelName}::${prompt}`;

    const cached = this.embeddingCache.get(key);
    if (cached) {
      return cached;
    }

    const pending = this.pendingEncodes.get(key);
    if (pending) {
      return pending;
    }

    const promise = this.machineLearningRepository
      .encodeText(prompt, { modelName })
      .then((raw) => {
        const embedding = typeof raw === 'string' ? this.parseEmbedding(raw) : (raw as number[]);
        this.embeddingCache.set(key, embedding);
        this.pendingEncodes.delete(key);
        return embedding;
      })
      .catch((error) => {
        this.pendingEncodes.delete(key);
        throw error;
      });

    this.pendingEncodes.set(key, promise);
    return promise;
  }

  async scanLibrary(_auth: AuthDto): Promise<void> {
    await this.jobRepository.queue({
      name: JobName.AssetClassifyQueueAll,
      data: { force: true },
    });
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    const snapshot = await this.systemMetadataRepository.get(SystemMetadataKey.ClassificationConfigState);

    if (snapshot) {
      await this.reconcileAutoTags(snapshot, newConfig.classification);
    }

    await this.systemMetadataRepository.set(SystemMetadataKey.ClassificationConfigState, newConfig.classification);
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Microservices], server: true })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'ConfigUpdate'>) {
    const clipChanged = oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName;
    const classificationChanged = JSON.stringify(oldConfig.classification) !== JSON.stringify(newConfig.classification);

    if (!clipChanged && !classificationChanged) {
      return;
    }

    this.embeddingCache.clear();
    this.pendingEncodes.clear();

    if (classificationChanged) {
      await this.reconcileAutoTags(oldConfig.classification, newConfig.classification);
      await this.systemMetadataRepository.set(SystemMetadataKey.ClassificationConfigState, newConfig.classification);
    }
  }

  private async reconcileAutoTags(previous: ClassificationConfig, current: ClassificationConfig) {
    const currentByName = new Map(current.categories.map((c) => [c.name, c]));

    for (const previousCategory of previous.categories) {
      const currentCategory = currentByName.get(previousCategory.name);

      if (!currentCategory) {
        this.logger.log(`Classification category "${previousCategory.name}" removed; clearing auto-tag assignments`);
        await this.classificationRepository.removeAutoTagAssignments(previousCategory.name);
        continue;
      }

      if (currentCategory.similarity > previousCategory.similarity) {
        this.logger.log(
          `Classification category "${previousCategory.name}" similarity increased ` +
            `(${previousCategory.similarity} → ${currentCategory.similarity}); clearing auto-tag assignments`,
        );
        await this.classificationRepository.removeAutoTagAssignments(previousCategory.name);
      }
    }
  }

  @OnJob({ name: JobName.AssetClassifyQueueAll, queue: QueueName.Classification })
  async handleClassifyQueueAll({ force }: JobOf<JobName.AssetClassifyQueueAll>): Promise<JobStatus> {
    const { classification } = await this.getConfig({ withCache: true });

    if (!classification.enabled) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.classificationRepository.resetClassifiedAt();
    }

    const stream = this.classificationRepository.streamUnclassifiedAssets();

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

    const { classification, machineLearning } = await this.getConfig({ withCache: true });

    if (!classification.enabled) {
      return JobStatus.Skipped;
    }

    const embedding = await this.searchRepository.getEmbedding(id);
    if (!embedding) {
      return JobStatus.Skipped;
    }

    const enabledCategories = classification.categories.filter((c) => c.enabled);
    if (enabledCategories.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const eligibleCategories = await this.getEligibleCategories(enabledCategories, machineLearning, id);
    if (eligibleCategories.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const assetEmbedding = this.parseEmbedding(embedding);
    let shouldArchive = false;

    for (const category of eligibleCategories) {
      let bestSimilarity = -1;
      for (const prompt of category.prompts) {
        const promptEmbedding = await this.getOrEncodePrompt(prompt, machineLearning.clip.modelName);
        const similarity = this.cosineSimilarity(assetEmbedding, promptEmbedding);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
        }
      }

      if (bestSimilarity >= category.similarity) {
        const tags = await upsertTags(this.tagRepository, {
          userId: asset.ownerId,
          tags: [`Auto/${category.name}`],
        });
        const tagId = tags[0].id;
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

  private getFaceExclusion(category: ClassificationConfig['categories'][number]): ClassificationFaceExclusion {
    return category.faceExclusion ?? 'off';
  }

  private isFaceAwareCategory(category: ClassificationConfig['categories'][number]) {
    return this.getFaceExclusion(category) !== 'off';
  }

  private matchesFaceExclusion(rule: ClassificationFaceExclusion, summary: ClassificationFaceSummary) {
    switch (rule) {
      case 'any_assigned_face': {
        return summary.hasAssignedFace;
      }
      case 'named_people': {
        return summary.hasNamedPerson;
      }
      case 'named_visible_people': {
        return summary.hasNamedVisiblePerson;
      }
      case 'off': {
        return false;
      }
    }
  }

  private async getEligibleCategories(
    categories: ClassificationConfig['categories'],
    machineLearning: SystemConfig['machineLearning'],
    assetId: string,
  ) {
    const faceAwareCategories = categories.filter((category) => this.isFaceAwareCategory(category));
    if (faceAwareCategories.length === 0) {
      return categories;
    }

    if (!isFacialRecognitionEnabled(machineLearning)) {
      return categories.filter((category) => !this.isFaceAwareCategory(category));
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.FaceDetection, QueueName.FacialRecognition);
    const faceSummary = await this.classificationRepository.getFaceSummary(assetId);

    return categories.filter((category) => !this.matchesFaceExclusion(this.getFaceExclusion(category), faceSummary));
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
