import { Injectable } from '@nestjs/common';
import { Activity } from 'src/database';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
  mapActivity,
  mapAssetAddition,
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

    const includeReactions = dto.type !== ReactionType.ASSET_ADDED;

    const isAlbumLevel = dto.level === ReactionLevel.ALBUM;
    const assetId = isAlbumLevel ? undefined : dto.assetId;

    // asset_added is opt-in (withAdditions or the type filter) so that old clients never see it
    const includeAssetAdditions =
      dto.type === ReactionType.ASSET_ADDED || (!dto.type && !!dto.withAdditions && !assetId);

    const [reactions, additions] = await Promise.all([
      includeReactions
        ? this.activityRepository.search({
            userId: dto.userId,
            albumId: dto.albumId,
            assetId: isAlbumLevel ? null : dto.assetId,
            isLiked: dto.type && dto.type === ReactionType.LIKE,
          })
        : [],
      includeAssetAdditions
        ? this.activityRepository.searchAssetAdditions({ albumId: dto.albumId, assetId, userId: dto.userId })
        : [],
    ]);

    const results = [
      ...reactions.map((activity) => mapActivity(activity)),
      ...additions.map((row) => mapAssetAddition(row)),
    ];

    results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

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
    let isDuplicate = false;

    if (dto.type === ReactionType.LIKE) {
      delete dto.comment;
      [activity] = await this.activityRepository.search({
        ...common,
        // `null` will search for an album like
        assetId: dto.assetId ?? null,
        isLiked: true,
      });
      isDuplicate = !!activity;
    }

    if (!activity) {
      activity = await this.activityRepository.create({
        ...common,
        isLiked: dto.type === ReactionType.LIKE,
        comment: dto.comment,
      });
    }

    return { duplicate: isDuplicate, value: mapActivity(activity) };
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ActivityDelete, ids: [id] });
    await this.activityRepository.delete(id);
  }
}
