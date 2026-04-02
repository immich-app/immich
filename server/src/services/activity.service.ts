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

@Injectable()
export class ActivityService extends BaseService {
  async getAll(auth: AuthDto, dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });

    const { take, before } = dto;
    const searchOptions = {
      userId: dto.userId,
      albumId: dto.albumId,
      assetId: dto.level === ReactionLevel.ALBUM ? null : dto.assetId,
      isLiked: dto.type && dto.type === ReactionType.LIKE,
    };

    const activities = await this.activityRepository.search({ ...searchOptions, take, before });
    const results = activities.map((activity) => mapActivity(activity));

    // Query always returns DESC; reverse to ASC for the caller
    results.reverse();

    if (take !== undefined && results.length > 0) {
      // Complete the boundary timestamp group: the oldest item's createdAt may be shared
      // by other activities not returned due to the take limit (e.g. bulk operations).
      // Fetch all activities at exactly that timestamp and prepend any not already loaded.
      const boundaryTime = results[0].createdAt;
      const loadedIds = new Set(results.filter((a) => a.createdAt.getTime() === boundaryTime.getTime()).map((a) => a.id));
      const extras = await this.activityRepository.search({ ...searchOptions, at: boundaryTime });
      const newExtras = extras.map((a) => mapActivity(a)).filter((a) => !loadedIds.has(a.id));
      newExtras.reverse();
      return [...newExtras, ...results];
    }

    return results;
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
