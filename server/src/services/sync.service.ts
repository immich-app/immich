import { ForbiddenException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Writable } from 'node:stream';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { AlbumAssetResponseDto } from 'src/dtos/album-asset.dto';
import { AlbumResponseDto, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetDeltaSyncDto,
  AssetDeltaSyncResponseDto,
  AssetFullSyncDto,
  SyncAcknowledgeDto,
  SyncStreamDto,
} from 'src/dtos/sync.dto';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SyncCheckpoint } from 'src/entities/session-sync-state.entity';
import { DatabaseAction, EntityType, Permission, SyncAction, SyncEntity as SyncEntityType } from 'src/enum';
import { AlbumAssetEntity, DeletedEntity, SyncOptions } from 'src/interfaces/sync.interface';
import { BaseService } from 'src/services/base.service';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { Paginated, usePagination } from 'src/utils/pagination';
import { setIsEqual } from 'src/utils/set';

const FULL_SYNC = { needsFullSync: true, deleted: [], upserted: [] };
const SYNC_PAGE_SIZE = 5000;

const asJsonLine = (item: unknown) => JSON.stringify(item) + '\n';

type Loader<T> = (options: SyncOptions) => Paginated<T>;
type Mapper<T, R> = (item: T) => R;
type StreamerArgs<T, R> = {
  type: SyncEntityType;
  action: SyncAction;
  lastAck?: string;
  load: Loader<T>;
  map?: Mapper<T, R>;
  ack: Mapper<T, SyncCheckpoint>;
};

class Streamer<T = any, R = any> {
  constructor(private args: StreamerArgs<T, R>) {}

  getEntityType() {
    return this.args.type;
  }

  async write({ stream, userId, checkpoint }: { stream: Writable; userId: string; checkpoint?: SyncCheckpoint }) {
    const { type, action, load, map, ack } = this.args;
    const pagination = usePagination(SYNC_PAGE_SIZE, (options) => load({ ...options, userId, checkpoint }));
    for await (const items of pagination) {
      for (const item of items) {
        stream.write(asJsonLine({ type, action, data: map?.(item) || (item as unknown as R), ack: ack(item) }));
      }
    }
  }
}

export class SyncService extends BaseService {
  async acknowledge(auth: AuthDto, dto: SyncAcknowledgeDto) {
    const { id: sessionId } = this.assertSession(auth);
    await this.syncRepository.upsert({
      ...dto,
      sessionId,
    });
  }

