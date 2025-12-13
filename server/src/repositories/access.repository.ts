import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { asUuid } from 'src/utils/database';

class ActivityAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, activityIds: Set<string>) {
    if (activityIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('activity')
      .select('activity.id')
      .where('activity.id', 'in', [...activityIds])
      .where('activity.userId', '=', userId)
      .execute()
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumOwnerAccess(userId: string, activityIds: Set<string>) {
    if (activityIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('activity')
      .select('activity.id')
      .leftJoin('album', (join) => join.onRef('activity.albumId', '=', 'album.id').on('album.deletedAt', 'is', null))
      .where('activity.id', 'in', [...activityIds])
      .whereRef('album.ownerId', '=', asUuid(userId))
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
      .leftJoin('album_user as albumUsers', 'albumUsers.albumId', 'album.id')
      .leftJoin('user', (join) => join.onRef('user.id', '=', 'albumUsers.userId').on('user.deletedAt', 'is', null))
      .where('album.id', 'in', [...albumIds])
      .where('album.isActivityEnabled', '=', true)
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('user.id', '=', userId)]))
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
      .where('album.ownerId', '=', userId)
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
      .leftJoin('album_user', 'album_user.albumId', 'album.id')
      .leftJoin('user', (join) => join.onRef('user.id', '=', 'album_user.userId').on('user.deletedAt', 'is', null))
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
  async checkAlbumAccess(userId: string, assetIds: Set<string>) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

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
      .where((eb) =>
        eb.or([
          eb('asset.id', '=', sql<string>`any(target.ids)`),
          eb('asset.livePhotoVideoId', '=', sql<string>`any(target.ids)`),
        ]),
      )
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('user.id', '=', userId)]))
      .where('album.deletedAt', 'is', null)
      .execute()
      .then((assets) => {
        const allowedIds = new Set<string>();
        for (const asset of assets) {
          if (asset.id && assetIds.has(asset.id)) {
            allowedIds.add(asset.id);
          }
          if (asset.livePhotoVideoId && assetIds.has(asset.livePhotoVideoId)) {
            allowedIds.add(asset.livePhotoVideoId);
          }
        }
        return allowedIds;
      });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, assetIds: Set<string>, hasElevatedPermission: boolean | undefined) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('asset')
      .select('asset.id')
      .where('asset.id', 'in', [...assetIds])
      .where('asset.ownerId', '=', userId)
      .$if(!hasElevatedPermission, (eb) => eb.where('asset.visibility', '!=', AssetVisibility.Locked))
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, assetIds: Set<string>) {
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
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, assetIds: Set<string>) {
    if (assetIds.size === 0) {
      return new Set<string>();
    }

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
      .where('shared_link.id', '=', sharedLinkId)
      .where(
        sql`array["asset"."id", "asset"."livePhotoVideoId", "albumAssets"."id", "albumAssets"."livePhotoVideoId"]`,
        '&&',
        sql`array[${sql.join([...assetIds])}]::uuid[] `,
      )
      .execute()
      .then((rows) => {
        const allowedIds = new Set<string>();
        for (const row of rows) {
          if (row.assetId && assetIds.has(row.assetId)) {
            allowedIds.add(row.assetId);
          }
          if (row.assetLivePhotoVideoId && assetIds.has(row.assetLivePhotoVideoId)) {
            allowedIds.add(row.assetLivePhotoVideoId);
          }
          if (row.albumAssetId && assetIds.has(row.albumAssetId)) {
            allowedIds.add(row.albumAssetId);
          }
          if (row.albumAssetLivePhotoVideoId && assetIds.has(row.albumAssetLivePhotoVideoId)) {
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, stackIds: Set<string>) {
    if (stackIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('stack')
      .select('stack.id')
      .where('stack.id', 'in', [...stackIds])
      .where('stack.ownerId', '=', userId)
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, memoryIds: Set<string>) {
    if (memoryIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('memory')
      .select('memory.id')
      .where('memory.id', 'in', [...memoryIds])
      .where('memory.ownerId', '=', userId)
      .where('memory.deletedAt', 'is', null)
      .execute()
      .then((memories) => new Set(memories.map((memory) => memory.id)));
  }
}

class PersonAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, personIds: Set<string>) {
    if (personIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('person')
      .select('person.id')
      .where('person.id', 'in', [...personIds])
      .where('person.ownerId', '=', userId)
      .execute()
      .then((persons) => new Set(persons.map((person) => person.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkFaceOwnerAccess(userId: string, assetFaceIds: Set<string>) {
    if (assetFaceIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('asset_face')
      .select('asset_face.id')
      .leftJoin('asset', (join) => join.onRef('asset.id', '=', 'asset_face.assetId').on('asset.deletedAt', 'is', null))
      .where('asset_face.id', 'in', [...assetFaceIds])
      .where('asset.ownerId', '=', userId)
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, tagIds: Set<string>) {
    if (tagIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('tag')
      .select('tag.id')
      .where('tag.id', 'in', [...tagIds])
      .where('tag.userId', '=', userId)
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
