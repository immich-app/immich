import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  DuplicateResolveBatchStatus,
  DuplicateResolveDto,
  DuplicateResolveGroupDto,
  DuplicateResolveResponseDto,
  DuplicateResolveResultDto,
  DuplicateResolveSettingsDto,
  DuplicateResolveStatus,
  DuplicateResponseDto,
} from 'src/dtos/duplicate.dto';
import { AssetStatus, AssetVisibility, JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { AssetDuplicateResult } from 'src/repositories/search.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { suggestDuplicateKeepAssetIds } from 'src/utils/duplicate';
import { computeResolvePolicy } from 'src/utils/duplicate-resolve';
import { isDuplicateDetectionEnabled } from 'src/utils/misc';

// Fields that are stored in the exif table rather than the asset table
const EXIF_FIELDS = ['latitude', 'longitude', 'rating', 'description'] as const;

@Injectable()
export class DuplicateService extends BaseService {
  async getDuplicates(auth: AuthDto): Promise<DuplicateResponseDto[]> {
    // Clean up singleton groups (assets that are the only member of their duplicate group)
    await this.duplicateRepository.cleanupSingletonGroups(auth.user.id);

    const duplicates = await this.duplicateRepository.getAll(auth.user.id);
    return duplicates.map(({ duplicateId, assets }) => {
      const mappedAssets = assets.map((asset) => mapAsset(asset, { auth }));
      return {
        duplicateId,
        assets: mappedAssets,
        suggestedKeepAssetIds: suggestDuplicateKeepAssetIds(mappedAssets),
      };
    });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.duplicateRepository.delete(auth.user.id, id);
  }

  async deleteAll(auth: AuthDto, dto: BulkIdsDto) {
    await this.duplicateRepository.deleteAll(auth.user.id, dto.ids);
  }

  async resolve(auth: AuthDto, dto: DuplicateResolveDto): Promise<DuplicateResolveResponseDto> {
    const results: DuplicateResolveResultDto[] = [];

    for (const group of dto.groups) {
      try {
        const result = await this.resolveGroup(auth, group, dto.settings);
        results.push(result);
      } catch (error) {
        results.push({
          duplicateId: group.duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: `Failed to resolve duplicate group: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return {
      status: DuplicateResolveBatchStatus.Completed,
      results,
    };
  }

  private async resolveGroup(
    auth: AuthDto,
    group: DuplicateResolveGroupDto,
    settings: DuplicateResolveSettingsDto,
  ): Promise<DuplicateResolveResultDto> {
    const { duplicateId, keepAssetIds, trashAssetIds } = group;

    // Step 1: Validate group ownership and membership
    const duplicateGroup = await this.duplicateRepository.getByIdForUser(auth.user.id, duplicateId);
    if (!duplicateGroup) {
      return {
        duplicateId,
        status: DuplicateResolveStatus.Failed,
        reason: `Duplicate group ${duplicateId} not found or access denied`,
      };
    }

    const groupAssetIds = new Set(duplicateGroup.assets.map((a) => a.id));
    const mappedAssets = duplicateGroup.assets.map((asset) => mapAsset(asset, { auth }));

    // Validate all keepAssetIds are in the group
    for (const assetId of keepAssetIds) {
      if (!groupAssetIds.has(assetId)) {
        return {
          duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: `Asset ${assetId} is not a member of duplicate group ${duplicateId}`,
        };
      }
    }

    // Validate all trashAssetIds are in the group
    for (const assetId of trashAssetIds) {
      if (!groupAssetIds.has(assetId)) {
        return {
          duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: `Asset ${assetId} is not a member of duplicate group ${duplicateId}`,
        };
      }
    }

    // Validate keepAssetIds and trashAssetIds are disjoint
    const keepSet = new Set(keepAssetIds);
    for (const assetId of trashAssetIds) {
      if (keepSet.has(assetId)) {
        return {
          duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: 'keepAssetIds and trashAssetIds must be disjoint (no overlap)',
        };
      }
    }

    // Validate keepAssetIds and trashAssetIds cover all assets in the group
    const coveredAssetIds = new Set([...keepAssetIds, ...trashAssetIds]);
    if (coveredAssetIds.size !== groupAssetIds.size) {
      return {
        duplicateId,
        status: DuplicateResolveStatus.Failed,
        reason: 'keepAssetIds and trashAssetIds must cover all assets in the duplicate group',
      };
    }

    // Step 2: Compute idsToKeep (validated above to cover all assets)
    const idsToKeep = keepAssetIds;

    // Step 0 (delayed): Pre-check permissions before any database operations
    // Check asset update permission for keepers
    if (idsToKeep.length > 0) {
      const allowedUpdateIds = await this.checkAccess({
        auth,
        permission: Permission.AssetUpdate,
        ids: idsToKeep,
      });
      if (allowedUpdateIds.size !== idsToKeep.length) {
        return {
          duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: `Not found or no ${Permission.AssetUpdate} access`,
        };
      }
    }

    // Check asset delete permission for trash assets
    if (trashAssetIds.length > 0) {
      const allowedDeleteIds = await this.checkAccess({
        auth,
        permission: Permission.AssetDelete,
        ids: trashAssetIds,
      });
      if (allowedDeleteIds.size !== trashAssetIds.length) {
        return {
          duplicateId,
          status: DuplicateResolveStatus.Failed,
          reason: `Not found or no ${Permission.AssetDelete} access`,
        };
      }
    }

    // Step 3: Fetch album IDs if synchronizeAlbums is enabled
    const assetAlbumMap = settings.synchronizeAlbums
      ? await this.albumRepository.getByAssetIds(auth.user.id, [...groupAssetIds])
      : new Map<string, string[]>();

    // Step 4: Run resolve policy
    const policy = computeResolvePolicy(mappedAssets, idsToKeep, settings, assetAlbumMap);

    // Step 5: Apply updates in order
    if (idsToKeep.length > 0) {
      // 5a. Synchronize albums
      if (settings.synchronizeAlbums && policy.mergedAlbumIds.length > 0) {
        // Pre-check album permissions
        const allowedAlbumIds = await this.checkAccess({
          auth,
          permission: Permission.AlbumAssetCreate,
          ids: policy.mergedAlbumIds,
        });
        const allowedShareIds = await this.checkAccess({
          auth,
          permission: Permission.AssetShare,
          ids: idsToKeep,
        });

        if (allowedAlbumIds.size > 0 && allowedShareIds.size > 0) {
          await this.albumRepository.addAssetIdsToAlbums(
            [...allowedAlbumIds].flatMap((albumId) => [...allowedShareIds].map((assetId) => ({ albumId, assetId }))),
          );
        }
      }

      // 5b. Synchronize tags
      if (settings.synchronizeTags && policy.mergedTagIds.length > 0) {
        const allowedTagIds = await this.checkAccess({
          auth,
          permission: Permission.TagAsset,
          ids: policy.mergedTagIds,
        });

        if (allowedTagIds.size > 0) {
          // Replace tags for each keeper asset to ensure all merged tags are applied
          await Promise.all(
            idsToKeep.map((assetId) => this.tagRepository.replaceAssetTags(assetId, [...allowedTagIds])),
          );
        }
      }

      // 5c. Update keeper assets
      if (policy.assetBulkUpdate.ids.length > 0) {
        const { ids, duplicateId: _updateDuplicateId, ...assetFields } = policy.assetBulkUpdate;
        const exifFields: Record<string, unknown> = {};
        const assetUpdateFields: Record<string, unknown> = {};

        // Separate exif fields from asset fields
        for (const [key, value] of Object.entries(assetFields)) {
          if (EXIF_FIELDS.includes(key as (typeof EXIF_FIELDS)[number])) {
            exifFields[key] = value;
          } else {
            assetUpdateFields[key] = value;
          }
        }

        // Update exif fields if any
        if (Object.keys(exifFields).length > 0) {
          await this.assetRepository.updateAllExif(ids, exifFields);
        }

        // Update asset fields including duplicateId: null
        await this.assetRepository.updateAll(ids, { ...assetUpdateFields, duplicateId: null });
      }
    }

    // 5d/5e. Delete/trash assets
    if (trashAssetIds.length > 0) {
      const { trash } = await this.getConfig({ withCache: true });
      const force = !trash.enabled;

      await this.assetRepository.updateAll(trashAssetIds, {
        deletedAt: new Date(),
        status: force ? AssetStatus.Deleted : AssetStatus.Trashed,
        duplicateId: null,
      });

      await this.eventRepository.emit(force ? 'AssetDeleteAll' : 'AssetTrashAll', {
        assetIds: trashAssetIds,
        userId: auth.user.id,
      });
    }

    return {
      duplicateId,
      status: DuplicateResolveStatus.Success,
    };
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
