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
  AssetMetadataResponseDto,
  AssetMetadataUpsertDto,
  AssetStatsDto,
  UpdateAssetDto,
  mapStats,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetMetadataKey, AssetStatus, AssetVisibility, JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { ISidecarWriteJob, JobItem, JobOf } from 'src/types';
import { requireElevatedPermission } from 'src/utils/access';
import { getAssetFiles, getMyPartnerIds, onAfterUnlink, onBeforeLink, onBeforeUnlink } from 'src/utils/asset.util';

@Injectable()
export class AssetService extends BaseService {
  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
    if (dto.visibility === AssetVisibility.Locked) {
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
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });

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
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });

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

    await this.updateExif({ id, description, dateTimeOriginal, latitude, longitude, rating });

    const asset = await this.assetRepository.update({ id, ...rest });

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
    const {
      ids,
      isFavorite,
      visibility,
      dateTimeOriginal,
      latitude,
      longitude,
      rating,
      description,
      duplicateId,
      dateTimeRelative,
      timeZone,
    } = dto;
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids });

    const assetDto = { isFavorite, visibility, duplicateId };
    const exifDto = { latitude, longitude, rating, description, dateTimeOriginal };

    const isExifChanged = Object.values(exifDto).some((v) => v !== undefined);
    if (isExifChanged) {
      await this.assetRepository.updateAllExif(ids, exifDto);
    }

    const assets =
      (dateTimeRelative !== undefined && dateTimeRelative !== 0) || timeZone !== undefined
        ? await this.assetRepository.updateDateTimeOriginal(ids, dateTimeRelative, timeZone)
        : undefined;

    const dateTimesWithTimezone = assets
      ? assets.map((asset) => {
          const isoString = asset.dateTimeOriginal?.toISOString();
          let dateTime = isoString ? DateTime.fromISO(isoString) : null;

          if (dateTime && asset.timeZone) {
            dateTime = dateTime.setZone(asset.timeZone);
          }

          return {
            assetId: asset.assetId,
            dateTimeOriginal: dateTime?.toISO() ?? null,
          };
        })
      : ids.map((id) => ({ assetId: id, dateTimeOriginal }));

    if (dateTimesWithTimezone.length > 0) {
      await this.jobRepository.queueAll(
        dateTimesWithTimezone.map(({ assetId: id, dateTimeOriginal }) => ({
          name: JobName.SidecarWrite,
          data: {
            ...exifDto,
            id,
            dateTimeOriginal: dateTimeOriginal ?? undefined,
          },
        })),
      );
    }

    const isAssetChanged = Object.values(assetDto).some((v) => v !== undefined);
    if (isAssetChanged) {
      await this.assetRepository.updateAll(ids, assetDto);

      if (visibility === AssetVisibility.Locked) {
        await this.albumRepository.removeAssetsFromAll(ids);
      }
    }
  }

  @OnJob({ name: JobName.AssetDeleteCheck, queue: QueueName.BackgroundTask })
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
            name: JobName.AssetDelete,
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

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDelete, queue: QueueName.BackgroundTask })
  async handleAssetDeletion(job: JobOf<JobName.AssetDelete>): Promise<JobStatus> {
    const { id, deleteOnDisk } = job;

    const asset = await this.assetJobRepository.getForAssetDeletion(id);

    if (!asset) {
      return JobStatus.Failed;
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

    await this.eventRepository.emit('AssetDelete', { assetId: id, userId: asset.ownerId });

    // delete the motion if it is not used by another asset
    if (asset.livePhotoVideoId) {
      const count = await this.assetRepository.getLivePhotoCount(asset.livePhotoVideoId);
      if (count === 0) {
        await this.jobRepository.queue({
          name: JobName.AssetDelete,
          data: { id: asset.livePhotoVideoId, deleteOnDisk },
        });
      }
    }

    const { fullsizeFile, previewFile, thumbnailFile } = getAssetFiles(asset.files ?? []);
    const files = [thumbnailFile?.path, previewFile?.path, fullsizeFile?.path, asset.encodedVideoPath];

    if (deleteOnDisk) {
      files.push(asset.sidecarPath, asset.originalPath);
    }

    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files } });

    return JobStatus.Success;
  }

  async deleteAll(auth: AuthDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.requireAccess({ auth, permission: Permission.AssetDelete, ids });
    await this.assetRepository.updateAll(ids, {
      deletedAt: new Date(),
      status: force ? AssetStatus.Deleted : AssetStatus.Trashed,
    });
    await this.eventRepository.emit(force ? 'AssetDeleteAll' : 'AssetTrashAll', {
      assetIds: ids,
      userId: auth.user.id,
    });
  }

  async getMetadata(auth: AuthDto, id: string): Promise<AssetMetadataResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });
    return this.assetRepository.getMetadata(id);
  }

  async upsertMetadata(auth: AuthDto, id: string, dto: AssetMetadataUpsertDto): Promise<AssetMetadataResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });
    return this.assetRepository.upsertMetadata(id, dto.items);
  }

  async getMetadataByKey(auth: AuthDto, id: string, key: AssetMetadataKey): Promise<AssetMetadataResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });

    const item = await this.assetRepository.getMetadataByKey(id, key);
    if (!item) {
      throw new BadRequestException(`Metadata with key "${key}" not found for asset with id "${id}"`);
    }
    return item;
  }

  async deleteMetadataByKey(auth: AuthDto, id: string, key: AssetMetadataKey): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });
    return this.assetRepository.deleteMetadataByKey(id, key);
  }

  async run(auth: AuthDto, dto: AssetJobsDto) {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds });

    const jobs: JobItem[] = [];

    for (const id of dto.assetIds) {
      switch (dto.name) {
        case AssetJobName.REFRESH_FACES: {
          jobs.push({ name: JobName.AssetDetectFaces, data: { id } });
          break;
        }

        case AssetJobName.REFRESH_METADATA: {
          jobs.push({ name: JobName.AssetExtractMetadata, data: { id } });
          break;
        }

        case AssetJobName.REGENERATE_THUMBNAIL: {
          jobs.push({ name: JobName.AssetGenerateThumbnails, data: { id } });
          break;
        }

        case AssetJobName.TRANSCODE_VIDEO: {
          jobs.push({ name: JobName.AssetEncodeVideo, data: { id } });
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

  private async updateExif(dto: ISidecarWriteJob) {
    const { id, description, dateTimeOriginal, latitude, longitude, rating } = dto;
    const writes = _.omitBy({ description, dateTimeOriginal, latitude, longitude, rating }, _.isUndefined);
    if (Object.keys(writes).length > 0) {
      await this.assetRepository.upsertExif({ assetId: id, ...writes });
      await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id, ...writes } });
    }
  }
}
