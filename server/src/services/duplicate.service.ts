import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DeduplicateAllDto, DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { AssetFileType, AssetStatus, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { AssetDuplicateResult } from 'src/repositories/search.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { getAssetFile } from 'src/utils/asset.util';
import { isDuplicateDetectionEnabled } from 'src/utils/misc';

@Injectable()
export class DuplicateService extends BaseService {
  async getDuplicates(auth: AuthDto): Promise<DuplicateResponseDto[]> {
    const duplicates = await this.assetRepository.getDuplicates(auth.user.id);
    return duplicates.map(({ duplicateId, assets }) => ({
      duplicateId,
      assets: assets.map((asset) => mapAsset(asset, { auth })),
    }));
  }

  keepAll(auth: AuthDto) {
    return this.assetRepository.keepAllDuplicates(auth.user.id);
  }

  async deduplicateAll(auth: AuthDto, dto: DeduplicateAllDto) {
    if (dto.assetIdsToKeep.length === 0) {
      return;
    }

    const { trash } = await this.getConfig({ withCache: false });
    const deduplicatedStatus = trash.enabled ? AssetStatus.TRASHED : AssetStatus.DELETED;
    return this.assetRepository.deduplicateAll(auth.user.id, dto.assetIdsToKeep, deduplicatedStatus);
  }

  @OnJob({ name: JobName.QUEUE_DUPLICATE_DETECTION, queue: QueueName.DUPLICATE_DETECTION })
  async handleQueueSearchDuplicates({ force }: JobOf<JobName.QUEUE_DUPLICATE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForSearchDuplicates(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.DUPLICATE_DETECTION, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.DUPLICATE_DETECTION, queue: QueueName.DUPLICATE_DETECTION })
  async handleSearchDuplicates({ id }: JobOf<JobName.DUPLICATE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetJobRepository.getForSearchDuplicatesJob(id);
    if (!asset) {
      this.logger.error(`Asset ${id} not found`);
      return JobStatus.FAILED;
    }

    if (asset.stackId) {
      this.logger.debug(`Asset ${id} is part of a stack, skipping`);
      return JobStatus.SKIPPED;
    }

    if (asset.visibility == AssetVisibility.HIDDEN) {
      this.logger.debug(`Asset ${id} is not visible, skipping`);
      return JobStatus.SKIPPED;
    }

    const previewFile = getAssetFile(asset.files || [], AssetFileType.PREVIEW);
    if (!previewFile) {
      this.logger.warn(`Asset ${id} is missing preview image`);
      return JobStatus.FAILED;
    }

    if (!asset.embedding) {
      this.logger.debug(`Asset ${id} is missing embedding`);
      return JobStatus.FAILED;
    }

    const duplicateAssets = await this.searchRepository.searchDuplicates({
      assetId: asset.id,
      embedding: asset.embedding,
      maxDistance: machineLearning.duplicateDetection.maxDistance,
      type: asset.type,
      userIds: [asset.ownerId],
    });

    let assetIds = [asset.id];
    if (duplicateAssets.length > 0) {
      this.logger.debug(
        `Found ${duplicateAssets.length} duplicate${duplicateAssets.length === 1 ? '' : 's'} for asset ${asset.id}`,
      );
      assetIds = await this.updateDuplicates(asset, duplicateAssets);
    } else if (asset.duplicateId) {
      this.logger.debug(`No duplicates found for asset ${asset.id}, removing duplicateId`);
      await this.assetRepository.update({ id: asset.id, duplicateId: null });
    }

    const duplicatesDetectedAt = new Date();
    await this.assetRepository.upsertJobStatus(...assetIds.map((assetId) => ({ assetId, duplicatesDetectedAt })));

    return JobStatus.SUCCESS;
  }

  private async updateDuplicates(
    asset: { id: string; duplicateId: string | null },
    duplicateAssets: AssetDuplicateResult[],
  ): Promise<string[]> {
    const duplicateIds = [
      ...new Set(
        duplicateAssets
          .filter((asset): asset is AssetDuplicateResult & { duplicateId: string } => !!asset.duplicateId)
          .map((duplicate) => duplicate.duplicateId),
      ),
    ];

    const targetDuplicateId = asset.duplicateId ?? duplicateIds.shift() ?? this.cryptoRepository.randomUUID();
    const assetIdsToUpdate = duplicateAssets
      .filter((asset) => asset.duplicateId !== targetDuplicateId)
      .map((duplicate) => duplicate.assetId);
    assetIdsToUpdate.push(asset.id);

    await this.assetRepository.updateDuplicates({ targetDuplicateId, assetIds: assetIdsToUpdate, duplicateIds });
    return assetIdsToUpdate;
  }
}
