import { BadRequestException, Injectable } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetResponseDto, MapAsset, SanitizedAssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetJobName,
  AssetJobsDto,
  AssetStatsDto,
  UpdateAssetDto,
  mapStats,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetStatus, AssetVisibility, JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { ISidecarWriteJob, JobItem, JobOf } from 'src/types';
import { requireElevatedPermission } from 'src/utils/access';
import { getAssetFiles, getMyPartnerIds, onAfterUnlink, onBeforeLink, onBeforeUnlink } from 'src/utils/asset.util';

@Injectable()
export class AssetService extends BaseService {
  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
    if (dto.visibility === AssetVisibility.LOCKED) {
      requireElevatedPermission(auth);
    }

    const stats = await this.assetRepository.getStatistics(auth.user.id, dto);
    return mapStats(stats);
  }

  async getRandom(auth: AuthDto, count: number): Promise<AssetResponseDto[]> {
    const partnerIds = await getMyPartnerIds({
      userId: auth.user.id,
      repository: this.partnerRepository,
      timelineEnabled: true,
    });
    const assets = await this.assetRepository.getRandom([auth.user.id, ...partnerIds], count);
    return assets.map((a) => mapAsset(a, { auth }));
  }

  async getUserAssetsByDeviceId(auth: AuthDto, deviceId: string) {
    return this.assetRepository.getAllByDeviceId(auth.user.id, deviceId);
  }

  async get(auth: AuthDto, id: string): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [id] });

    const asset = await this.assetRepository.getById(id, {
      exifInfo: true,
      owner: true,
      faces: { person: true },
      stack: { assets: true },
      tags: true,
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (auth.sharedLink && !auth.sharedLink.showExif) {
      return mapAsset(asset, { stripMetadata: true, withStack: true, auth });
    }

    const data = mapAsset(asset, { withStack: true, auth });

    if (auth.sharedLink) {
      delete data.owner;
    }

    if (data.ownerId !== auth.user.id || auth.sharedLink) {
      data.people = [];
    }

    return data;
  }

  async update(auth: AuthDto, id: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids: [id] });

    const { description, dateTimeOriginal, latitude, longitude, rating, ...rest } = dto;
    const repos = { asset: this.assetRepository, event: this.eventRepository };

    let previousMotion: MapAsset | null = null;
    if (rest.livePhotoVideoId) {
      await onBeforeLink(repos, { userId: auth.user.id, livePhotoVideoId: rest.livePhotoVideoId });
    } else if (rest.livePhotoVideoId === null) {
      const asset = await this.findOrFail(id);
      if (asset.livePhotoVideoId) {
        previousMotion = await onBeforeUnlink(repos, { livePhotoVideoId: asset.livePhotoVideoId });
      }
    }

    const metadataUpdated = await this.updateMetadata({
      id,
      description,
      dateTimeOriginal,
      latitude,
      longitude,
      rating,
    });

    const updatedAsset = await this.assetRepository.update({ id, ...rest });

    // If update returned undefined (no changes), fetch the asset
    // Match the relations that update() returns when it does update
    const asset = updatedAsset ?? (await this.assetRepository.getById(id, { exifInfo: true, faces: { person: true } }));

    if (!metadataUpdated && updatedAsset) {
      // updateMetadata will send an event, but assetRepository.update() won't.
      // to prevent doubles, only send an event if asset was updated
      await this.eventRepository.emit('asset.update', { assetIds: [id], userId: auth.user.id });
    }

    if (previousMotion && asset) {
      await onAfterUnlink(repos, {
        userId: auth.user.id,
        livePhotoVideoId: previousMotion.id,
        visibility: asset.visibility,
      });
    }

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    return mapAsset(asset, { auth });
  }

  async updateAll(auth: AuthDto, dto: AssetBulkUpdateDto): Promise<void> {
    const { ids, description, dateTimeOriginal, latitude, longitude, rating, ...rest } = dto;
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids });

    const metadataUpdated = await this.updateAllMetadata(ids, {
      description,
      dateTimeOriginal,
      latitude,
      longitude,
      rating,
    });

    if (rest.visibility !== undefined || rest.isFavorite !== undefined || rest.duplicateId !== undefined) {
      await this.assetRepository.updateAll(ids, rest);

      if (rest.visibility === AssetVisibility.LOCKED) {
        await this.albumRepository.removeAssetsFromAll(ids);
      }
      if (!metadataUpdated) {
        // If no metadata was updated, we still need to emit an event for the bulk update
        await this.eventRepository.emit('asset.update', { assetIds: ids, userId: auth.user.id });
      }
    }
  }

  @OnJob({ name: JobName.ASSET_DELETION_CHECK, queue: QueueName.BACKGROUND_TASK })
  async handleAssetDeletionCheck(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const trashedDays = config.trash.enabled ? config.trash.days : 0;
    const trashedBefore = DateTime.now()
      .minus(Duration.fromObject({ days: trashedDays }))
      .toJSDate();

    let chunk: Array<{ id: string; isOffline: boolean }> = [];
    const queueChunk = async () => {
      if (chunk.length > 0) {
        await this.jobRepository.queueAll(
          chunk.map(({ id, isOffline }) => ({
            name: JobName.ASSET_DELETION,
            data: { id, deleteOnDisk: !isOffline },
          })),
        );
        chunk = [];
      }
    };

    const assets = this.assetJobRepository.streamForDeletedJob(trashedBefore);
    for await (const asset of assets) {
      chunk.push(asset);
      if (chunk.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.ASSET_DELETION, queue: QueueName.BACKGROUND_TASK })
  async handleAssetDeletion(job: JobOf<JobName.ASSET_DELETION>): Promise<JobStatus> {
    const { id, deleteOnDisk } = job;

    const asset = await this.assetJobRepository.getForAssetDeletion(id);

    if (!asset) {
      return JobStatus.FAILED;
    }

    // Replace the parent of the stack children with a new asset
    if (asset.stack?.primaryAssetId === id) {
      const stackAssetIds = asset.stack?.assets.map((a) => a.id) ?? [];
      if (stackAssetIds.length > 2) {
        const newPrimaryAssetId = stackAssetIds.find((a) => a !== id)!;
        await this.stackRepository.update(asset.stack.id, {
          id: asset.stack.id,
          primaryAssetId: newPrimaryAssetId,
        });
      } else {
        await this.stackRepository.delete(asset.stack.id);
      }
    }

    await this.assetRepository.remove(asset);
    if (!asset.libraryId) {
      await this.userRepository.updateUsage(asset.ownerId, -(asset.exifInfo?.fileSizeInByte || 0));
    }

    await this.eventRepository.emit('asset.delete', { assetId: id, userId: asset.ownerId });

    // delete the motion if it is not used by another asset
    if (asset.livePhotoVideoId) {
      const count = await this.assetRepository.getLivePhotoCount(asset.livePhotoVideoId);
      if (count === 0) {
        await this.jobRepository.queue({
          name: JobName.ASSET_DELETION,
          data: { id: asset.livePhotoVideoId, deleteOnDisk },
        });
      }
    }

    const { fullsizeFile, previewFile, thumbnailFile } = getAssetFiles(asset.files ?? []);
    const files = [thumbnailFile?.path, previewFile?.path, fullsizeFile?.path, asset.encodedVideoPath];

    if (deleteOnDisk) {
      files.push(asset.sidecarPath, asset.originalPath);
    }

    await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files } });

    return JobStatus.SUCCESS;
  }

  async deleteAll(auth: AuthDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.requireAccess({ auth, permission: Permission.ASSET_DELETE, ids });
    await this.assetRepository.updateAll(ids, {
      deletedAt: new Date(),
      status: force ? AssetStatus.DELETED : AssetStatus.TRASHED,
    });
    await this.eventRepository.emit(force ? 'assets.delete' : 'assets.trash', { assetIds: ids, userId: auth.user.id });
  }

  async run(auth: AuthDto, dto: AssetJobsDto) {
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids: dto.assetIds });

    const jobs: JobItem[] = [];

    for (const id of dto.assetIds) {
      switch (dto.name) {
        case AssetJobName.REFRESH_FACES: {
          jobs.push({ name: JobName.FACE_DETECTION, data: { id } });
          break;
        }

        case AssetJobName.REFRESH_METADATA: {
          jobs.push({ name: JobName.METADATA_EXTRACTION, data: { id } });
          break;
        }

        case AssetJobName.REGENERATE_THUMBNAIL: {
          jobs.push({ name: JobName.GENERATE_THUMBNAILS, data: { id } });
          break;
        }

        case AssetJobName.TRANSCODE_VIDEO: {
          jobs.push({ name: JobName.VIDEO_CONVERSION, data: { id } });
          break;
        }
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  private async findOrFail(id: string) {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }
    return asset;
  }

  private async updateMetadata(dto: ISidecarWriteJob) {
    const { id, description, dateTimeOriginal, latitude, longitude, rating } = dto;
    const writes = _.omitBy({ description, dateTimeOriginal, latitude, longitude, rating }, _.isUndefined);
    if (Object.keys(writes).length > 0) {
      await this.assetRepository.upsertExif({ assetId: id, ...writes });
      await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id, ...writes } });
      return true;
    }
    return false;
  }

  private async updateAllMetadata(
    ids: string[],
    dto: Pick<AssetBulkUpdateDto, 'description' | 'dateTimeOriginal' | 'latitude' | 'longitude' | 'rating'>,
  ) {
    const { description, dateTimeOriginal, latitude, longitude, rating } = dto;
    const writes = _.omitBy({ description, dateTimeOriginal, latitude, longitude, rating }, _.isUndefined);
    if (Object.keys(writes).length > 0) {
      await this.assetRepository.updateAllExif(ids, writes);
      const jobs: JobItem[] = ids.map((id) => ({
        name: JobName.SIDECAR_WRITE,
        data: { id, ...writes },
      }));
      await this.jobRepository.queueAll(jobs);
      return true;
    }
    return false;
  }
}
