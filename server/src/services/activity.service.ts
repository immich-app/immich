import { Injectable } from '@nestjs/common';
import { Activity } from 'src/database';
import { OnEvent } from 'src/decorators';
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
    const activities = await this.activityRepository.search({
      userId: dto.userId,
      albumId: dto.albumId,
      assetId: dto.level === ReactionLevel.ALBUM ? null : dto.assetId,
      isLiked: dto.type && dto.type === ReactionType.LIKE,
    });

    return activities.filter((a) => !a.assetIds || a.assetIds?.length > 0).map((activity) => mapActivity(activity));
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
      assetIds: dto.assetIds,
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

  async upsertAssetIds(auth: AuthDto, dto: ActivityCreateDto): Promise<MaybeDuplicate<ActivityResponseDto>> {
    await this.requireAccess({ auth, permission: Permission.ActivityCreate, ids: [dto.albumId] });

    const recent = await this.activityRepository.findRecentAssetIdsActivity(dto.albumId, auth.user.id, 15);
    this.logger.debug(
      `Recent activity for user ${auth.user.id} in album ${dto.albumId}: ${recent ? recent.id : 'none'}`,
    );

    let activity: Activity;
    let duplicate = false;

    if (recent) {
      // Merge assetIds (remove duplicates)
      const oldIds: string[] = Array.isArray(recent.assetIds) ? recent.assetIds : [];
      const newIds: string[] = Array.isArray(dto.assetIds) ? dto.assetIds : [];
      const merged = Array.from(new Set([...oldIds, ...newIds]));
      await this.activityRepository.updateAssetIds(recent.id, merged);
      // get the updated record (including user info)
      const [updated] = await this.activityRepository.search({
        userId: auth.user.id,
        albumId: dto.albumId,
        assetId: null,
        isLiked: false,
      });
      activity = updated ?? { ...recent, assetIds: merged };
      duplicate = true;

      return { duplicate, value: mapActivity(activity) };
    }

    return await this.create({ user: { id: auth.user.id } } as AuthDto, {
      assetIds: dto.assetIds,
      albumId: dto.albumId,
      type: ReactionType.ASSET,
    });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ActivityDelete, ids: [id] });
    await this.activityRepository.delete(id);
  }

  @OnEvent({ name: 'AlbumAssets' })
  async handleAlbumAssetsEvent(payload: { id: string; assetIds: string[]; userId: string }) {
    this.logger.debug(
      `AlbumAssets event received: albumId=${payload.id}, userId=${payload.userId}, assetIds=${payload.assetIds.join(', ')}`,
    );

    await this.upsertAssetIds({ user: { id: payload.userId } } as AuthDto, {
      assetIds: payload.assetIds,
      albumId: payload.id,
      type: ReactionType.ASSET,
    });
  }
}
