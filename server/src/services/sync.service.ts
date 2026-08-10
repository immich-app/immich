import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { DateTime, Duration } from 'luxon';
import { Writable } from 'node:stream';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SyncAckDeleteDto,
  SyncAckSetDto,
  syncAlbumV2ToV1,
  SyncAssetV2,
  SyncItem,
  SyncStreamDto,
} from 'src/dtos/sync.dto';
import { JobName, QueueName, SyncEntityType, SyncRequestType } from 'src/enum';
import { SyncQueryOptions } from 'src/repositories/sync.repository';
import { SessionSyncCheckpointTable } from 'src/schema/tables/sync-checkpoint.table';
import { BaseService } from 'src/services/base.service';
import { SyncAck } from 'src/types';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { fromAck, serialize, SerializeOptions, toAck } from 'src/utils/sync';

type CheckpointMap = Partial<Record<SyncEntityType, SyncAck>>;
type SyncPartnerParent = { sharedById: string; createId: string };
type SyncAlbumParent = { id: string; createId: string };
type AssetLike = Omit<SyncAssetV2, 'checksum' | 'thumbhash'> & {
  checksum: Buffer<ArrayBufferLike>;
  thumbhash: Buffer<ArrayBufferLike> | null;
};

const COMPLETE_ID = 'complete';
const MAX_DAYS = 30;
const MAX_DURATION = Duration.fromObject({ days: MAX_DAYS });

