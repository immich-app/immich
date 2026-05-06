import { Injectable } from '@nestjs/common';
import { Kysely, NotNull, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import {
  asUuid,
  getHiddenContentFilter,
  hiddenContentAssetIdExists,
  tagHasVisibleAssetOrNoAssets,
  withDefaultVisibility,
  withHiddenContentFilter,
} from 'src/utils/database';
import type { HiddenContentFilter, HiddenContentQueryOptions } from 'src/utils/hidden-content';

type AccessPrivacy = boolean | HiddenContentFilter | undefined;

const privacyOptions = (privacy: AccessPrivacy): HiddenContentQueryOptions => {
  return typeof privacy === 'object' ? { hiddenContent: privacy } : privacy ? { excludeNsfw: true } : {};
};

class ActivityAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, activityIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (activityIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('activity')
      .leftJoin('asset', (join) => join.onRef('asset.id', '=', 'activity.assetId').on('asset.deletedAt', 'is', null))
      .select('activity.id')
      .where('activity.id', 'in', [...activityIds])
      .where('activity.userId', '=', userId)
      .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets)))
      .execute()
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumOwnerAccess(userId: string, activityIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (activityIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('activity')
      .leftJoin('asset', (join) => join.onRef('asset.id', '=', 'activity.assetId').on('asset.deletedAt', 'is', null))
      .select('activity.id')
      .innerJoin('album', (join) => join.onRef('activity.albumId', '=', 'album.id').on('album.deletedAt', 'is', null))
      .innerJoin('album_user', (join) =>
        join
          .onRef('album.id', '=', 'album_user.albumId')
          .on('album_user.role', '=', sql.lit(AlbumUserRole.Owner))
          .on('album_user.userId', '=', asUuid(userId)),
      )
      .where('activity.id', 'in', [...activityIds])
      .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets)))
      .execute()
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkCreateAccess(userId: string, albumIds: Set<string>) {
    if (albumIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('album')
      .select('album.id')
      .innerJoin('album_user as albumUsers', 'albumUsers.albumId', 'album.id')
      .innerJoin('user', (join) => join.onRef('user.id', '=', 'albumUsers.userId').on('user.deletedAt', 'is', null))
      .where('album.id', 'in', [...albumIds])
      .where('album.isActivityEnabled', '=', true)
      .where((eb) => eb('user.id', '=', userId))
      .where('album.deletedAt', 'is', null)
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }
}

class AlbumAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, albumIds: Set<string>) {
    if (albumIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('album')
      .select('album.id')
      .where('album.id', 'in', [...albumIds])
      .innerJoin('album_user', (join) =>
        join
          .onRef('album.id', '=', 'album_user.albumId')
          .on('album_user.role', '=', sql.lit(AlbumUserRole.Owner))
          .on('album_user.userId', '=', userId),
      )
      .where('album.deletedAt', 'is', null)
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedAlbumAccess(userId: string, albumIds: Set<string>, access: AlbumUserRole) {
    if (albumIds.size === 0) {
      return new Set<string>();
    }

    const accessRole =
      access === AlbumUserRole.Editor ? [AlbumUserRole.Editor] : [AlbumUserRole.Editor, AlbumUserRole.Viewer];

    return this.db
      .selectFrom('album')
      .select('album.id')
      .innerJoin('album_user', 'album_user.albumId', 'album.id')
      .innerJoin('user', (join) => join.onRef('user.id', '=', 'album_user.userId').on('user.deletedAt', 'is', null))
      .where('album.id', 'in', [...albumIds])
      .where('album.deletedAt', 'is', null)
      .where('user.id', '=', userId)
      .where('album_user.role', 'in', [...accessRole])
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, albumIds: Set<string>) {
    if (albumIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('shared_link')
      .select('shared_link.albumId')
      .where('shared_link.id', '=', sharedLinkId)
      .where('shared_link.albumId', 'in', [...albumIds])
      .execute()
      .then(
        (sharedLinks) => new Set(sharedLinks.flatMap((sharedLink) => (sharedLink.albumId ? [sharedLink.albumId] : []))),
      );
  }
}

class AssetAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumAccess(userId: string, assetIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

    const options = privacyOptions(hideNsfwAssets);
    const hiddenContent = getHiddenContentFilter(options);

    return this.db
      .with('target', (qb) => qb.selectNoFrom(sql`array[${sql.join([...assetIds])}]::uuid[]`.as('ids')))
      .selectFrom('album')
      .innerJoin('album_asset as albumAssets', 'album.id', 'albumAssets.albumId')
      .innerJoin('asset', (join) =>
        join.onRef('asset.id', '=', 'albumAssets.assetId').on('asset.deletedAt', 'is', null),
      )
      .leftJoin('album_user as albumUsers', 'albumUsers.albumId', 'album.id')
      .leftJoin('user', (join) => join.onRef('user.id', '=', 'albumUsers.userId').on('user.deletedAt', 'is', null))
      .crossJoin('target')
      .select(['asset.id', 'asset.livePhotoVideoId'])
      .$if(!!hiddenContent, (qb) =>
        qb.select(
          hiddenContentAssetIdExists(sql.ref('asset.livePhotoVideoId'), hiddenContent!).as('isLivePhotoVideoNsfw'),
        ),
      )
      .where((eb) =>
        eb.or([
          eb('asset.id', '=', sql<string>`any(target.ids)`),
          eb('asset.livePhotoVideoId', '=', sql<string>`any(target.ids)`),
        ]),
      )
      .where('user.id', '=', userId)
      .where('album.deletedAt', 'is', null)
      .$call((qb) => withHiddenContentFilter(qb, options))
      .execute()
      .then((assets) => {
        const allowedIds = new Set<string>();
        for (const asset of assets) {
          if (asset.id && assetIds.has(asset.id)) {
            allowedIds.add(asset.id);
          }
          if (
            asset.livePhotoVideoId &&
            assetIds.has(asset.livePhotoVideoId) &&
            !(hiddenContent && asset.isLivePhotoVideoNsfw)
          ) {
            allowedIds.add(asset.livePhotoVideoId);
          }
        }
        return allowedIds;
      });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(
    userId: string,
    assetIds: Set<string>,
    hasElevatedPermission: boolean | undefined,
    hideNsfwAssets?: AccessPrivacy,
  ) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('asset')
      .select('asset.id')
      .where('asset.id', 'in', [...assetIds])
      .where('asset.ownerId', '=', userId)
      .$if(!hasElevatedPermission, (eb) => eb.where('asset.visibility', '!=', AssetVisibility.Locked))
      .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets)))
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, assetIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('partner')
      .innerJoin('user as sharedBy', (join) =>
        join.onRef('sharedBy.id', '=', 'partner.sharedById').on('sharedBy.deletedAt', 'is', null),
      )
      .innerJoin('asset', (join) => join.onRef('asset.ownerId', '=', 'sharedBy.id').on('asset.deletedAt', 'is', null))
      .select('asset.id')
      .where('partner.sharedWithId', '=', userId)
      .where((eb) =>
        eb.or([
          eb('asset.visibility', '=', sql.lit(AssetVisibility.Timeline)),
          eb('asset.visibility', '=', sql.lit(AssetVisibility.Hidden)),
        ]),
      )

      .where('asset.id', 'in', [...assetIds])
      .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets)))
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, assetIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

    const options = privacyOptions(hideNsfwAssets);
    const hiddenContent = getHiddenContentFilter(options);

    return this.db
      .selectFrom('shared_link')
      .leftJoin('album', (join) => join.onRef('album.id', '=', 'shared_link.albumId').on('album.deletedAt', 'is', null))
      .leftJoin('shared_link_asset', 'shared_link_asset.sharedLinkId', 'shared_link.id')
      .leftJoin('asset', (join) =>
        join.onRef('asset.id', '=', 'shared_link_asset.assetId').on('asset.deletedAt', 'is', null),
      )
      .leftJoin('album_asset', 'album_asset.albumId', 'album.id')
      .leftJoin('asset as albumAssets', (join) =>
        join.onRef('albumAssets.id', '=', 'album_asset.assetId').on('albumAssets.deletedAt', 'is', null),
      )
      .select([
        'asset.id as assetId',
        'asset.livePhotoVideoId as assetLivePhotoVideoId',
        'albumAssets.id as albumAssetId',
        'albumAssets.livePhotoVideoId as albumAssetLivePhotoVideoId',
      ])
      .$if(!!hiddenContent, (qb) =>
        qb.select([
          hiddenContentAssetIdExists(sql.ref('asset.livePhotoVideoId'), hiddenContent!).as('isAssetLivePhotoVideoNsfw'),
          hiddenContentAssetIdExists(sql.ref('albumAssets.livePhotoVideoId'), hiddenContent!).as(
            'isAlbumAssetLivePhotoVideoNsfw',
          ),
        ]),
      )
      .where('shared_link.id', '=', sharedLinkId)
      .where(
        sql`array["asset"."id", "asset"."livePhotoVideoId", "albumAssets"."id", "albumAssets"."livePhotoVideoId"]`,
        '&&',
        sql`array[${sql.join([...assetIds])}]::uuid[] `,
      )
      .$call((qb) => withHiddenContentFilter(qb, options, 'asset'))
      .$call((qb) => withHiddenContentFilter(qb, options, 'albumAssets'))
      .execute()
      .then((rows) => {
        const allowedIds = new Set<string>();
        for (const row of rows) {
          if (row.assetId && assetIds.has(row.assetId)) {
            allowedIds.add(row.assetId);
          }
          if (
            row.assetLivePhotoVideoId &&
            assetIds.has(row.assetLivePhotoVideoId) &&
            !(hiddenContent && row.isAssetLivePhotoVideoNsfw)
          ) {
            allowedIds.add(row.assetLivePhotoVideoId);
          }
          if (row.albumAssetId && assetIds.has(row.albumAssetId)) {
            allowedIds.add(row.albumAssetId);
          }
          if (
            row.albumAssetLivePhotoVideoId &&
            assetIds.has(row.albumAssetLivePhotoVideoId) &&
            !(hiddenContent && row.isAlbumAssetLivePhotoVideoNsfw)
          ) {
            allowedIds.add(row.albumAssetLivePhotoVideoId);
          }
        }
        return allowedIds;
      });
  }
}

class AuthDeviceAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, deviceIds: Set<string>) {
    if (deviceIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('session')
      .select('session.id')
      .where('session.userId', '=', userId)
      .where('session.id', 'in', [...deviceIds])
      .execute()
      .then((tokens) => new Set(tokens.map((token) => token.id)));
  }
}

class DuplicateAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, duplicateIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (duplicateIds.size === 0) {
      return new Set<string>();
    }

    const options = privacyOptions(hideNsfwAssets);
    const hasHiddenContent = !!getHiddenContentFilter(options);

    return this.db
      .selectFrom('asset')
      .select('asset.duplicateId')
      .where('asset.duplicateId', 'in', [...duplicateIds])
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .$if(hasHiddenContent, (qb) => qb.$call(withDefaultVisibility).where('asset.stackId', 'is', null))
      .$call((qb) => withHiddenContentFilter(qb, options))
      .$narrowType<{ duplicateId: NotNull }>()
      .$if(hasHiddenContent, (qb) => qb.groupBy('asset.duplicateId').having((eb) => eb.fn.count('asset.id'), '>', 1))
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.duplicateId)));
  }
}

class NotificationAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, notificationIds: Set<string>) {
    if (notificationIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('notification')
      .select('notification.id')
      .where('notification.id', 'in', [...notificationIds])
      .where('notification.userId', '=', userId)
      .execute()
      .then((stacks) => new Set(stacks.map((stack) => stack.id)));
  }
}

class SessionAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, sessionIds: Set<string>) {
    if (sessionIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('session')
      .select('session.id')
      .where('session.id', 'in', [...sessionIds])
      .where('session.userId', '=', userId)
      .execute()
      .then((sessions) => new Set(sessions.map((session) => session.id)));
  }
}
class StackAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, stackIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (stackIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('stack')
      .select('stack.id')
      .where('stack.id', 'in', [...stackIds])
      .where('stack.ownerId', '=', userId)
      .$if(!!getHiddenContentFilter(privacyOptions(hideNsfwAssets)), (qb) =>
        qb
          .innerJoin('asset as primaryAsset', 'primaryAsset.id', 'stack.primaryAssetId')
          .where('primaryAsset.deletedAt', 'is', null)
          .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets), 'primaryAsset')),
      )
      .execute()
      .then((stacks) => new Set(stacks.map((stack) => stack.id)));
  }
}

class TimelineAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, partnerIds: Set<string>) {
    if (partnerIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('partner')
      .select('partner.sharedById')
      .where('partner.sharedById', 'in', [...partnerIds])
      .where('partner.sharedWithId', '=', userId)
      .execute()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class MemoryAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, memoryIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (memoryIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('memory')
      .select('memory.id')
      .where('memory.id', 'in', [...memoryIds])
      .where('memory.ownerId', '=', userId)
      .where('memory.deletedAt', 'is', null)
      .$if(!!getHiddenContentFilter(privacyOptions(hideNsfwAssets)), (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.not((eb) =>
              eb.exists(
                eb
                  .selectFrom('memory_asset')
                  .select('memory_asset.memoriesId')
                  .whereRef('memory_asset.memoriesId', '=', 'memory.id'),
              ),
            ),
            eb.exists(
              eb
                .selectFrom('memory_asset')
                .innerJoin('asset', 'asset.id', 'memory_asset.assetId')
                .select('memory_asset.memoriesId')
                .whereRef('memory_asset.memoriesId', '=', 'memory.id')
                .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
                .where('asset.deletedAt', 'is', null)
                .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets))),
            ),
          ]),
        ),
      )
      .execute()
      .then((memories) => new Set(memories.map((memory) => memory.id)));
  }
}

class PersonAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, personIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (personIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('person')
      .select('person.id')
      .where('person.id', 'in', [...personIds])
      .where('person.ownerId', '=', userId)
      .$if(!!getHiddenContentFilter(privacyOptions(hideNsfwAssets)), (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.not((eb) =>
              eb.exists(
                eb
                  .selectFrom('asset_face')
                  .innerJoin('asset', (join) =>
                    join
                      .onRef('asset.id', '=', 'asset_face.assetId')
                      .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
                      .on('asset.deletedAt', 'is', null),
                  )
                  .whereRef('asset_face.personId', '=', 'person.id')
                  .where('asset_face.deletedAt', 'is', null)
                  .where('asset_face.isVisible', 'is', true),
              ),
            ),
            eb.exists(
              eb
                .selectFrom('asset_face')
                .innerJoin('asset', (join) =>
                  join
                    .onRef('asset.id', '=', 'asset_face.assetId')
                    .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
                    .on('asset.deletedAt', 'is', null),
                )
                .whereRef('asset_face.personId', '=', 'person.id')
                .where('asset_face.deletedAt', 'is', null)
                .where('asset_face.isVisible', 'is', true)
                .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets))),
            ),
          ]),
        ),
      )
      .execute()
      .then((persons) => new Set(persons.map((person) => person.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkFaceOwnerAccess(userId: string, assetFaceIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (assetFaceIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('asset_face')
      .select('asset_face.id')
      .leftJoin('asset', (join) => join.onRef('asset.id', '=', 'asset_face.assetId').on('asset.deletedAt', 'is', null))
      .where('asset_face.id', 'in', [...assetFaceIds])
      .where('asset.ownerId', '=', userId)
      .$call((qb) => withHiddenContentFilter(qb, privacyOptions(hideNsfwAssets)))
      .execute()
      .then((faces) => new Set(faces.map((face) => face.id)));
  }
}

class PartnerAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkUpdateAccess(userId: string, partnerIds: Set<string>) {
    if (partnerIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('partner')
      .select('partner.sharedById')
      .where('partner.sharedById', 'in', [...partnerIds])
      .where('partner.sharedWithId', '=', userId)
      .execute()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class TagAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET, true] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, tagIds: Set<string>, hideNsfwAssets?: AccessPrivacy) {
    if (tagIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('tag')
      .select('tag.id')
      .where('tag.id', 'in', [...tagIds])
      .where('tag.userId', '=', userId)
      .$if(!!getHiddenContentFilter(privacyOptions(hideNsfwAssets)), (qb) =>
        qb.where(
          tagHasVisibleAssetOrNoAssets(sql.ref('tag.id'), getHiddenContentFilter(privacyOptions(hideNsfwAssets))),
        ),
      )
      .execute()
      .then((tags) => new Set(tags.map((tag) => tag.id)));
  }
}

class WorkflowAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, workflowIds: Set<string>) {
    if (workflowIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('workflow')
      .select('workflow.id')
      .where('workflow.id', 'in', [...workflowIds])
      .where('workflow.ownerId', '=', userId)
      .execute()
      .then((workflows) => new Set(workflows.map((workflow) => workflow.id)));
  }
}

@Injectable()
export class AccessRepository {
  activity: ActivityAccess;
  album: AlbumAccess;
  asset: AssetAccess;
  authDevice: AuthDeviceAccess;
  duplicate: DuplicateAccess;
  memory: MemoryAccess;
  notification: NotificationAccess;
  person: PersonAccess;
  partner: PartnerAccess;
  session: SessionAccess;
  stack: StackAccess;
  tag: TagAccess;
  timeline: TimelineAccess;
  workflow: WorkflowAccess;

  constructor(@InjectKysely() db: Kysely<DB>) {
    this.activity = new ActivityAccess(db);
    this.album = new AlbumAccess(db);
    this.asset = new AssetAccess(db);
    this.authDevice = new AuthDeviceAccess(db);
    this.duplicate = new DuplicateAccess(db);
    this.memory = new MemoryAccess(db);
    this.notification = new NotificationAccess(db);
    this.person = new PersonAccess(db);
    this.partner = new PartnerAccess(db);
    this.session = new SessionAccess(db);
    this.stack = new StackAccess(db);
    this.tag = new TagAccess(db);
    this.timeline = new TimelineAccess(db);
    this.workflow = new WorkflowAccess(db);
  }
}
