import { BadRequestException } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import {
  AssetResponseDto,
  MemoryLaneResponseDto,
  SanitizedAssetResponseDto,
  mapAsset,
} from 'src/dtos/asset-response.dto';
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
import { MemoryLaneDto } from 'src/dtos/search.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetStatus, Permission } from 'src/enum';
import {
  IAssetDeleteJob,
  ISidecarWriteJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobItem,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { getAssetFiles, getMyPartnerIds, onAfterUnlink, onBeforeLink, onBeforeUnlink } from 'src/utils/asset.util';
import { usePagination } from 'src/utils/pagination';

export class AssetService extends BaseService {
  async getMemoryLane(auth: AuthDto, dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    const partnerIds = await getMyPartnerIds({
      userId: auth.user.id,
      repository: this.partnerRepository,
      timelineEnabled: true,
    });
    const userIds = [auth.user.id, ...partnerIds];

    const assets = await this.assetRepository.getByDayOfYear(userIds, dto);
    const assetsWithThumbnails = assets.filter(({ files }) => !!getAssetFiles(files).thumbnailFile);
    const groups: Record<number, AssetEntity[]> = {};
    const currentYear = new Date().getFullYear();
    for (const asset of assetsWithThumbnails) {
      const yearsAgo = currentYear - asset.localDateTime.getFullYear();
      if (!groups[yearsAgo]) {
        groups[yearsAgo] = [];
      }
      groups[yearsAgo].push(asset);
    }

    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((yearsAgo) => yearsAgo > 0)
      .map((yearsAgo) => ({
        yearsAgo,
        // TODO move this to clients
        title: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago`,
        assets: groups[yearsAgo].map((asset) => mapAsset(asset, { auth })),
      }));
  }

  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
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

    const asset = await this.assetRepository.getById(
      id,
      {
        exifInfo: true,
        sharedLinks: true,
        smartInfo: true,
        tags: true,
        owner: true,
        faces: {
          person: true,
        },
        stack: {
          assets: {
            exifInfo: true,
          },
        },
        files: true,
      },
      {
        faces: {
          boundingBoxX1: 'ASC',
        },
      },
    );

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

    let previousMotion: AssetEntity | null = null;
    if (rest.livePhotoVideoId) {
      await onBeforeLink(repos, { userId: auth.user.id, livePhotoVideoId: rest.livePhotoVideoId });
    } else if (rest.livePhotoVideoId === null) {
      const asset = await this.findOrFail(id);
      if (asset.livePhotoVideoId) {
        previousMotion = await onBeforeUnlink(repos, { livePhotoVideoId: asset.livePhotoVideoId });
      }
    }

    await this.updateMetadata({ id, description, dateTimeOriginal, latitude, longitude, rating });

    await this.assetRepository.update({ id, ...rest });

    if (previousMotion) {
      await onAfterUnlink(repos, { userId: auth.user.id, livePhotoVideoId: previousMotion.id });
    }

    const asset = await this.assetRepository.getById(id, {
      exifInfo: true,
      owner: true,
      smartInfo: true,
      tags: true,
      faces: {
        person: true,
      },
      files: true,
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    return mapAsset(asset, { auth });
  }

  async updateAll(auth: AuthDto, dto: AssetBulkUpdateDto): Promise<void> {
    const { ids, dateTimeOriginal, latitude, longitude, ...options } = dto;
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids });

    for (const id of ids) {
      await this.updateMetadata({ id, dateTimeOriginal, latitude, longitude });
    }

    await this.assetRepository.updateAll(ids, options);
  }

  async handleAssetDeletionCheck(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const trashedDays = config.trash.enabled ? config.trash.days : 0;
    const trashedBefore = DateTime.now()
      .minus(Duration.fromObject({ days: trashedDays }))
      .toJSDate();
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { trashedBefore }),
    );

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: JobName.ASSET_DELETION,
          data: {
            id: asset.id,
            deleteOnDisk: true,
          },
        })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleAssetDeletion(job: IAssetDeleteJob): Promise<JobStatus> {
    const { id, deleteOnDisk } = job;

    const asset = await this.assetRepository.getById(id, {
      faces: {
        person: true,
      },
      library: true,
      stack: { assets: true },
      exifInfo: true,
      files: true,
    });

    if (!asset) {
      return JobStatus.FAILED;
    }

    // Replace the parent of the stack children with a new asset
    if (asset.stack?.primaryAssetId === id) {
      const stackAssetIds = asset.stack.assets.map((a) => a.id);
      if (stackAssetIds.length > 2) {
        const newPrimaryAssetId = stackAssetIds.find((a) => a !== id)!;
        await this.stackRepository.update({
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

    const { thumbnailFile, previewFile } = getAssetFiles(asset.files);
    const files = [thumbnailFile?.path, previewFile?.path, asset.encodedVideoPath];
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
    }
  }
}
