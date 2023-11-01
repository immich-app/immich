import { ActivityEntity } from '@app/infra/entities';
import { Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IAccessRepository, IActivityRepository } from '../repositories';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
  MaybeDuplicate,
  ReactionType,
  mapActivity,
} from './activity.dto';

@Injectable()
export class ActivityService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IActivityRepository) private repository: IActivityRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async getAll(authUser: AuthUserDto, dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    await this.access.requirePermission(authUser, Permission.ALBUM_READ, dto.albumId);
    const activities = await this.repository.search({
      albumId: dto.albumId,
      assetId: dto.assetId,
      isLiked: dto.type && dto.type === ReactionType.LIKE,
    });

    return activities.map(mapActivity);
  }

  async getStatistics(authUser: AuthUserDto, dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    await this.access.requirePermission(authUser, Permission.ALBUM_READ, dto.albumId);
    return { comments: await this.repository.getStatistics(dto.assetId, dto.albumId) };
  }

  async create(authUser: AuthUserDto, dto: ActivityCreateDto): Promise<MaybeDuplicate<ActivityResponseDto>> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);

    const common = {
      userId: authUser.id,
      assetId: dto.assetId,
      albumId: dto.albumId,
    };

    let activity: ActivityEntity | null = null;
    let duplicate = false;

    if (dto.type === 'like') {
      delete dto.comment;
      [activity] = await this.repository.search({
        ...common,
        isLiked: true,
      });
      duplicate = !!activity;
    }

    if (!activity) {
      activity = await this.repository.create({
        ...common,
        isLiked: dto.type === ReactionType.LIKE,
        comment: dto.comment,
      });
    }

    return { duplicate, value: mapActivity(activity) };
  }

  async delete(authUser: AuthUserDto, id: string): Promise<void> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_DELETE, id);
    await this.repository.delete(id);
  }
}
