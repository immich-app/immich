import { Inject, Injectable, Logger } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IAccessRepository, IActivityRepository } from '../repositories';
import {
  ActivityCommentDto,
  ActivityDto,
  ActivityLikeDto,
  ActivityLikeStatusResponseDto,
  ActivityResponseDto,
  ActivityStatisticsResponseDto,
  mapActivity,
} from './activity.dto';

@Injectable()
export class ActivityService {
  private access: AccessCore;
  private logger = new Logger(ActivityService.name);

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IActivityRepository) private repository: IActivityRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async getAll(authUser: AuthUserDto, dto: ActivityDto): Promise<ActivityResponseDto[]> {
    await this.access.requirePermission(authUser, Permission.ALBUM_READ, dto.albumId);
    if (dto.assetId) {
      await this.access.requirePermission(authUser, Permission.ASSET_READ, dto.assetId);
    }
    const activities = await this.repository.search({ albumId: dto.albumId, assetId: dto.assetId });
    return activities.map(mapActivity);
  }

  async getStatistics(authUser: AuthUserDto, dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    await this.access.requirePermission(authUser, Permission.ALBUM_READ, dto.albumId);
    return { comments: await this.repository.getStatistics(dto.assetId, dto.albumId) };
  }

  async getLikeStatus(authUser: AuthUserDto, dto: ActivityDto): Promise<ActivityLikeStatusResponseDto> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    const [reaction] = await this.repository.search({
      albumId: dto.albumId,
      userId: authUser.id,
      assetId: dto.assetId,
      isLiked: true,
    });
    return { value: !!reaction };
  }

  async updateLikeStatus(authUser: AuthUserDto, dto: ActivityLikeDto): Promise<ActivityResponseDto | void> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);

    const options = {
      userId: authUser.id,
      albumId: dto.albumId,
      assetId: dto.assetId,
      isLiked: true,
    };

    const [reaction] = await this.repository.search(options);
    if (reaction) {
      await this.repository.delete(reaction.id);
      return;
    } else {
      return await this.repository
        .update({
          assetId: dto.assetId,
          userId: authUser.id,
          albumId: dto.albumId,
          isLiked: true,
        })
        .then(mapActivity);
    }
  }

  async addComment(authUser: AuthUserDto, dto: ActivityCommentDto): Promise<ActivityResponseDto> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    return this.repository
      .create({
        assetId: dto.assetId,
        userId: authUser.id,
        albumId: dto.albumId,
        comment: dto.comment,
      })
      .then(mapActivity);
  }

  async deleteComment(authUser: AuthUserDto, id: string): Promise<void> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_DELETE, id);
    await this.repository.delete(id);
  }
}
