import { BadRequestException, Injectable } from '@nestjs/common';
import { round } from 'lodash';
import { Stack } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  TimeBucketAssetDto,
  TimeBucketDto,
  TimeBucketResponseDto,
  TimeBucketsResponseDto,
} from 'src/dtos/time-bucket.dto';
import { AssetType, Permission } from 'src/enum';
import { TimeBucketOptions } from 'src/repositories/asset.repository';
import { BaseService } from 'src/services/base.service';
import { TimeBucketAssets } from 'src/services/timeline.service.types';
import { getMyPartnerIds, isFlipped } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';

@Injectable()
export class TimelineService extends BaseService {
  async getTimeBuckets(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketsResponseDto[]> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, dto);
    return this.assetRepository.getTimeBuckets(timeBucketOptions);
  }

  async getTimeBucket(auth: AuthDto, dto: TimeBucketAssetDto): Promise<TimeBucketResponseDto> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, { ...dto });

    const page = dto.page || 1;
    const size = dto.pageSize || -1;
    if (dto.pageSize === 0) {
      throw new BadRequestException('pageSize must not be 0');
    }
    const paginate = page >= 1 && size >= 1;
    const items = await this.assetRepository.getTimeBucket(dto.timeBucket, timeBucketOptions, {
      skip: page,
      take: size,
    });

    const hasNextPage = paginate && items.length > size;
    if (paginate) {
      items.splice(size);
    }

    const bucketAssets: TimeBucketAssets = {
      id: [],
      ownerId: [],
      ratio: [],
      isFavorite: [],
      isArchived: [],
      isTrashed: [],
      isVideo: [],
      isImage: [],
      thumbhash: [],
      localDateTime: [],
      stack: [],
      duration: [],
      projectionType: [],
      livePhotoVideoId: [],
      description: [],
    };
    for (const item of items) {
      let width = item.width!;
      let height = item.height!;
      if (isFlipped(item.orientation)) {
        const w = item.width!;
        const h = item.height!;
        height = w;
        width = h;
      }
      bucketAssets.id.push(item.id);
      bucketAssets.ownerId.push(item.ownerId);
      bucketAssets.ratio.push(round(width / height, 2));
      bucketAssets.isArchived.push(item.isArchived ? 1 : 0);
      bucketAssets.isFavorite.push(item.isFavorite ? 1 : 0);
      bucketAssets.isTrashed.push(item.deletedAt === null ? 0 : 1);
      bucketAssets.thumbhash.push(item.thumbhash ? hexOrBufferToBase64(item.thumbhash) : 0);
      bucketAssets.localDateTime.push(item.localDateTime);
      bucketAssets.stack.push(this.mapStack(item.stack) || 0);
      bucketAssets.duration.push(item.duration || 0);
      bucketAssets.projectionType.push(item.projectionType || 0);
      bucketAssets.livePhotoVideoId.push(item.livePhotoVideoId || 0);
      bucketAssets.isImage.push(item.type === AssetType.IMAGE ? 1 : 0);
      bucketAssets.isVideo.push(item.type === AssetType.VIDEO ? 1 : 0);
      bucketAssets.description.push({
        city: item.city,
        country: item.country,
      });
    }

    return {
      bucketAssets,
      hasNextPage,
    };
  }

  mapStack(entity?: Stack | null) {
    if (!entity) {
      return;
    }

    return {
      id: entity.id!,
      primaryAssetId: entity.primaryAssetId!,
      assetCount: entity.assetCount as number,
    };
  }

  private async buildTimeBucketOptions(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketOptions> {
    const { userId, ...options } = dto;
    let userIds: string[] | undefined = undefined;

    if (userId) {
      userIds = [userId];
      if (dto.withPartners) {
        const partnerIds = await getMyPartnerIds({
          userId: auth.user.id,
          repository: this.partnerRepository,
          timelineEnabled: true,
        });
        userIds.push(...partnerIds);
      }
    }

    return { ...options, userIds };
  }

  private async timeBucketChecks(auth: AuthDto, dto: TimeBucketDto) {
    if (dto.albumId) {
      await this.requireAccess({ auth, permission: Permission.ALBUM_READ, ids: [dto.albumId] });
    } else {
      dto.userId = dto.userId || auth.user.id;
    }

    if (dto.userId) {
      await this.requireAccess({ auth, permission: Permission.TIMELINE_READ, ids: [dto.userId] });
      if (dto.isArchived !== false) {
        await this.requireAccess({ auth, permission: Permission.ARCHIVE_READ, ids: [dto.userId] });
      }
    }

    if (dto.tagId) {
      await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [dto.tagId] });
    }

    if (dto.withPartners) {
      const requestedArchived = dto.isArchived === true || dto.isArchived === undefined;
      const requestedFavorite = dto.isFavorite === true || dto.isFavorite === false;
      const requestedTrash = dto.isTrashed === true;

      if (requestedArchived || requestedFavorite || requestedTrash) {
        throw new BadRequestException(
          'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
        );
      }
    }
  }
}