  async stream(auth: AuthDto, stream: Writable, dto: SyncStreamDto) {
    const { id: sessionId, userId } = this.assertSession(auth);
    const syncState = await this.syncRepository.get(sessionId);
    const state = syncState?.state;
    const checkpoints: Record<SyncEntityType, SyncCheckpoint | undefined> = {
      [SyncEntityType.ACTIVITY]: state?.activity,
      [SyncEntityType.ASSET]: state?.asset,
      [SyncEntityType.ASSET_ALBUM]: state?.assetAlbum,
      [SyncEntityType.ASSET_PARTNER]: state?.assetPartner,
      [SyncEntityType.ALBUM]: state?.album,
      [SyncEntityType.ALBUM_ASSET]: state?.albumAsset,
      [SyncEntityType.ALBUM_USER]: state?.albumUser,
      [SyncEntityType.MEMORY]: state?.memory,
      [SyncEntityType.PARTNER]: state?.partner,
      [SyncEntityType.PERSON]: state?.partner,
      [SyncEntityType.SHARED_LINK]: state?.sharedLink,
      [SyncEntityType.STACK]: state?.stack,
      [SyncEntityType.TAG]: state?.tag,
      [SyncEntityType.USER]: state?.user,
    };
    const streamers: Streamer[] = [];

    for (const type of dto.types) {
      switch (type) {
        case SyncEntityType.ASSET: {
          streamers.push(
            new Streamer<AssetEntity, AssetResponseDto>({
              type: SyncEntityType.ASSET,
              action: SyncAction.UPSERT,
              load: (options) => this.syncRepository.getAssets(options),
              map: (item) => mapAsset(item, { auth, stripMetadata: false }),
              ack: (item) => ({ id: item.id, timestamp: item.updatedAt.toISOString() }),
            }),
            new Streamer<DeletedEntity, DeletedEntity>({
              type: SyncEntityType.ASSET,
              action: SyncAction.DELETE,
              load: (options) => this.syncRepository.getDeletedAssets(options),
              map: (entity) => entity,
              ack: (item) => ({ id: item.id, timestamp: item.deletedAt.toISOString() }),
            }),
          );
          break;
        }

        case SyncEntityType.ASSET_PARTNER: {
          const partnerIds = await getMyPartnerIds({ userId, repository: this.partnerRepository });
          streamers.push(
            new Streamer<AssetEntity, AssetResponseDto>({
              type: SyncEntityType.ASSET_PARTNER,
              action: SyncAction.UPSERT,
              load: (options) => this.syncRepository.getAssetsPartner({ ...options, partnerIds }),
              map: (item) => mapAsset(item, { auth, stripMetadata: false }),
              ack: (item) => ({ id: item.id, timestamp: item.updatedAt.toISOString() }),
            }),
            new Streamer<DeletedEntity, DeletedEntity>({
              type: SyncEntityType.ASSET_PARTNER,
              action: SyncAction.DELETE,
              load: (options) => this.syncRepository.getDeletedAssetsPartner({ ...options, partnerIds }),
              ack: (item) => ({ id: item.id, timestamp: item.deletedAt.toISOString() }),
            }),
          );
          break;
        }

        case SyncEntityType.ALBUM: {
          streamers.push(
            new Streamer<AlbumEntity, AlbumResponseDto>({
              type: SyncEntityType.ALBUM,
              action: SyncAction.UPSERT,
              load: (options) => this.syncRepository.getAlbums(options),
              map: (item) => mapAlbumWithoutAssets(item),
              ack: (item) => ({ id: item.id, timestamp: item.updatedAt.toISOString() }),
            }),
            new Streamer<DeletedEntity, DeletedEntity>({
              type: SyncEntityType.ALBUM,
              action: SyncAction.DELETE,
              load: (options) => this.syncRepository.getDeletedAlbums(options),
              ack: (item) => ({ id: item.id, timestamp: item.deletedAt.toISOString() }),
            }),
          );
        }

        case SyncEntityType.ALBUM_ASSET: {
          streamers.push(
            new Streamer<AlbumAssetEntity, AlbumAssetResponseDto>({
              type: SyncEntityType.ALBUM_ASSET,
              action: SyncAction.UPSERT,
              load: (options) => this.syncRepository.getAlbumAssets(options),
              ack: (item) => ({ id: item.assetId, timestamp: item.createdAt.toISOString() }),
            }),
            new Streamer<DeletedEntity, DeletedEntity>({
              type: SyncEntityType.ALBUM_ASSET,
              action: SyncAction.DELETE,
              load: (options) => this.syncRepository.getDeletedAlbums(options),
              ack: (item) => ({ id: item.id, timestamp: item.deletedAt.toISOString() }),
            }),
          );
        }

        default: {
          this.logger.warn(`Unsupported sync type: ${type}`);
          break;
        }
      }
    }

    for (const streamer of streamers) {
      await streamer.write({ stream, userId, checkpoint: checkpoints[streamer.getEntityType()] });
    }

    stream.end();
  }

  async getFullSync(auth: AuthDto, dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    // mobile implementation is faster if this is a single id
    const userId = dto.userId || auth.user.id;
    await this.requireAccess({ auth, permission: Permission.TIMELINE_READ, ids: [userId] });
    const assets = await this.assetRepository.getAllForUserFullSync({
      ownerId: userId,
      updatedUntil: dto.updatedUntil,
      lastId: dto.lastId,
      limit: dto.limit,
    });
    return assets.map((a) => mapAsset(a, { auth, stripMetadata: false, withStack: true }));
  }

  async getDeltaSync(auth: AuthDto, dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    // app has not synced in the last 100 days
    const duration = DateTime.now().diff(DateTime.fromJSDate(dto.updatedAfter));
    if (duration > AUDIT_LOG_MAX_DURATION) {
      return FULL_SYNC;
    }

    // app does not have the correct partners synced
    const partnerIds = await getMyPartnerIds({ userId: auth.user.id, repository: this.partnerRepository });
    const userIds = [auth.user.id, ...partnerIds];
    if (!setIsEqual(new Set(userIds), new Set(dto.userIds))) {
      return FULL_SYNC;
    }

    await this.requireAccess({ auth, permission: Permission.TIMELINE_READ, ids: dto.userIds });

    const limit = 10_000;
    const upserted = await this.assetRepository.getChangedDeltaSync({ limit, updatedAfter: dto.updatedAfter, userIds });

    // too many changes, need to do a full sync
    if (upserted.length === limit) {
      return FULL_SYNC;
    }

    const deleted = await this.auditRepository.getAfter(dto.updatedAfter, {
      userIds,
      entityType: EntityType.ASSET,
      action: DatabaseAction.DELETE,
    });

    const result = {
      needsFullSync: false,
      upserted: upserted
        // do not return archived assets for partner users
        .filter((a) => a.ownerId === auth.user.id || (a.ownerId !== auth.user.id && !a.isArchived))
        .map((a) =>
          mapAsset(a, {
            auth,
            stripMetadata: false,
            // ignore stacks for non partner users
            withStack: a.ownerId === auth.user.id,
          }),
        ),
      deleted,
    };
    return result;
  }

  private assertSession(auth: AuthDto) {
    if (!auth.session?.id) {
      throw new ForbiddenException('This endpoint requires session-based authentication');
    }

    return auth.session;
  }
}
