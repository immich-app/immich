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
  SyncStreamDto,
} from 'src/dtos/sync.dto';
import { DatabaseAction, EntityType, Permission, SyncEntityType, SyncRequestType } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { SyncAck } from 'src/types';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { setIsEqual } from 'src/utils/set';
import { fromAck, serialize } from 'src/utils/sync';

const FULL_SYNC = { needsFullSync: true, deleted: [], upserted: [] };
const SYNC_TYPES_ORDER = [
  //
  SyncRequestType.UsersV1,
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

    const checkpoints: Insertable<SessionSyncCheckpoints>[] = [];
    for (const ack of dto.acks) {
      const { type } = fromAck(ack);
      // TODO proper ack validation via class validator
      if (!Object.values(SyncEntityType).includes(type)) {
        throw new BadRequestException(`Invalid ack type: ${type}`);
      }
      checkpoints.push({ sessionId, type, ack });
    }

    await this.syncRepository.upsertCheckpoints(checkpoints);
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
    const checkpointMap: Partial<Record<SyncEntityType, SyncAck>> = Object.fromEntries(
      checkpoints.map(({ type, ack }) => [type, fromAck(ack)]),
    );

    // TODO pre-filter/sort list based on optimal sync order

    for (const type of SYNC_TYPES_ORDER.filter((type) => dto.types.includes(type))) {
      switch (type) {
        case SyncRequestType.UsersV1: {
          const deletes = this.syncRepository.getUserDeletes(checkpointMap[SyncEntityType.UserDeleteV1]);
          for await (const { id, ...data } of deletes) {
            response.write(serialize({ type: SyncEntityType.UserDeleteV1, updateId: id, data }));
          }

          const upserts = this.syncRepository.getUserUpserts(checkpointMap[SyncEntityType.UserV1]);
          for await (const { updateId, ...data } of upserts) {
            response.write(serialize({ type: SyncEntityType.UserV1, updateId, data }));
          }

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
}
