import { DateTime } from 'luxon';
import { Writable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { AlbumResponseDto, mapAlbum } from 'src/dtos/album.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetDeltaSyncDto, AssetDeltaSyncResponseDto, AssetFullSyncDto } from 'src/dtos/sync.dto';
import { DatabaseAction, EntityType, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { setIsEqual } from 'src/utils/set';

const FULL_SYNC = { needsFullSync: true, deleted: [], upserted: [] };

export class SyncService extends BaseService {
  async sync(stream: Writable) {
    const a = await this.albumRepository.getById('7e98d5f4-5f21-4704-b3a7-1d001e3728d1', { withAssets: false });
    if (!a) {
      return;
    }
    const b = await this.assetRepository.getById('9901daee-90a2-4d97-811f-91d78d65bc6a');
    if (!b) {
      return;
    }

    const album = mapAlbum(a, false);
    const asset = mapAsset(b);
    void this.streamWrites(stream, album, 'album');
    void this.streamWrites(stream, asset, 'asset');
  }

  async streamWrites(stream: Writable, a: AlbumResponseDto | AssetResponseDto, type: 'asset' | 'album') {
    for (let i = 0; i < 10; i++) {
      const delay = 100;

      console.log(`waiting ${delay}ms`);

      await setTimeout(delay);

      stream.write(JSON.stringify({ id: i, type, data: a }) + '\n');
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
}
