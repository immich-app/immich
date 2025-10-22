import { Inject, Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { AssetStatus, AssetVisibility, JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { AssetDuplicateResult } from 'src/repositories/search.repository';
import { AssetService } from 'src/services/asset.service';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { suggestDuplicate } from 'src/utils/duplicate-utils';
import { isDuplicateDetectionEnabled } from 'src/utils/misc';

@Injectable()
export class DuplicateService extends BaseService {
  @Inject() private assetService!: AssetService;

  async getDuplicates(auth: AuthDto, page = 1, size = 20): Promise<DuplicateResponseDto> {
    const { items, totalItems } = await this.duplicateRepository.getAll(auth.user.id, page, size);

    const duplicates = items.map(({ duplicateId, assets }) => ({
      duplicateId,
      assets: assets.map((asset) => mapAsset(asset, { auth })),
    }));

    const totalPages = Math.ceil(totalItems / size);
    const hasNextPage = page < totalPages;

    return {
      items: duplicates,
      totalItems,
      totalPages,
      hasNextPage,
    };
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.duplicateRepository.delete(auth.user.id, id);
  }

  async deleteAll(auth: AuthDto, dto: BulkIdsDto) {
    await this.duplicateRepository.deleteAll(auth.user.id, dto.ids);
  }

  async deDuplicateAll(auth: AuthDto) {
    let page = 1;
    const size = 100;
    let hasNextPage = true;

    while (hasNextPage) {
      const duplicates = await this.getDuplicates(auth, page, size);

      const idsToKeep = duplicates.items.map((group) => suggestDuplicate(group.assets)).map((asset) => asset?.id);
      const idsToDelete = duplicates.items.flatMap((group, i) =>
        group.assets.map((asset) => asset.id).filter((asset) => asset !== idsToKeep[i]),
      );

      // This is duplicated from asset.service - deleteAll()
      await this.requireAccess({ auth, permission: Permission.AssetDelete, ids: idsToDelete });
      await this.assetRepository.updateAll(idsToDelete, {
        deletedAt: new Date(),
        status: false ? AssetStatus.Deleted : AssetStatus.Trashed,
      });
      await this.eventRepository.emit(false ? 'AssetDeleteAll' : 'AssetTrashAll', {
        assetIds: idsToDelete,
        userId: auth.user.id,
      });

      hasNextPage = duplicates.hasNextPage;
      page++;
    }
  }

  async keepAll(auth: AuthDto) {
    let page = 1;
    const size = 100;
    let hasNextPage = true;

    while (hasNextPage) {
      const duplicates = await this.getDuplicates(auth, page, size);

      const idsToDelete = duplicates.items.map(({ duplicateId }) => duplicateId);

      await this.deleteAll(auth, { ids: idsToDelete });

      hasNextPage = duplicates.hasNextPage;
      page++;
    }
  }

  @OnJob({ name: JobName.AssetDetectDuplicatesQueueAll, queue: QueueName.DuplicateDetection })
  async handleQueueSearchDuplicates({ force }: JobOf<JobName.AssetDetectDuplicatesQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    let jobs: JobItem[] = [];
    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    const assets = this.assetJobRepository.streamForSearchDuplicates(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.AssetDetectDuplicates, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDetectDuplicates, queue: QueueName.DuplicateDetection })
  async handleSearchDuplicates({ id }: JobOf<JobName.AssetDetectDuplicates>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForSearchDuplicatesJob(id);
    if (!asset) {
      this.logger.error(`Asset ${id} not found`);
      return JobStatus.Failed;
    }

    if (asset.stackId) {
      this.logger.debug(`Asset ${id} is part of a stack, skipping`);
      return JobStatus.Skipped;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      this.logger.debug(`Asset ${id} is not visible, skipping`);
      return JobStatus.Skipped;
    }

    if (asset.visibility === AssetVisibility.Locked) {
      this.logger.debug(`Asset ${id} is locked, skipping`);
      return JobStatus.Skipped;
    }

    if (!asset.embedding) {
      this.logger.debug(`Asset ${id} is missing embedding`);
      return JobStatus.Failed;
    }

    const duplicateAssets = await this.duplicateRepository.search({
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

    return JobStatus.Success;
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

    await this.duplicateRepository.merge({
      targetId: targetDuplicateId,
      assetIds: assetIdsToUpdate,
      sourceIds: duplicateIds,
    });
    return assetIdsToUpdate;
  }
}
