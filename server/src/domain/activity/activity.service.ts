import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IAccessRepository, IActivityRepository, IAlbumRepository } from '../repositories';

import {
  ActivityCommentDto,
  ActivityDto,
  ActivityFavoriteDto,
  ActivityReponseDto,
  LikeStatusReponseDto,
  StatisticsResponseDto,
  mapActivity,
} from './activity.dto';

@Injectable()
export class ActivityService {
  private access: AccessCore;
  readonly logger = new Logger(ActivityService.name);

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IActivityRepository) private repository: IActivityRepository,
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async getAll(authUser: AuthUserDto, dto: ActivityDto): Promise<ActivityReponseDto[]> {
    if (dto.assetId) {
      await this.access.requirePermission(authUser, Permission.ASSET_READ, dto.assetId);
    }
    const activities = await this.repository.search({ albumId: dto.albumId, assetId: dto.assetId });
    const mappedActivities = activities.map(mapActivity);
    return mappedActivities;
  }

  async getStatistics(authUser: AuthUserDto, dto: ActivityDto): Promise<StatisticsResponseDto> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    const album = await this.albumRepository.getById(dto.albumId, { withAssets: false });
    return { comments: await this.repository.getStatistics(dto.assetId, dto.albumId) };
  }

  async getLikeStatus(authUser: AuthUserDto, dto: ActivityDto): Promise<LikeStatusReponseDto> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    const album = await this.albumRepository.getById(dto.albumId, { withAssets: false });
    const favorite = await this.repository.search({ albumId: dto.albumId, userId: authUser.id, assetId: dto.assetId });
    if (favorite) {
      return { value: true };
    } else {
      return { value: false };
    }
  }

  async addComment(authUser: AuthUserDto, dto: ActivityCommentDto): Promise<ActivityReponseDto> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    const comment = dto.comment;
    const activity = await this.repository.create({
      assetId: dto.assetId,
      userId: authUser.id,
      albumId: dto.albumId,
      comment,
    });
    return this.repository.get(activity.id).then(mapActivity);
  }

  async deleteComment(authUser: AuthUserDto, id: string): Promise<void> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_DELETE, id);
    const comment = await this.repository.get(id);

    this.repository.delete(comment);
  }

  async updateLikeStatus(authUser: AuthUserDto, dto: ActivityFavoriteDto): Promise<ActivityReponseDto | void> {
    await this.access.requirePermission(authUser, Permission.ACTIVITY_CREATE, dto.albumId);
    const album = await this.albumRepository.getById(dto.albumId, { withAssets: false });
    const favorite = dto.favorite;
    const [reaction] = await this.repository.search({
      albumId: dto.albumId,
      userId: authUser.id,
      assetId: dto.assetId,
    });
    const isFavorite = reaction ? reaction.isLiked : false;

    if (favorite === isFavorite) {
      if (reaction) {
        return mapActivity(reaction);
      } else {
        return;
      }
    } else if (reaction) {
      this.repository.delete(reaction);
      return;
    } else {
      const test = await this.repository.update({
        assetId: dto.assetId,
        userId: authUser.id,
        albumId: dto.albumId,
        isLiked: true,
      });

      return mapActivity(test);
    }
  }
}
