import { Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { AccessCore, Permission } from 'src/cores/access.core';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetDeltaSyncDto, AssetDeltaSyncResponseDto, AssetFullSyncDto } from 'src/dtos/sync.dto';
import { DatabaseAction, EntityType } from 'src/entities/audit.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { setIsEqual } from 'src/utils/set';

const FULL_SYNC = { needsFullSync: true, deleted: [], upserted: [] };

export class SyncService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IAuditRepository) private auditRepository: IAuditRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async getFullSync(auth: AuthDto, dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    // mobile implementation is faster if this is a single id
    const userId = dto.userId || auth.user.id;
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, userId);
    const assets = await this.assetRepository.getAllForUserFullSync({
      ownerId: userId,
      lastCreationDate: dto.lastCreationDate,
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

    const authUserId = auth.user.id;

    // app does not have the correct partners synced
    const partner = await this.partnerRepository.getAll(authUserId);
    const userIds = [authUserId, ...partner.filter((p) => p.sharedWithId == auth.user.id).map((p) => p.sharedById)];
    if (!setIsEqual(new Set(userIds), new Set(dto.userIds))) {
      return FULL_SYNC;
    }

    await this.access.requirePermission(auth, Permission.TIMELINE_READ, dto.userIds);

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
            withStack: a.ownerId === authUserId,
          }),
        ),
      deleted,
    };
    return result;
  }
}
