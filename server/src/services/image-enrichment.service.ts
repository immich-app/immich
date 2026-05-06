import { Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { createHash } from 'node:crypto';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetMetadataKey, AssetStatus, AssetType, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import {
  ImageDescriptionResult,
  NsfwDetectionOptions,
  NsfwDetectionResult,
} from 'src/repositories/machine-learning.repository';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { updateLockedColumns } from 'src/utils/database';
import { isImageDescriptionEnabled, isNsfwDetectionEnabled } from 'src/utils/misc';
import { upsertTags } from 'src/utils/tag';

type EnrichmentTask<T> =
  | {
      status: 'success';
      modelName: string;
      updatedAt: string;
      result: T;
      appliedDescriptionHash?: string;
      appliedTagHash?: string;
    }
  | {
      status: 'failed';
      modelName: string;
      updatedAt: string;
      error: string;
    };

type EnrichmentMetadata = {
  description?: EnrichmentTask<ImageDescriptionResult>;
  nsfwDetection?: EnrichmentTask<NsfwDetectionResult>;
};

const GENERATED_DESCRIPTION_PREFIX = 'AI description:';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const normalizeTag = (tag: string) =>
  tag
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9 _-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');

@Injectable()
export class ImageEnrichmentService extends BaseService {
  @OnJob({ name: JobName.ImageDescriptionQueueAll, queue: QueueName.ImageDescription })
  async handleQueueImageDescription({ force }: JobOf<JobName.ImageDescriptionQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isImageDescriptionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForImageDescriptionJob(force);

    for await (const asset of assets) {
      jobs.push({ name: JobName.ImageDescription, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.NsfwDetectionQueueAll, queue: QueueName.NsfwDetection })
  async handleQueueNsfwDetection({ force }: JobOf<JobName.NsfwDetectionQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isNsfwDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForNsfwDetectionJob(force);

    for await (const asset of assets) {
      jobs.push({ name: JobName.NsfwDetection, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.NsfwDetection, queue: QueueName.NsfwDetection })
  async handleNsfwDetection({ id }: JobOf<JobName.NsfwDetection>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isNsfwDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForImageEnrichment(id);
    if (!asset || !this.isEligibleImage(asset)) {
      return JobStatus.Skipped;
    }

    if (!asset.previewFile) {
      return JobStatus.Failed;
    }

    const metadata = await this.getEnrichmentMetadata(id);
    try {
      const result = await this.detectAndStoreNsfw(id, asset.previewFile, machineLearning.nsfwDetection, metadata);
      const changed = await this.applyNsfwTags(id, asset.ownerId, result, metadata);

      if (changed.metadata) {
        await this.saveEnrichmentMetadata(id, metadata);
      }

      if (changed.visible) {
        await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id } });
      }

      return JobStatus.Success;
    } catch (error) {
      metadata.nsfwDetection = {
        status: 'failed',
        modelName: machineLearning.nsfwDetection.modelName,
        updatedAt: new Date().toISOString(),
        error: getErrorMessage(error),
      };
      await this.saveEnrichmentMetadata(id, metadata);
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.ImageDescription, queue: QueueName.ImageDescription })
  async handleImageDescription({ id }: JobOf<JobName.ImageDescription>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isImageDescriptionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForImageEnrichment(id);
    if (!asset || !this.isEligibleImage(asset)) {
      return JobStatus.Skipped;
    }

    if (!asset.previewFile) {
      return JobStatus.Failed;
    }

    const metadata = await this.getEnrichmentMetadata(id);

    try {
      const nsfw = isNsfwDetectionEnabled(machineLearning)
        ? await this.ensureNsfw(id, asset.previewFile, metadata)
        : this.getStoredNsfw(metadata);
      const result = await this.machineLearningRepository.describeImage(
        asset.previewFile,
        machineLearning.imageDescription,
        nsfw,
      );

      metadata.description = {
        status: 'success',
        modelName: machineLearning.imageDescription.modelName,
        updatedAt: new Date().toISOString(),
        result,
      };
      await this.saveEnrichmentMetadata(id, metadata);

      const changed = await this.applyVisibleMetadata({
        id,
        ownerId: asset.ownerId,
        existingDescription: asset.description ?? '',
        result,
        nsfw,
        metadata,
      });

      if (changed.metadata) {
        await this.saveEnrichmentMetadata(id, metadata);
      }

      if (changed.visible) {
        await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id } });
      }

      return JobStatus.Success;
    } catch (error) {
      metadata.description = {
        status: 'failed',
        modelName: machineLearning.imageDescription.modelName,
        updatedAt: new Date().toISOString(),
        error: getErrorMessage(error),
      };
      await this.saveEnrichmentMetadata(id, metadata);
      return JobStatus.Failed;
    }
  }

  private async ensureNsfw(id: string, previewFile: string, metadata: EnrichmentMetadata) {
    const stored = this.getStoredNsfw(metadata);
    if (stored) {
      return stored;
    }

    const { machineLearning } = await this.getConfig({ withCache: true });
    return this.detectAndStoreNsfw(id, previewFile, machineLearning.nsfwDetection, metadata);
  }

  private async detectAndStoreNsfw(
    id: string,
    previewFile: string,
    config: NsfwDetectionOptions,
    metadata: EnrichmentMetadata,
  ) {
    const result = await this.machineLearningRepository.detectNsfw(previewFile, config);
    metadata.nsfwDetection = {
      status: 'success',
      modelName: config.modelName,
      updatedAt: new Date().toISOString(),
      result,
    };
    await this.saveEnrichmentMetadata(id, metadata);
    return result;
  }

  private getStoredNsfw(metadata: EnrichmentMetadata) {
    return metadata.nsfwDetection?.status === 'success' ? metadata.nsfwDetection.result : undefined;
  }

  private isEligibleImage(
    asset:
      | {
          type: AssetType;
          status: AssetStatus;
          deletedAt: Date | null;
          visibility: AssetVisibility;
        }
      | undefined,
  ) {
    return (
      asset?.type === AssetType.Image &&
      asset.status === AssetStatus.Active &&
      asset.deletedAt === null &&
      (asset.visibility === AssetVisibility.Timeline || asset.visibility === AssetVisibility.Archive)
    );
  }

  private async getEnrichmentMetadata(id: string): Promise<EnrichmentMetadata> {
    const row = await this.assetRepository.getMetadataByKey(id, AssetMetadataKey.MlEnrichment);
    return isRecord(row?.value) ? (row.value as EnrichmentMetadata) : {};
  }

  private async saveEnrichmentMetadata(id: string, value: EnrichmentMetadata) {
    await this.assetRepository.upsertMetadata(id, [
      { key: AssetMetadataKey.MlEnrichment, value: value as Record<string, unknown> },
    ]);
  }

  private async applyVisibleMetadata({
    id,
    ownerId,
    existingDescription,
    result,
    nsfw,
    metadata,
  }: {
    id: string;
    ownerId: string;
    existingDescription: string;
    result: ImageDescriptionResult;
    nsfw?: NsfwDetectionResult;
    metadata: EnrichmentMetadata;
  }) {
    let visible = false;
    let metadataChanged = false;

    const descriptionHash = hash(result.description);
    if (
      result.description &&
      metadata.description?.status === 'success' &&
      metadata.description.appliedDescriptionHash !== descriptionHash
    ) {
      const block = `${GENERATED_DESCRIPTION_PREFIX} ${result.description.trim()}`;
      if (!existingDescription.includes(block)) {
        const description = existingDescription.trim() ? `${existingDescription.trimEnd()}\n\n${block}` : block;
        await this.assetRepository.upsertExif({
          exif: updateLockedColumns({ assetId: id, description }),
          lockedPropertiesBehavior: 'append',
        });
        visible = true;
      }
      metadata.description.appliedDescriptionHash = descriptionHash;
      metadataChanged = true;
    }

    const tags = this.getTags(result, nsfw);
    const tagHash = hash(tags);
    if (
      tags.length > 0 &&
      metadata.description?.status === 'success' &&
      metadata.description.appliedTagHash !== tagHash
    ) {
      const tagsChanged = await this.upsertAssetTags(id, ownerId, tags);
      visible ||= tagsChanged;

      metadata.description.appliedTagHash = tagHash;
      metadataChanged = true;
    }

    return { visible, metadata: metadataChanged };
  }

  private async applyNsfwTags(id: string, ownerId: string, nsfw: NsfwDetectionResult, metadata: EnrichmentMetadata) {
    if (!nsfw.isNsfw || metadata.nsfwDetection?.status !== 'success') {
      return { visible: false, metadata: false };
    }

    const tags = this.getNsfwTags(nsfw);
    const tagHash = hash(tags);
    if (metadata.nsfwDetection.appliedTagHash === tagHash) {
      return { visible: false, metadata: false };
    }

    const visible = await this.upsertAssetTags(id, ownerId, tags);
    metadata.nsfwDetection.appliedTagHash = tagHash;
    return { visible, metadata: true };
  }

  private getTags(result: ImageDescriptionResult, nsfw?: NsfwDetectionResult) {
    const tags = new Set<string>();
    for (const tag of result.tags ?? []) {
      const normalized = normalizeTag(tag);
      if (normalized) {
        tags.add(normalized);
      }
    }

    if (nsfw?.isNsfw) {
      for (const tag of this.getNsfwTags(nsfw)) {
        tags.add(tag);
      }
    }

    return [...tags].slice(0, 24);
  }

  private getNsfwTags(nsfw: NsfwDetectionResult) {
    const tags = new Set(['nsfw']);
    for (const [label, score] of Object.entries(nsfw.labels)) {
      const normalized = normalizeTag(label);
      if (score >= 0.5 && normalized && normalized !== 'normal' && normalized !== 'safe') {
        tags.add(normalized);
      }
    }
    return [...tags];
  }

  private async upsertAssetTags(id: string, ownerId: string, tags: string[]) {
    const upsertedTags = await upsertTags(this.tagRepository, { userId: ownerId, tags });
    const items: Insertable<TagAssetTable>[] = upsertedTags.map((tag) => ({ tagId: tag.id, assetId: id }));
    const results = await this.tagRepository.upsertAssetIds(items);

    if (results.length === 0) {
      return false;
    }

    await this.updateExifTags(id);
    await this.eventRepository.emit('AssetTag', { assetId: id });
    return true;
  }

  private async updateExifTags(assetId: string) {
    const { tags } = await this.assetRepository.getForUpdateTags(assetId);
    await this.assetRepository.upsertExif({
      exif: updateLockedColumns({ assetId, tags: tags.map(({ value }) => value) }),
      lockedPropertiesBehavior: 'append',
    });
  }
}
