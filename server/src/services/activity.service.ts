import { Inject, Injectable } from '@nestjs/common';
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
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IActivityRepository } from 'src/interfaces/activity.interface';
import { requireAccess } from 'src/utils/access';

@Injectable()
export class ActivityService {
  constructor(
    @Inject(IAccessRepository) private access: IAccessRepository,
    @Inject(IActivityRepository) private repository: IActivityRepository,
  ) {}

  async getAll(auth: AuthDto, dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    await requireAccess(this.access, { auth, permission: Permission.ALBUM_READ, ids: [dto.albumId] });
    const activities = await this.repository.search({
      userId: dto.userId,
      albumId: dto.albumId,
      assetId: dto.level === ReactionLevel.ALBUM ? null : dto.assetId,
      isLiked: dto.type && dto.type === ReactionType.LIKE,
    });

    return activities.map((activity) => mapActivity(activity));
  }

  async getStatistics(auth: AuthDto, dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    await requireAccess(this.access, { auth, permission: Permission.ALBUM_READ, ids: [dto.albumId] });
    return { comments: await this.repository.getStatistics(dto.assetId, dto.albumId) };
  }

  async create(auth: AuthDto, dto: ActivityCreateDto): Promise<MaybeDuplicate<ActivityResponseDto>> {
    await requireAccess(this.access, { auth, permission: Permission.ACTIVITY_CREATE, ids: [dto.albumId] });

    const common = {
      userId: auth.user.id,
      assetId: dto.assetId,
      albumId: dto.albumId,
    };

    let activity: ActivityEntity | null = null;
    let duplicate = false;

    if (dto.type === ReactionType.LIKE) {
      delete dto.comment;
      [activity] = await this.repository.search({
        ...common,
        // `null` will search for an album like
        assetId: dto.assetId ?? null,
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

  async delete(auth: AuthDto, id: string): Promise<void> {
    await requireAccess(this.access, { auth, permission: Permission.ACTIVITY_DELETE, ids: [id] });
    await this.repository.delete(id);
  }
}
