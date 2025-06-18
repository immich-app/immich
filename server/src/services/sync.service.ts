import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { DateTime } from 'luxon';
import { Writable } from 'node:stream';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { SessionSyncCheckpoints } from 'src/db';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetDeltaSyncDto,
  AssetDeltaSyncResponseDto,
  AssetFullSyncDto,
  SyncAckDeleteDto,
  SyncAckSetDto,
  SyncAssetV1,
  SyncItem,
  SyncStreamDto,
} from 'src/dtos/sync.dto';
import { AssetVisibility, DatabaseAction, EntityType, Permission, SyncEntityType, SyncRequestType } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { SyncAck } from 'src/types';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { setIsEqual } from 'src/utils/set';
import { fromAck, serialize, SerializeOptions, toAck } from 'src/utils/sync';

type CheckpointMap = Partial<Record<SyncEntityType, SyncAck>>;
type AssetLike = Omit<SyncAssetV1, 'checksum' | 'thumbhash'> & {
  checksum: Buffer<ArrayBufferLike>;
  thumbhash: Buffer<ArrayBufferLike> | null;
};

const COMPLETE_ID = 'complete';

const mapSyncAssetV1 = ({ checksum, thumbhash, ...data }: AssetLike): SyncAssetV1 => ({
  ...data,
  checksum: hexOrBufferToBase64(checksum),
  thumbhash: thumbhash ? hexOrBufferToBase64(thumbhash) : null,
});

const isEntityBackfillComplete = (entity: { createId: string }, checkpoint: SyncAck | undefined): boolean =>
  entity.createId === checkpoint?.updateId && checkpoint.extraId === COMPLETE_ID;

const getStartId = (entity: { createId: string }, checkpoint: SyncAck | undefined): string | undefined =>
  checkpoint?.updateId === entity.createId ? checkpoint?.extraId : undefined;

const send = <T extends keyof SyncItem, D extends SyncItem[T]>(response: Writable, item: SerializeOptions<T, D>) => {
  response.write(serialize(item));
};

const sendEntityBackfillCompleteAck = (response: Writable, ackType: SyncEntityType, id: string) => {
  send(response, { type: SyncEntityType.SyncAckV1, data: {}, ackType, ids: [id, COMPLETE_ID] });
};

const FULL_SYNC = { needsFullSync: true, deleted: [], upserted: [] };
export const SYNC_TYPES_ORDER = [
  SyncRequestType.UsersV1,
  SyncRequestType.PartnersV1,
  SyncRequestType.AssetsV1,
  SyncRequestType.AssetExifsV1,
  SyncRequestType.PartnerAssetsV1,
  SyncRequestType.PartnerAssetExifsV1,
  SyncRequestType.AlbumsV1,
  SyncRequestType.AlbumUsersV1,
];

const throwSessionRequired = () => {
  throw new ForbiddenException('Sync endpoints cannot be used with API keys');
};

@Injectable()
export class SyncService extends BaseService {
  getAcks(auth: AuthDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    return this.syncRepository.getCheckpoints(sessionId);
  }

  async setAcks(auth: AuthDto, dto: SyncAckSetDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    const checkpoints: Record<string, Insertable<SessionSyncCheckpoints>> = {};
    for (const ack of dto.acks) {
      const { type } = fromAck(ack);
      // TODO proper ack validation via class validator
      if (!Object.values(SyncEntityType).includes(type)) {
        throw new BadRequestException(`Invalid ack type: ${type}`);
      }

      if (checkpoints[type]) {
        throw new BadRequestException('Only one ack per type is allowed');
      }

      checkpoints[type] = { sessionId, type, ack };
    }

    await this.syncRepository.upsertCheckpoints(Object.values(checkpoints));
  }

  async deleteAcks(auth: AuthDto, dto: SyncAckDeleteDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    await this.syncRepository.deleteCheckpoints(sessionId, dto.types);
  }

  async stream(auth: AuthDto, response: Writable, dto: SyncStreamDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    const checkpoints = await this.syncRepository.getCheckpoints(sessionId);
    const checkpointMap: CheckpointMap = Object.fromEntries(checkpoints.map(({ type, ack }) => [type, fromAck(ack)]));

    for (const type of SYNC_TYPES_ORDER.filter((type) => dto.types.includes(type))) {
      switch (type) {
        case SyncRequestType.UsersV1: {
          await this.syncUsersV1(response, checkpointMap);
          break;
        }

        case SyncRequestType.PartnersV1: {
          await this.syncPartnersV1(response, checkpointMap, auth);
          break;
        }

        case SyncRequestType.AssetsV1: {
          await this.syncAssetsV1(response, checkpointMap, auth);
          break;
        }

        case SyncRequestType.AssetExifsV1: {
          await this.syncAssetExifsV1(response, checkpointMap, auth);
          break;
        }

        case SyncRequestType.PartnerAssetsV1: {
          await this.syncPartnerAssetsV1(response, checkpointMap, auth, sessionId);

          break;
        }

        case SyncRequestType.PartnerAssetExifsV1: {
          await this.syncPartnerAssetExifsV1(response, checkpointMap, auth, sessionId);
          break;
        }

        case SyncRequestType.AlbumsV1: {
          await this.syncAlbumsV1(response, checkpointMap, auth);
          break;
        }

        case SyncRequestType.AlbumUsersV1: {
          await this.syncAlbumUsersV1(response, checkpointMap, auth, sessionId);
          break;
        }

        default: {
          this.logger.warn(`Unsupported sync type: ${type}`);
          break;
        }
      }
    }

    response.end();
  }

