import { BadRequestException } from '@nestjs/common';
import { AssetResponseDto, SanitizedAssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TimeBucketAssetDto, TimeBucketDto, TimeBucketResponseDto } from 'src/dtos/time-bucket.dto';
import { Permission } from 'src/enum';
import { TimeBucketOptions } from 'src/interfaces/asset.interface';
import { BaseService } from 'src/services/base.service';
import { getMyPartnerIds } from 'src/utils/asset.util';

export class TimelineService extends BaseService {
  async getTimeBuckets(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, dto);
    return this.assetRepository.getTimeBuckets(timeBucketOptions);
  }

  async getTimeBucket(
    auth: AuthDto,
    dto: TimeBucketAssetDto,
  ): Promise<AssetResponseDto[] | SanitizedAssetResponseDto[]> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, dto);
    const assets = await this.assetRepository.getTimeBucket(dto.timeBucket, timeBucketOptions);
    return !auth.sharedLink || auth.sharedLink?.showExif
      ? assets.map((asset) => mapAsset(asset, { withStack: true, auth }))
      : assets.map((asset) => mapAsset(asset, { stripMetadata: true, auth }));
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