const mapSyncAssetV2 = ({ checksum, thumbhash, ...data }: AssetLike): SyncAssetV2 => ({
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

export const SYNC_TYPES_ORDER = [
  SyncRequestType.AuthUsersV1,
  SyncRequestType.UsersV1,
  SyncRequestType.PartnersV1,
  SyncRequestType.AssetsV1,
  SyncRequestType.AssetsV2,
  SyncRequestType.StacksV1,
  SyncRequestType.PartnerAssetsV1,
  SyncRequestType.PartnerAssetsV2,
  SyncRequestType.PartnerStacksV1,
  SyncRequestType.AlbumAssetsV1,
  SyncRequestType.AlbumAssetsV2,
  SyncRequestType.AlbumsV1,
  SyncRequestType.AlbumsV2,
  SyncRequestType.AlbumUsersV1,
  SyncRequestType.AlbumToAssetsV1,
  SyncRequestType.AssetExifsV1,
  SyncRequestType.AlbumAssetExifsV1,
  SyncRequestType.AssetOcrV1,
  SyncRequestType.PartnerAssetExifsV1,
  SyncRequestType.MemoriesV1,
  SyncRequestType.MemoryToAssetsV1,
  SyncRequestType.PeopleV1,
  SyncRequestType.AssetFacesV1,
  SyncRequestType.AssetFacesV2,
  SyncRequestType.UserMetadataV1,
  SyncRequestType.AssetMetadataV1,
  SyncRequestType.AssetEditsV1,
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
      if (type === SyncEntityType.SyncResetV1) {
        await this.sessionRepository.resetSyncProgress(sessionId);
        return;
      }
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
    }

    const isPendingSyncReset = await this.sessionRepository.isPendingSyncReset(session.id);
    if (isPendingSyncReset) {
      send(response, { type: SyncEntityType.SyncResetV1, ids: ['reset'], data: {} });
      response.end();
      return;
    }

    const checkpoints = await this.syncCheckpointRepository.getAll(session.id);
    const checkpointMap: CheckpointMap = Object.fromEntries(checkpoints.map(({ type, ack }) => [type, fromAck(ack)]));

    if (this.needsFullSync(checkpointMap)) {
      send(response, { type: SyncEntityType.SyncResetV1, ids: ['reset'], data: {} });
      response.end();
      return;
    }

    const { nowId } = await this.syncCheckpointRepository.getNow();
    const options: SyncQueryOptions = { nowId, userId: auth.user.id };

    const handlers: Record<SyncRequestType, () => Promise<void>> = {
      // deprecated handlers
      [SyncRequestType.AssetsV1]: () => this.syncAssetsV1(),
      [SyncRequestType.AssetFacesV1]: () => this.syncAssetFacesV1(),
      [SyncRequestType.PartnerAssetsV1]: () => this.syncPartnerAssetsV1(),
      [SyncRequestType.AlbumAssetsV1]: () => this.syncAlbumAssetsV1(),

      [SyncRequestType.AuthUsersV1]: () => this.syncAuthUsersV1(options, response, checkpointMap),
      [SyncRequestType.UsersV1]: () => this.syncUsersV1(options, response, checkpointMap),
      [SyncRequestType.PartnersV1]: () => this.syncPartnersV1(options, response, checkpointMap),
      [SyncRequestType.AssetsV2]: () => this.syncAssetsV2(options, response, checkpointMap),
      [SyncRequestType.AssetExifsV1]: () => this.syncAssetExifsV1(options, response, checkpointMap),
      [SyncRequestType.AssetEditsV1]: () => this.syncAssetEditsV1(options, response, checkpointMap),
      [SyncRequestType.PartnerAssetsV2]: () => this.syncPartnerAssetsV2(options, response, checkpointMap, session.id),
      [SyncRequestType.AssetMetadataV1]: () => this.syncAssetMetadataV1(options, response, checkpointMap, auth),
      [SyncRequestType.PartnerAssetExifsV1]: () =>
        this.syncPartnerAssetExifsV1(options, response, checkpointMap, session.id),
      [SyncRequestType.AlbumsV1]: () => this.syncAlbumsV1(options, response, checkpointMap),
      [SyncRequestType.AlbumsV2]: () => this.syncAlbumsV2(options, response, checkpointMap),
      [SyncRequestType.AlbumUsersV1]: () => this.syncAlbumUsersV1(options, response, checkpointMap, session.id),
      [SyncRequestType.AlbumAssetsV2]: () => this.syncAlbumAssetsV2(options, response, checkpointMap, session.id),
      [SyncRequestType.AlbumToAssetsV1]: () => this.syncAlbumToAssetsV1(options, response, checkpointMap, session.id),
      [SyncRequestType.AlbumAssetExifsV1]: () =>
        this.syncAlbumAssetExifsV1(options, response, checkpointMap, session.id),
      [SyncRequestType.MemoriesV1]: () => this.syncMemoriesV1(options, response, checkpointMap),
      [SyncRequestType.MemoryToAssetsV1]: () => this.syncMemoryAssetsV1(options, response, checkpointMap),
      [SyncRequestType.StacksV1]: () => this.syncStackV1(options, response, checkpointMap),
      [SyncRequestType.PartnerStacksV1]: () => this.syncPartnerStackV1(options, response, checkpointMap, session.id),
      [SyncRequestType.PeopleV1]: () => this.syncPeopleV1(options, response, checkpointMap),
      [SyncRequestType.AssetFacesV2]: () => this.syncAssetFacesV2(options, response, checkpointMap),
      [SyncRequestType.UserMetadataV1]: () => this.syncUserMetadataV1(options, response, checkpointMap),
      [SyncRequestType.AssetOcrV1]: () => this.syncAssetOcrV1(options, response, checkpointMap, auth),
    } as const;

    for (const type of SYNC_TYPES_ORDER) {
      if (!dto.types.includes(type)) {
        continue;
      }

      const handler = handlers[type as keyof typeof handlers];
      await handler();
    }

    send(response, { type: SyncEntityType.SyncCompleteV1, ids: [nowId], data: {} });

    response.end();
  }

  @OnJob({ name: JobName.AuditTableCleanup, queue: QueueName.BackgroundTask })
  async onAuditTableCleanup() {
    const pruneThreshold = MAX_DAYS + 1;

    await this.syncRepository.album.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.albumUser.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.albumToAsset.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.asset.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.assetFace.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.assetMetadata.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.assetEdit.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.memory.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.memoryToAsset.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.partner.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.person.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.stack.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.user.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.userMetadata.cleanupAuditTable(pruneThreshold);
    await this.syncRepository.assetOcr.cleanupAuditTable(pruneThreshold);
  }

  private needsFullSync(checkpointMap: CheckpointMap) {
    const completeAck = checkpointMap[SyncEntityType.SyncCompleteV1];
    if (!completeAck) {
      return false;
    }

    const milliseconds = Number.parseInt(completeAck.updateId.replaceAll('-', '').slice(0, 12), 16);

    return DateTime.fromMillis(milliseconds) < DateTime.now().minus(MAX_DURATION);
  }

  private async streamDeletes<T extends keyof SyncItem>(
    response: Writable,
    type: T,
    deletes: AsyncIterableIterator<{ id: string } & SyncItem[T]>,
  ) {
    for await (const { id, ...data } of deletes) {
      send(response, { type, ids: [id], data: data as unknown as SyncItem[T] });
    }
  }

  private async streamUpserts<T extends keyof SyncItem>(
    response: Writable,
    type: T,
    upserts: AsyncIterableIterator<{ updateId: string } & SyncItem[T]>,
  ): Promise<void>;
  private async streamUpserts<T extends keyof SyncItem, Row extends { updateId: string }>(
    response: Writable,
    type: T,
    upserts: AsyncIterableIterator<Row>,
    map: (row: Omit<Row, 'updateId'>) => SyncItem[T] | Promise<SyncItem[T]>,
  ): Promise<void>;
  private async streamUpserts<T extends keyof SyncItem, Row extends { updateId: string }>(
    response: Writable,
    type: T,
    upserts: AsyncIterableIterator<Row>,
    map?: (row: Omit<Row, 'updateId'>) => SyncItem[T] | Promise<SyncItem[T]>,
  ): Promise<void> {
    for await (const { updateId, ...row } of upserts) {
      const data = map ? await map(row) : (row as unknown as SyncItem[T]);
      send(response, { type, ids: [updateId], data });
    }
  }

  private async streamBackfill<
    T extends keyof SyncItem,
    Parent extends { createId: string },
    Row extends { updateId: string },
  >(
    response: Writable,
    args: {
      sessionId: string;
      backfillType: T;
      backfillCheckpoint: SyncAck | undefined;
      endCheckpoint: SyncAck | undefined;
      getParents: (afterCreateId: string | undefined) => Promise<Parent[]>;
      getBackfill: (
        parent: Parent,
        range: { afterUpdateId: string | undefined; beforeUpdateId: string },
      ) => AsyncIterableIterator<Row>;
      map?: (row: Omit<NoInfer<Row>, 'updateId'>) => SyncItem[T];
    },
  ) {
    const { sessionId, backfillType, backfillCheckpoint, endCheckpoint, getParents, getBackfill, map } = args;
    const parents = await getParents(backfillCheckpoint?.updateId);

    if (endCheckpoint) {
      const beforeUpdateId = endCheckpoint.updateId;

      for (const parent of parents) {
        const createId = parent.createId;
        if (isEntityBackfillComplete(createId, backfillCheckpoint)) {
          continue;
        }

        const afterUpdateId = getStartId(createId, backfillCheckpoint);
        const backfill = getBackfill(parent, { afterUpdateId, beforeUpdateId });

        for await (const { updateId, ...row } of backfill) {
          const data = map ? map(row) : (row as unknown as SyncItem[T]);
          send(response, { type: backfillType, ids: [createId, updateId], data });
        }

        sendEntityBackfillCompleteAck(response, backfillType, createId);
      }
    } else if (parents.length > 0) {
      await this.upsertBackfillCheckpoint({
        type: backfillType,
        sessionId,
        createId: parents.at(-1)!.createId,
      });
    }
  }

  private async streamCreates<T extends keyof SyncItem, Row extends { updateId: string }>(
    response: Writable,
    args: {
      createType: T;
      ackType: SyncEntityType;
      nowId: string;
      creates: AsyncIterableIterator<Row>;
      map?: (row: Omit<NoInfer<Row>, 'updateId'>) => SyncItem[T];
    },
  ) {
    const { createType, ackType, nowId, creates, map } = args;
    let isFirst = true;
    for await (const { updateId, ...row } of creates) {
      if (isFirst) {
        send(response, { type: SyncEntityType.SyncAckV1, data: {}, ackType, ids: [nowId] });
        isFirst = false;
      }
      const data = map ? map(row) : (row as unknown as SyncItem[T]);
      send(response, { type: createType, ids: [updateId], data });
    }
  }

  private async syncAuthUsersV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamUpserts(
      response,
      SyncEntityType.AuthUserV1,
      this.syncRepository.authUser.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AuthUserV1] }),
      ({ profileImagePath, ...data }) => ({ ...data, hasProfileImage: !!profileImagePath }),
    );
  }

  private async syncUsersV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.UserDeleteV1,
      this.syncRepository.user.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.UserDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.UserV1,
      this.syncRepository.user.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.UserV1] }),
      ({ profileImagePath, ...data }) => ({ ...data, hasProfileImage: !!profileImagePath }),
    );
  }

  private async syncPartnersV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.PartnerDeleteV1,
      this.syncRepository.partner.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.PartnerDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.PartnerV1,
      this.syncRepository.partner.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.PartnerV1] }),
    );
  }

  private syncAssetsV1(): Promise<void> {
    throw new BadRequestException('SyncRequestType.AssetsV1 is deprecated, use SyncRequestType.AssetsV2 instead');
  }

  private async syncAssetsV2(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.AssetDeleteV1,
      this.syncRepository.asset.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AssetDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AssetV2,
      this.syncRepository.asset.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AssetV2] }),
      mapSyncAssetV2,
    );
  }

  private syncPartnerAssetsV1(): Promise<void> {
    throw new BadRequestException(
      'SyncRequestType.PartnerAssetsV1 is deprecated, use SyncRequestType.PartnerAssetsV2 instead',
    );
  }

  private async syncPartnerAssetsV2(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    await this.streamDeletes(
      response,
      SyncEntityType.PartnerAssetDeleteV1,
      this.syncRepository.partnerAsset.getDeletes({
        ...options,
        ack: checkpointMap[SyncEntityType.PartnerAssetDeleteV1],
      }),
    );

    await this.streamBackfill<SyncEntityType.PartnerAssetBackfillV2, SyncPartnerParent, AssetLike & { updateId: string }>(
      response,
      {
        sessionId,
        backfillType: SyncEntityType.PartnerAssetBackfillV2,
        backfillCheckpoint: checkpointMap[SyncEntityType.PartnerAssetBackfillV2],
        endCheckpoint: checkpointMap[SyncEntityType.PartnerAssetV2],
        getParents: (afterCreateId) => this.syncRepository.partner.getCreatedAfter({ ...options, afterCreateId }),
        getBackfill: (partner, range) =>
          this.syncRepository.partnerAsset.getBackfill({ ...options, ...range }, partner.sharedById),
        map: mapSyncAssetV2,
      },
    );

    await this.streamUpserts(
      response,
      SyncEntityType.PartnerAssetV2,
      this.syncRepository.partnerAsset.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.PartnerAssetV2] }),
      mapSyncAssetV2,
    );
  }

  private async syncAssetExifsV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamUpserts(
      response,
      SyncEntityType.AssetExifV1,
      this.syncRepository.assetExif.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AssetExifV1] }),
    );
  }

  private async syncAssetEditsV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.AssetEditDeleteV1,
      this.syncRepository.assetEdit.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AssetEditDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AssetEditV1,
      this.syncRepository.assetEdit.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AssetEditV1] }),
    );
  }

  private async syncPartnerAssetExifsV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    await this.streamBackfill(response, {
      sessionId,
      backfillType: SyncEntityType.PartnerAssetExifBackfillV1,
      backfillCheckpoint: checkpointMap[SyncEntityType.PartnerAssetExifBackfillV1],
      endCheckpoint: checkpointMap[SyncEntityType.PartnerAssetExifV1],
      getParents: (afterCreateId) => this.syncRepository.partner.getCreatedAfter({ ...options, afterCreateId }),
      getBackfill: (partner: SyncPartnerParent, range) =>
        this.syncRepository.partnerAssetExif.getBackfill({ ...options, ...range }, partner.sharedById),
    });

    await this.streamUpserts(
      response,
      SyncEntityType.PartnerAssetExifV1,
      this.syncRepository.partnerAssetExif.getUpserts({
        ...options,
        ack: checkpointMap[SyncEntityType.PartnerAssetExifV1],
      }),
    );
  }

  private async syncAlbumsV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.AlbumDeleteV1,
      this.syncRepository.album.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AlbumDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AlbumV1,
      this.syncRepository.album.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AlbumV1] }),
      async (data) => {
        const albumUsers = await this.syncRepository.album.getAlbumUsers(data.id);
        // TODO: return null instead of '' in v4
        return syncAlbumV2ToV1({ ...data, description: data.description ?? '' }, albumUsers);
      },
    );
  }

  private async syncAlbumsV2(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.AlbumDeleteV1,
      this.syncRepository.album.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AlbumDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AlbumV2,
      this.syncRepository.album.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AlbumV2] }),
      // TODO: return null instead of '' in v4
      (data) => ({ ...data, description: data.description ?? '' }),
    );
  }

  private async syncAlbumUsersV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    await this.streamDeletes(
      response,
      SyncEntityType.AlbumUserDeleteV1,
      this.syncRepository.albumUser.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AlbumUserDeleteV1] }),
    );

    await this.streamBackfill(response, {
      sessionId,
      backfillType: SyncEntityType.AlbumUserBackfillV1,
      backfillCheckpoint: checkpointMap[SyncEntityType.AlbumUserBackfillV1],
      endCheckpoint: checkpointMap[SyncEntityType.AlbumUserV1],
      getParents: (afterCreateId) => this.syncRepository.album.getCreatedAfter({ ...options, afterCreateId }),
      getBackfill: (album: SyncAlbumParent, range) => this.syncRepository.albumUser.getBackfill({ ...options, ...range }, album.id),
    });

    await this.streamUpserts(
      response,
      SyncEntityType.AlbumUserV1,
      this.syncRepository.albumUser.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AlbumUserV1] }),
    );
  }

  private syncAlbumAssetsV1(): Promise<void> {
    throw new BadRequestException(
      'SyncRequestType.AlbumAssetsV1 is deprecated, use SyncRequestType.AlbumAssetsV2 instead',
    );
  }

  private async syncAlbumAssetsV2(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    const updateType = SyncEntityType.AlbumAssetUpdateV2;
    const createCheckpoint = checkpointMap[SyncEntityType.AlbumAssetCreateV2];

    await this.streamBackfill<SyncEntityType.AlbumAssetBackfillV2, SyncAlbumParent, AssetLike & { updateId: string }>(
      response,
      {
        sessionId,
        backfillType: SyncEntityType.AlbumAssetBackfillV2,
        backfillCheckpoint: checkpointMap[SyncEntityType.AlbumAssetBackfillV2],
        endCheckpoint: createCheckpoint,
        getParents: (afterCreateId) => this.syncRepository.album.getCreatedAfter({ ...options, afterCreateId }),
        getBackfill: (album, range) =>
          this.syncRepository.albumAsset.getBackfill({ ...options, ...range }, album.id, options.userId),
        map: mapSyncAssetV2,
      },
    );

    if (createCheckpoint) {
      await this.streamUpserts(
        response,
        updateType,
        this.syncRepository.albumAsset.getUpdates({ ...options, ack: checkpointMap[updateType] }, createCheckpoint),
        mapSyncAssetV2,
      );
    }

    await this.streamCreates(response, {
      createType: SyncEntityType.AlbumAssetCreateV2,
      ackType: updateType,
      nowId: options.nowId,
      creates: this.syncRepository.albumAsset.getCreates({ ...options, ack: createCheckpoint }),
      map: mapSyncAssetV2,
    });
  }

  private async syncAlbumAssetExifsV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    const updateType = SyncEntityType.AlbumAssetExifUpdateV1;
    const createCheckpoint = checkpointMap[SyncEntityType.AlbumAssetExifCreateV1];

    await this.streamBackfill(response, {
      sessionId,
      backfillType: SyncEntityType.AlbumAssetExifBackfillV1,
      backfillCheckpoint: checkpointMap[SyncEntityType.AlbumAssetExifBackfillV1],
      endCheckpoint: createCheckpoint,
      getParents: (afterCreateId) => this.syncRepository.album.getCreatedAfter({ ...options, afterCreateId }),
      getBackfill: (album: SyncAlbumParent, range) => this.syncRepository.albumAssetExif.getBackfill({ ...options, ...range }, album.id),
    });

    if (createCheckpoint) {
      await this.streamUpserts(
        response,
        updateType,
        this.syncRepository.albumAssetExif.getUpdates({ ...options, ack: checkpointMap[updateType] }, createCheckpoint),
      );
    }

    await this.streamCreates(response, {
      createType: SyncEntityType.AlbumAssetExifCreateV1,
      ackType: updateType,
      nowId: options.nowId,
      creates: this.syncRepository.albumAssetExif.getCreates({ ...options, ack: createCheckpoint }),
    });
  }

  private async syncAlbumToAssetsV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    await this.streamDeletes(
      response,
      SyncEntityType.AlbumToAssetDeleteV1,
      this.syncRepository.albumToAsset.getDeletes({
        ...options,
        ack: checkpointMap[SyncEntityType.AlbumToAssetDeleteV1],
      }),
    );

    await this.streamBackfill(response, {
      sessionId,
      backfillType: SyncEntityType.AlbumToAssetBackfillV1,
      backfillCheckpoint: checkpointMap[SyncEntityType.AlbumToAssetBackfillV1],
      endCheckpoint: checkpointMap[SyncEntityType.AlbumToAssetV1],
      getParents: (afterCreateId) => this.syncRepository.album.getCreatedAfter({ ...options, afterCreateId }),
      getBackfill: (album: SyncAlbumParent, range) => this.syncRepository.albumToAsset.getBackfill({ ...options, ...range }, album.id),
    });

    await this.streamUpserts(
      response,
      SyncEntityType.AlbumToAssetV1,
      this.syncRepository.albumToAsset.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AlbumToAssetV1] }),
    );
  }

  private async syncMemoriesV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.MemoryDeleteV1,
      this.syncRepository.memory.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.MemoryDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.MemoryV1,
      this.syncRepository.memory.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.MemoryV1] }),
    );
  }

  private async syncMemoryAssetsV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.MemoryToAssetDeleteV1,
      this.syncRepository.memoryToAsset.getDeletes({
        ...options,
        ack: checkpointMap[SyncEntityType.MemoryToAssetDeleteV1],
      }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.MemoryToAssetV1,
      this.syncRepository.memoryToAsset.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.MemoryToAssetV1] }),
    );
  }

  private async syncStackV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.StackDeleteV1,
      this.syncRepository.stack.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.StackDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.StackV1,
      this.syncRepository.stack.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.StackV1] }),
    );
  }

  private async syncPartnerStackV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    sessionId: string,
  ) {
    await this.streamDeletes(
      response,
      SyncEntityType.PartnerStackDeleteV1,
      this.syncRepository.partnerStack.getDeletes({
        ...options,
        ack: checkpointMap[SyncEntityType.PartnerStackDeleteV1],
      }),
    );

    await this.streamBackfill(response, {
      sessionId,
      backfillType: SyncEntityType.PartnerStackBackfillV1,
      backfillCheckpoint: checkpointMap[SyncEntityType.PartnerStackBackfillV1],
      endCheckpoint: checkpointMap[SyncEntityType.PartnerStackV1],
      getParents: (afterCreateId) => this.syncRepository.partner.getCreatedAfter({ ...options, afterCreateId }),
      getBackfill: (partner: SyncPartnerParent, range) =>
        this.syncRepository.partnerStack.getBackfill({ ...options, ...range }, partner.sharedById),
    });

    await this.streamUpserts(
      response,
      SyncEntityType.PartnerStackV1,
      this.syncRepository.partnerStack.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.PartnerStackV1] }),
    );
  }

  private async syncPeopleV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.PersonDeleteV1,
      this.syncRepository.person.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.PersonDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.PersonV1,
      this.syncRepository.person.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.PersonV1] }),
    );
  }

  private syncAssetFacesV1(): Promise<void> {
    throw new BadRequestException(
      'SyncRequestType.AssetFacesV1 is deprecated, use SyncRequestType.AssetFacesV2 instead',
    );
  }

  private async syncAssetFacesV2(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.AssetFaceDeleteV1,
      this.syncRepository.assetFace.getDeletes({ ...options, ack: checkpointMap[SyncEntityType.AssetFaceDeleteV1] }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AssetFaceV2,
      this.syncRepository.assetFace.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AssetFaceV2] }),
    );
  }

  private async syncUserMetadataV1(options: SyncQueryOptions, response: Writable, checkpointMap: CheckpointMap) {
    await this.streamDeletes(
      response,
      SyncEntityType.UserMetadataDeleteV1,
      this.syncRepository.userMetadata.getDeletes({
        ...options,
        ack: checkpointMap[SyncEntityType.UserMetadataDeleteV1],
      }),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.UserMetadataV1,
      this.syncRepository.userMetadata.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.UserMetadataV1] }),
    );
  }

  private async syncAssetMetadataV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
  ) {
    await this.streamDeletes(
      response,
      SyncEntityType.AssetMetadataDeleteV1,
      this.syncRepository.assetMetadata.getDeletes(
        { ...options, ack: checkpointMap[SyncEntityType.AssetMetadataDeleteV1] },
        auth.user.id,
      ),
    );
    await this.streamUpserts(
      response,
      SyncEntityType.AssetMetadataV1,
      this.syncRepository.assetMetadata.getUpserts(
        { ...options, ack: checkpointMap[SyncEntityType.AssetMetadataV1] },
        auth.user.id,
      ),
    );
  }

  private async syncAssetOcrV1(
    options: SyncQueryOptions,
    response: Writable,
    checkpointMap: CheckpointMap,
    auth: AuthDto,
  ) {
    const deleteType = SyncEntityType.AssetOcrDeleteV1;
    const deletes = this.syncRepository.assetOcr.getDeletes(
      { ...options, ack: checkpointMap[deleteType] },
      auth.user.id,
    );

    for await (const row of deletes) {
      send(response, { type: deleteType, ids: [row.id], data: row });
    }

    await this.streamUpserts(
      response,
      SyncEntityType.AssetOcrV1,
      this.syncRepository.assetOcr.getUpserts({ ...options, ack: checkpointMap[SyncEntityType.AssetOcrV1] }, auth.user.id),
    );
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
}
