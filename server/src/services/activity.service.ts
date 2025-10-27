import { Injectable } from '@nestjs/common';
import { Activity } from 'src/database';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
  mapActivity,
  MaybeDuplicate,
  ReactionLevel,
  ReactionType,
} from 'src/dtos/activity.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

const ALBUM_UPDATE_ASSET_LIMIT = 3;

@Injectable()
export class ActivityService extends BaseService {
  async getAll(auth: AuthDto, dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
    const assetIdFilter = dto.level === ReactionLevel.ALBUM ? null : dto.assetId;

    const includeAlbumUpdates = dto.includeAlbumUpdate === true && dto.level !== ReactionLevel.ASSET;
    // (dto.type === ReactionType.ALBUM_UPDATE || (!dto.type && dto.level === ReactionLevel.ALBUM));

    const includeRegularActivities = dto.type !== ReactionType.ALBUM_UPDATE;

    const isLiked = dto.type === ReactionType.LIKE ? true : dto.type === ReactionType.COMMENT ? false : undefined;

    const activities = await this.activityRepository.search({
      userId: dto.userId,
      albumId: dto.albumId,
      assetId: assetIdFilter,
      isLiked,
      includeAlbumUpdates,
      albumUpdateAssetLimit: ALBUM_UPDATE_ASSET_LIMIT,
    });

    const mapped = activities.map((activity) => mapActivity(activity));

    if (dto.type === ReactionType.ALBUM_UPDATE) {
      return mapped.filter((activity) => activity.type === ReactionType.ALBUM_UPDATE);
    }

    return mapped;
  }

  async getStatistics(auth: AuthDto, dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
    return await this.activityRepository.getStatistics({ albumId: dto.albumId, assetId: dto.assetId });
  }

  async create(auth: AuthDto, dto: ActivityCreateDto): Promise<MaybeDuplicate<ActivityResponseDto>> {
    await this.requireAccess({ auth, permission: Permission.ActivityCreate, ids: [dto.albumId] });

    const common = {
      userId: auth.user.id,
      assetId: dto.assetId,
      albumId: dto.albumId,
    };

    let activity: Activity | undefined;
    let duplicate = false;

    if (dto.type === ReactionType.LIKE) {
      delete dto.comment;
      [activity] = await this.activityRepository.search({
        ...common,
        // `null` will search for an album like
        assetId: dto.assetId ?? null,
        isLiked: true,
      });
      duplicate = !!activity;
    }

    if (!activity) {
      activity = await this.activityRepository.create({
        ...common,
        isLiked: dto.type === ReactionType.LIKE,
        comment: dto.comment,
      });
    }

    return { duplicate, value: mapActivity(activity) };
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ActivityDelete, ids: [id] });
    await this.activityRepository.delete(id);
  }
}