  private async syncUsersV1(response: Writable, checkpointMap: CheckpointMap) {
    const deletes = this.syncRepository.getUserDeletes(checkpointMap[SyncEntityType.UserDeleteV1]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: SyncEntityType.UserDeleteV1, ids: [id], data });
    }

    const upserts = this.syncRepository.getUserUpserts(checkpointMap[SyncEntityType.UserV1]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: SyncEntityType.UserV1, ids: [updateId], data });
    }
  }

  private async syncPartnersV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deletes = this.syncRepository.getPartnerDeletes(auth.user.id, checkpointMap[SyncEntityType.PartnerDeleteV1]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: SyncEntityType.PartnerDeleteV1, ids: [id], data });
    }

    const upserts = this.syncRepository.getPartnerUpserts(auth.user.id, checkpointMap[SyncEntityType.PartnerV1]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: SyncEntityType.PartnerV1, ids: [updateId], data });
    }
  }

  private async syncAssetsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deletes = this.syncRepository.getAssetDeletes(auth.user.id, checkpointMap[SyncEntityType.AssetDeleteV1]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: SyncEntityType.AssetDeleteV1, ids: [id], data });
    }

    const upserts = this.syncRepository.getAssetUpserts(auth.user.id, checkpointMap[SyncEntityType.AssetV1]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: SyncEntityType.AssetV1, ids: [updateId], data: mapSyncAssetV1(data) });
    }
  }

  private async syncPartnerAssetsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const backfillType = SyncEntityType.PartnerAssetBackfillV1;
    const upsertType = SyncEntityType.PartnerAssetV1;
    const deleteType = SyncEntityType.PartnerAssetDeleteV1;

    const backfillCheckpoint = checkpointMap[backfillType];
    const upsertCheckpoint = checkpointMap[upsertType];

    const deletes = this.syncRepository.getPartnerAssetDeletes(auth.user.id, checkpointMap[deleteType]);

    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const partners = await this.syncRepository.getPartnerBackfill(auth.user.id, backfillCheckpoint?.updateId);

    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const partner of partners) {
        if (isEntityBackfillComplete(partner, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(partner, backfillCheckpoint);
        const backfill = this.syncRepository.getPartnerAssetsBackfill(partner.sharedById, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, {
            type: backfillType,
            ids: [updateId],
            data: mapSyncAssetV1(data),
          });
        }

        sendEntityBackfillCompleteAck(response, backfillType, partner.sharedById);
      }
    } else if (partners.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: partners.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.getPartnerAssetsUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data: mapSyncAssetV1(data) });
    }
  }

  private async syncAssetExifsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const upserts = this.syncRepository.getAssetExifsUpserts(auth.user.id, checkpointMap[SyncEntityType.AssetExifV1]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: SyncEntityType.AssetExifV1, ids: [updateId], data });
    }
  }

  private async syncPartnerAssetExifsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const backfillType = SyncEntityType.PartnerAssetExifBackfillV1;
    const upsertType = SyncEntityType.PartnerAssetExifV1;

    const backfillCheckpoint = checkpointMap[backfillType];
    const upsertCheckpoint = checkpointMap[upsertType];

    const partners = await this.syncRepository.getPartnerBackfill(auth.user.id, backfillCheckpoint?.updateId);

    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const partner of partners) {
        if (isEntityBackfillComplete(partner, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(partner, backfillCheckpoint);
        const backfill = this.syncRepository.getPartnerAssetExifsBackfill(partner.sharedById, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, partner.sharedById);
      }
    } else if (partners.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: partners.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.getPartnerAssetExifsUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAlbumsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deletes = this.syncRepository.getAlbumDeletes(auth.user.id, checkpointMap[SyncEntityType.AlbumDeleteV1]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: SyncEntityType.AlbumDeleteV1, ids: [id], data });
    }

    const upserts = this.syncRepository.getAlbumUpserts(auth.user.id, checkpointMap[SyncEntityType.AlbumV1]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: SyncEntityType.AlbumV1, ids: [updateId], data });
    }
  }

  private async syncAlbumUsersV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto, sessionId: string) {
    const backfillType = SyncEntityType.AlbumUserBackfillV1;
    const upsertType = SyncEntityType.AlbumUserV1;
    const deleteType = SyncEntityType.AlbumUserDeleteV1;

    const backfillCheckpoint = checkpointMap[backfillType];
    const upsertCheckpoint = checkpointMap[upsertType];

    const deletes = this.syncRepository.getAlbumUserDeletes(auth.user.id, checkpointMap[deleteType]);

    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const albums = await this.syncRepository.getAlbumBackfill(auth.user.id, backfillCheckpoint?.updateId);

    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const album of albums) {
        if (isEntityBackfillComplete(album, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(album, backfillCheckpoint);
        const backfill = this.syncRepository.getAlbumUsersBackfill(album.id, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, album.id);
      }
    } else if (albums.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: albums.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.getAlbumUserUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async upsertBackfillCheckpoint(item: { type: SyncEntityType; sessionId: string; createId: string }) {
    const { type, sessionId, createId } = item;
    await this.syncRepository.upsertCheckpoints([
      {
        type,
        sessionId,
        ack: toAck({
          type,
          updateId: createId,
          extraId: COMPLETE_ID,
        }),
      },
    ]);
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
        .filter(
          (a) =>
            a.ownerId === auth.user.id || (a.ownerId !== auth.user.id && a.visibility === AssetVisibility.TIMELINE),
        )
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
}
