import { Inject } from '@nestjs/common';
import _ from 'lodash';
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

  async getAllAssetsForUserFullSync(auth: AuthDto, dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    const userId = dto.userId || auth.user.id;
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, userId);
    const assets = await this.assetRepository.getAllForUserFullSync({
      ownerId: userId,
      lastCreationDate: dto.lastCreationDate,
      updatedUntil: dto.updatedUntil,
      lastId: dto.lastId,
      limit: dto.limit,
    });
    const options = { auth, stripMetadata: false, withStack: true };
    return assets.map((a) => mapAsset(a, options));
  }

  async getChangesForDeltaSync(auth: AuthDto, dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, dto.userIds);
    const partner = await this.partnerRepository.getAll(auth.user.id);
    const userIds = [auth.user.id, ...partner.filter((p) => p.sharedWithId == auth.user.id).map((p) => p.sharedById)];
    userIds.sort();
    dto.userIds.sort();
    const duration = DateTime.now().diff(DateTime.fromJSDate(dto.updatedAfter));

    if (!_.isEqual(userIds, dto.userIds) || duration > AUDIT_LOG_MAX_DURATION) {
      // app does not have the correct partners synced
      // or app has not synced in the last 100 days
      return { needsFullSync: true, deleted: [], upserted: [] };
    }

    const limit = 10_000;
    const upserted = await this.assetRepository.getChangedDeltaSync({ limit, updatedAfter: dto.updatedAfter, userIds });

    if (upserted.length == limit) {
      // too many changes -> do a full sync (paginated) instead
      return { needsFullSync: true, deleted: [], upserted: [] };
    }

    const deleted = await this.auditRepository.getAfter(dto.updatedAfter, {
      userIds: userIds,
      entityType: EntityType.ASSET,
      action: DatabaseAction.DELETE,
    });

    const options = { auth, stripMetadata: false, withStack: true };
    const result = {
      needsFullSync: false,
      upserted: upserted.map((a) => mapAsset(a, options)),
      deleted,
    };
    return result;
  }
}
