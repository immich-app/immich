import { Injectable } from '@nestjs/common';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
  MaybeDuplicate,
  ReactionLevel,
  ReactionType,
  mapActivity,
} from 'src/dtos/activity.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ActivityEntity } from 'src/entities/activity.entity';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class ActivityService extends BaseService {
  async getAll(auth: AuthDto, dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_READ, ids: [dto.albumId] });
    const activities = await this.activityRepository.search({
      userId: dto.userId,
      albumId: dto.albumId,
      assetId: dto.level === ReactionLevel.ALBUM ? null : dto.assetId,
      isLiked: dto.type && dto.type === ReactionType.LIKE,
    });

    return activities.map((activity) => mapActivity(activity));
  }

  async getStatistics(auth: AuthDto, dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_READ, ids: [dto.albumId] });
    return { comments: await this.activityRepository.getStatistics(dto.assetId, dto.albumId) };
  }

  async create(auth: AuthDto, dto: ActivityCreateDto): Promise<MaybeDuplicate<ActivityResponseDto>> {
    await this.requireAccess({ auth, permission: Permission.ACTIVITY_CREATE, ids: [dto.albumId] });

    const common = {
      userId: auth.user.id,
      assetId: dto.assetId,
      albumId: dto.albumId,
    };

    let activity: ActivityEntity | null = null;
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
    await this.requireAccess({ auth, permission: Permission.ACTIVITY_DELETE, ids: [id] });
    await this.activityRepository.delete(id);
  }
}
