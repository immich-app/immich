import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { DateTime } from 'luxon';
import { Writable } from 'node:stream';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
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
import { SessionSyncCheckpointTable } from 'src/schema/tables/sync-checkpoint.table';
import { BaseService } from 'src/services/base.service';
import { SyncAck } from 'src/types';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { setIsEqual } from 'src/utils/set';
import { fromAck, mapJsonLine, serialize, SerializeOptions, toAck } from 'src/utils/sync';

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

const isEntityBackfillComplete = (createId: string, checkpoint: SyncAck | undefined): boolean =>
  createId === checkpoint?.updateId && checkpoint.extraId === COMPLETE_ID;

const getStartId = (createId: string, checkpoint: SyncAck | undefined): string | undefined =>
  createId === checkpoint?.updateId ? checkpoint?.extraId : undefined;

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
  SyncRequestType.StacksV1,
  SyncRequestType.PartnerAssetsV1,
  SyncRequestType.PartnerStacksV1,
  SyncRequestType.AlbumAssetsV1,
  SyncRequestType.AlbumsV1,
  SyncRequestType.AlbumUsersV1,
  SyncRequestType.AlbumToAssetsV1,
  SyncRequestType.AssetExifsV1,
  SyncRequestType.AlbumAssetExifsV1,
  SyncRequestType.PartnerAssetExifsV1,
  SyncRequestType.MemoriesV1,
  SyncRequestType.MemoryToAssetsV1,
  SyncRequestType.PeopleV1,
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

    return this.syncCheckpointRepository.getAll(sessionId);
  }

  async setAcks(auth: AuthDto, dto: SyncAckSetDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    const checkpoints: Record<string, Insertable<SessionSyncCheckpointTable>> = {};
    for (const ack of dto.acks) {
      const { type } = fromAck(ack);
      // TODO proper ack validation via class validator
      if (!Object.values(SyncEntityType).includes(type)) {
        throw new BadRequestException(`Invalid ack type: ${type}`);
      }

      // TODO pick the latest ack for each type, instead of using the last one
      checkpoints[type] = { sessionId, type, ack };
    }

    await this.syncCheckpointRepository.upsertAll(Object.values(checkpoints));
  }

  async deleteAcks(auth: AuthDto, dto: SyncAckDeleteDto) {
    const sessionId = auth.session?.id;
    if (!sessionId) {
      return throwSessionRequired();
    }

    await this.syncCheckpointRepository.deleteAll(sessionId, dto.types);
  }

  async stream(auth: AuthDto, response: Writable, dto: SyncStreamDto) {
    const session = auth.session;
    if (!session) {
      return throwSessionRequired();
    }

    if (dto.reset) {
      await this.sessionRepository.resetSyncProgress(session.id);
      session.isPendingSyncReset = false;
    }

    if (session.isPendingSyncReset) {
      response.write(mapJsonLine({ type: SyncEntityType.SyncResetV1, data: {} }));
      response.end();
      return;
    }

    const checkpoints = await this.syncCheckpointRepository.getAll(session.id);
    const checkpointMap: CheckpointMap = Object.fromEntries(checkpoints.map(({ type, ack }) => [type, fromAck(ack)]));

    const handlers: Record<SyncRequestType, () => Promise<void>> = {
      [SyncRequestType.UsersV1]: () => this.syncUsersV1(response, checkpointMap),
      [SyncRequestType.PartnersV1]: () => this.syncPartnersV1(response, checkpointMap, auth),
      [SyncRequestType.AssetsV1]: () => this.syncAssetsV1(response, checkpointMap, auth),
      [SyncRequestType.AssetExifsV1]: () => this.syncAssetExifsV1(response, checkpointMap, auth),
      [SyncRequestType.PartnerAssetsV1]: () => this.syncPartnerAssetsV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.PartnerAssetExifsV1]: () =>
        this.syncPartnerAssetExifsV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.AlbumsV1]: () => this.syncAlbumsV1(response, checkpointMap, auth),
      [SyncRequestType.AlbumUsersV1]: () => this.syncAlbumUsersV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.AlbumAssetsV1]: () => this.syncAlbumAssetsV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.AlbumToAssetsV1]: () => this.syncAlbumToAssetsV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.AlbumAssetExifsV1]: () => this.syncAlbumAssetExifsV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.MemoriesV1]: () => this.syncMemoriesV1(response, checkpointMap, auth),
      [SyncRequestType.MemoryToAssetsV1]: () => this.syncMemoryAssetsV1(response, checkpointMap, auth),
      [SyncRequestType.StacksV1]: () => this.syncStackV1(response, checkpointMap, auth),
      [SyncRequestType.PartnerStacksV1]: () => this.syncPartnerStackV1(response, checkpointMap, auth, session.id),
      [SyncRequestType.PeopleV1]: () => this.syncPeopleV1(response, checkpointMap, auth),
    };

    for (const type of SYNC_TYPES_ORDER.filter((type) => dto.types.includes(type))) {
      const handler = handlers[type];
      await handler();
    }

    response.end();
  }

  private async syncUsersV1(response: Writable, checkpointMap: CheckpointMap) {
    const deleteType = SyncEntityType.UserDeleteV1;
    const deletes = this.syncRepository.user.getDeletes(checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.UserV1;
    const upserts = this.syncRepository.user.getUpserts(checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncPartnersV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.PartnerDeleteV1;
    const deletes = this.syncRepository.partner.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.PartnerV1;
    const upserts = this.syncRepository.partner.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAssetsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.AssetDeleteV1;
    const deletes = this.syncRepository.asset.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.AssetV1;
    const upserts = this.syncRepository.asset.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data: mapSyncAssetV1(data) });
    }
  }

  private async syncPartnerAssetsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const deleteType = SyncEntityType.PartnerAssetDeleteV1;
    const deletes = this.syncRepository.partnerAsset.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const backfillType = SyncEntityType.PartnerAssetBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const partners = await this.syncRepository.partner.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.PartnerAssetV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const partner of partners) {
        const createId = partner.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.partnerAsset.getBackfill(partner.sharedById, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, {
            type: backfillType,
            ids: [createId, updateId],
            data: mapSyncAssetV1(data),
          });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (partners.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: partners.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.partnerAsset.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data: mapSyncAssetV1(data) });
    }
  }

  private async syncAssetExifsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const upsertType = SyncEntityType.AssetExifV1;
    const upserts = this.syncRepository.assetExif.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncPartnerAssetExifsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const backfillType = SyncEntityType.PartnerAssetExifBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const partners = await this.syncRepository.partner.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);

    const upsertType = SyncEntityType.PartnerAssetExifV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const partner of partners) {
        const createId = partner.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.partnerAssetExif.getBackfill(partner.sharedById, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [partner.createId, updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, partner.createId);
      }
    } else if (partners.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: partners.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.partnerAssetExif.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAlbumsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.AlbumDeleteV1;
    const deletes = this.syncRepository.album.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.AlbumV1;
    const upserts = this.syncRepository.album.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAlbumUsersV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto, sessionId: string) {
    const deleteType = SyncEntityType.AlbumUserDeleteV1;
    const deletes = this.syncRepository.albumUser.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const backfillType = SyncEntityType.AlbumUserBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const albums = await this.syncRepository.album.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.AlbumUserV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const album of albums) {
        const createId = album.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.albumUser.getBackfill(album.id, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [createId, updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (albums.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: albums.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.albumUser.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAlbumAssetsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto, sessionId: string) {
    const backfillType = SyncEntityType.AlbumAssetBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const albums = await this.syncRepository.album.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.AlbumAssetV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const album of albums) {
        const createId = album.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.albumAsset.getBackfill(album.id, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [createId, updateId], data: mapSyncAssetV1(data) });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (albums.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: albums.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.albumAsset.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data: mapSyncAssetV1(data) });
    }
  }

  private async syncAlbumAssetExifsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const backfillType = SyncEntityType.AlbumAssetExifBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const albums = await this.syncRepository.album.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.AlbumAssetExifV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const album of albums) {
        const createId = album.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.albumAssetExif.getBackfill(album.id, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [createId, updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (albums.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: albums.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.albumAssetExif.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncAlbumToAssetsV1(
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
    sessionId: string,
  ) {
    const deleteType = SyncEntityType.AlbumToAssetDeleteV1;
    const deletes = this.syncRepository.albumToAsset.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const backfillType = SyncEntityType.AlbumToAssetBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const albums = await this.syncRepository.album.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.AlbumToAssetV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const album of albums) {
        const createId = album.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.albumToAsset.getBackfill(album.id, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, { type: backfillType, ids: [createId, updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (albums.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: albums.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.albumToAsset.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncMemoriesV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.MemoryDeleteV1;
    const deletes = this.syncRepository.memory.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.MemoryV1;
    const upserts = this.syncRepository.memory.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncMemoryAssetsV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.MemoryToAssetDeleteV1;
    const deletes = this.syncRepository.memoryToAsset.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.MemoryToAssetV1;
    const upserts = this.syncRepository.memoryToAsset.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncStackV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.StackDeleteV1;
    const deletes = this.syncRepository.stack.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.StackV1;
    const upserts = this.syncRepository.stack.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncPartnerStackV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto, sessionId: string) {
    const deleteType = SyncEntityType.PartnerStackDeleteV1;
    const deletes = this.syncRepository.partnerStack.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const backfillType = SyncEntityType.PartnerStackBackfillV1;
    const backfillCheckpoint = checkpointMap[backfillType];
    const partners = await this.syncRepository.partner.getCreatedAfter(auth.user.id, backfillCheckpoint?.updateId);
    const upsertType = SyncEntityType.PartnerStackV1;
    const upsertCheckpoint = checkpointMap[upsertType];
    if (upsertCheckpoint) {
      const endId = upsertCheckpoint.updateId;

      for (const partner of partners) {
        const createId = partner.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const startId = getStartId(createId, backfillCheckpoint);
        const backfill = this.syncRepository.partnerStack.getBackfill(partner.sharedById, startId, endId);

        for await (const { updateId, ...data } of backfill) {
          send(response, {
            type: backfillType,
            ids: [createId, updateId],
            data,
          });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (partners.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: partners.at(-1)!.createId,
      });
    }

    const upserts = this.syncRepository.partnerStack.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async syncPeopleV1(response: Writable, checkpointMap: CheckpointMap, auth: AuthDto) {
    const deleteType = SyncEntityType.PersonDeleteV1;
    const deletes = this.syncRepository.people.getDeletes(auth.user.id, checkpointMap[deleteType]);
    for await (const { id, ...data } of deletes) {
      send(response, { type: deleteType, ids: [id], data });
    }

    const upsertType = SyncEntityType.PersonV1;
    const upserts = this.syncRepository.people.getUpserts(auth.user.id, checkpointMap[upsertType]);
    for await (const { updateId, ...data } of upserts) {
      send(response, { type: upsertType, ids: [updateId], data });
    }
  }

  private async upsertBackfillCheckpoint(item: { type: SyncEntityType; sessionId: string; createId: string }) {
    const { type, sessionId, createId } = item;
    await this.syncCheckpointRepository.upsertAll([
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
