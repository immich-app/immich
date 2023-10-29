import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IAccessRepository, IActivityRepository, IAlbumRepository } from '../repositories';

import {
  ActivityCommentDto,
  ActivityFavoriteDto,
  ActivityReponseDto,
  StatisticsResponseDto,
  mapActivities,
  mapActivity,
  mapFavorite,
  mapStatistics,
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

  async getById(authUser: AuthUserDto, id: string, albumId: string): Promise<ActivityReponseDto[]> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, id);
    const album = await this.albumRepository.getById(albumId, { withAssets: false });
    if (!album?.sharedUsers.length) {
      throw new BadRequestException('Album is not shared');
    }
    return this.findOrFail(id, albumId).then(mapActivities);
  }

  async getStatistics(authUser: AuthUserDto, id: string, albumId: string): Promise<StatisticsResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, id);
    const album = await this.albumRepository.getById(albumId, { withAssets: false });
    if (!album?.sharedUsers.length) {
      throw new BadRequestException('Album is not shared');
    }
    return mapStatistics(await this.repository.getStatistics(id, albumId));
  }

  async getFavorite(authUser: AuthUserDto, id: string, albumId: string): Promise<ActivityReponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, id);
    const album = await this.albumRepository.getById(albumId, { withAssets: false });
    if (!album?.sharedUsers.length) {
      throw new BadRequestException('Album is not shared');
    }
    const favorite = await this.repository.getFavorite(id, albumId, authUser.id);
    return mapFavorite(favorite);
  }

  async addComment(
    authUser: AuthUserDto,
    id: string,
    dto: ActivityCommentDto,
    albumId: string,
  ): Promise<ActivityReponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, id);
    const album = await this.albumRepository.getById(albumId, { withAssets: false });
    if (!album?.sharedUsers.length) {
      throw new BadRequestException('Album is not shared');
    }
    const comment = dto.comment;
    const activity = await this.repository.update({ assetId: id, userId: authUser.id, albumId, comment });
    return this.findSingleOrFail(activity.id).then(mapActivity);
  }

  async deleteComment(authUser: AuthUserDto, id: string): Promise<void> {
    const comment = await this.findSingleOrFail(id);
    if (
      !(await this.access.hasPermission(authUser, Permission.ALBUM_DELETE, comment.albumId)) &&
      !(await authUser.isAdmin) &&
      !(comment.userId === authUser.id)
    ) {
      throw new BadRequestException(`User ${authUser.id} has not the permission to delete comment ${comment.albumId}`);
    }

    this.repository.delete(comment);
  }

  async changeFavorite(
    authUser: AuthUserDto,
    id: string,
    dto: ActivityFavoriteDto,
    albumId: string,
  ): Promise<ActivityReponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, id);
    const album = await this.albumRepository.getById(albumId, { withAssets: false });
    if (!album?.sharedUsers.length) {
      throw new BadRequestException('Album is not shared');
    }
    const favorite = dto.favorite;
    const reaction = await this.repository.getFavorite(id, albumId, authUser.id);
    const isFavorite = reaction ? reaction.isFavorite : false;

    if (favorite === isFavorite) {
      return mapFavorite(reaction);
    } else if (reaction) {
      this.repository.delete(reaction);
      return mapFavorite(null);
    } else {
      const test = await this.repository.update({ assetId: id, userId: authUser.id, albumId, isFavorite: true });

      return mapFavorite(test);
    }
  }

  private async findSingleOrFail(id: string) {
    const activity = await this.repository.getReactionById(id);
    if (!activity) {
      throw new BadRequestException('Activity not found');
    }
    return activity;
  }

  private async findOrFail(assetId: string, albumId: string) {
    const activity = await this.repository.getById(assetId, albumId);
    if (!activity) {
      throw new BadRequestException('Activity not found');
    }
    return activity;
  }
}
