import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { DB } from 'src/schema/index.js';

export interface UpsertDeviceMount {
  libraryId: string;
  volumeId: string;
  identityMethod: string;
  identityConfidence: string;
  lastKnownPath: string;
  assetCount?: number | null;
}

/**
 * Persists the volume-identity -> library/path mapping from the Phase 1 plan (work item 3): given a resolved
 * `DeviceIdentity.id`, what library does it back, and where was it last mounted. See DeviceMountTable for the
 * column-level rationale and the outstanding migration-generation caveat.
 */
@Injectable()
export class DeviceMountRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.STRING] })
  getByVolumeId(volumeId: string) {
    return this.db.selectFrom('device_mount').selectAll().where('volumeId', '=', volumeId).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByLibraryId(libraryId: string) {
    return this.db.selectFrom('device_mount').selectAll().where('libraryId', '=', libraryId).executeTakeFirst();
  }

  @GenerateSql({ params: [] })
  getAll() {
    return this.db.selectFrom('device_mount').selectAll().orderBy('lastSeenAt', 'desc').execute();
  }

  /**
   * Records a successful resolve: creates the mapping on first sight of a volume, or refreshes its last-known
   * path/confidence/asset count on a reconnect. One row per `volumeId` (unique constraint) - last-seen wins.
   */
  upsert(mount: UpsertDeviceMount) {
    return this.db
      .insertInto('device_mount')
      .values({ ...mount, lastSeenAt: new Date() })
      .onConflict((oc) =>
        oc.column('volumeId').doUpdateSet({
          libraryId: mount.libraryId,
          identityMethod: mount.identityMethod,
          identityConfidence: mount.identityConfidence,
          lastKnownPath: mount.lastKnownPath,
          assetCount: mount.assetCount,
          lastSeenAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: string) {
    await this.db.deleteFrom('device_mount').where('id', '=', id).execute();
  }
}
