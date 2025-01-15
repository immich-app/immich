import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';

import { AlbumUserRole } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';

type IActivityAccess = IAccessRepository['activity'];
type IAlbumAccess = IAccessRepository['album'];
type IAssetAccess = IAccessRepository['asset'];
type IAuthDeviceAccess = IAccessRepository['authDevice'];
type IMemoryAccess = IAccessRepository['memory'];
type IPersonAccess = IAccessRepository['person'];
type IPartnerAccess = IAccessRepository['partner'];
type IStackAccess = IAccessRepository['stack'];
type ITagAccess = IAccessRepository['tag'];
type ITimelineAccess = IAccessRepository['timeline'];

@Injectable()
class ActivityAccess implements IActivityAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
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
  async checkAlbumOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('activity')
      .select('activity.id')
      .leftJoin('albums', (join) => join.onRef('activity.albumId', '=', 'albums.id').on('albums.deletedAt', 'is', null))
      .where('activity.id', 'in', [...activityIds])
      .whereRef('albums.ownerId', '=', 'activity.userId')
      .execute()
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkCreateAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('albums')
      .select('albums.id')
      .leftJoin('albums_shared_users_users as albumUsers', 'albumUsers.albumsId', 'albums.id')
      .leftJoin('users', (join) => join.onRef('users.id', '=', 'albumUsers.usersId').on('users.deletedAt', 'is', null))
      .where('albums.id', 'in', [...albumIds])
      .where('albums.isActivityEnabled', '=', true)
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('users.id', '=', userId)]))
      .where('albums.deletedAt', 'is', null)
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }
}

class AlbumAccess implements IAlbumAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('albums')
      .select('albums.id')
      .where('albums.id', 'in', [...albumIds])
      .where('albums.ownerId', '=', userId)
      .where('albums.deletedAt', 'is', null)
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedAlbumAccess(userId: string, albumIds: Set<string>, access: AlbumUserRole): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    const accessRole =
      access === AlbumUserRole.EDITOR ? [AlbumUserRole.EDITOR] : [AlbumUserRole.EDITOR, AlbumUserRole.VIEWER];

    return this.db
      .selectFrom('albums')
      .select('albums.id')
      .leftJoin('albums_shared_users_users as albumUsers', 'albumUsers.albumsId', 'albums.id')
      .leftJoin('users', (join) => join.onRef('users.id', '=', 'albumUsers.usersId').on('users.deletedAt', 'is', null))
      .where('albums.id', 'in', [...albumIds])
      .where('albums.deletedAt', 'is', null)
      .where('users.id', '=', userId)
      .where('albumUsers.role', 'in', [...accessRole])
      .execute()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('shared_links')
      .select('shared_links.albumId')
      .where('shared_links.id', '=', sharedLinkId)
      .where('shared_links.albumId', 'in', [...albumIds])
      .execute()
      .then(
        (sharedLinks) => new Set(sharedLinks.flatMap((sharedLink) => (sharedLink.albumId ? [sharedLink.albumId] : []))),
      );
  }
}

class AssetAccess implements IAssetAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('albums')
      .innerJoin('albums_assets_assets as albumAssets', 'albums.id', 'albumAssets.albumsId')
      .innerJoin('assets', (join) =>
        join.onRef('assets.id', '=', 'albumAssets.assetsId').on('assets.deletedAt', 'is', null),
      )
      .leftJoin('albums_shared_users_users as albumUsers', 'albumUsers.albumsId', 'albums.id')
      .leftJoin('users', (join) => join.onRef('users.id', '=', 'albumUsers.usersId').on('users.deletedAt', 'is', null))
      .select(['assets.id', 'assets.livePhotoVideoId'])
      .where(
        sql`array["assets"."id", "assets"."livePhotoVideoId"]`,
        '&&',
        sql`array[${sql.join([...assetIds])}]::uuid[] `,
      )
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('users.id', '=', userId)]))
      .where('albums.deletedAt', 'is', null)
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
  async checkOwnerAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('assets')
      .select('assets.id')
      .where('assets.id', 'in', [...assetIds])
      .where('assets.ownerId', '=', userId)
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('partners as partner')
      .innerJoin('users as sharedBy', (join) =>
        join.onRef('sharedBy.id', '=', 'partner.sharedById').on('sharedBy.deletedAt', 'is', null),
      )
      .innerJoin('assets', (join) => join.onRef('assets.id', '=', 'sharedBy.id').on('assets.deletedAt', 'is', null))
      .select('assets.id')
      .where('partner.sharedWithId', '=', userId)
      .where('assets.isArchived', '=', false)
      .where('assets.id', 'in', [...assetIds])
      .execute()
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('shared_links')
      .leftJoin('albums', (join) =>
        join.onRef('albums.id', '=', 'shared_links.albumId').on('albums.deletedAt', 'is', null),
      )
      .leftJoin('shared_link__asset', 'shared_link__asset.sharedLinksId', 'shared_links.id')
      .leftJoin('assets', (join) =>
        join.onRef('assets.id', '=', 'shared_link__asset.assetsId').on('assets.deletedAt', 'is', null),
      )
      .leftJoin('albums_assets_assets', 'albums_assets_assets.albumsId', 'albums.id')
      .leftJoin('assets as albumAssets', (join) =>
        join.onRef('albumAssets.id', '=', 'albums_assets_assets.assetsId').on('albumAssets.deletedAt', 'is', null),
      )
      .select([
        'assets.id as assetId',
        'assets.livePhotoVideoId as assetLivePhotoVideoId',
        'albumAssets.id as albumAssetId',
        'albumAssets.livePhotoVideoId as albumAssetLivePhotoVideoId',
      ])
      .where('shared_links.id', '=', sharedLinkId)
      .where(
        sql`array["assets"."id", "assets"."livePhotoVideoId", "albumAssets"."id", "albumAssets"."livePhotoVideoId"]`,
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

class AuthDeviceAccess implements IAuthDeviceAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, deviceIds: Set<string>): Promise<Set<string>> {
    if (deviceIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('sessions')
      .select('sessions.id')
      .where('sessions.userId', '=', userId)
      .where('sessions.id', 'in', [...deviceIds])
      .execute()
      .then((tokens) => new Set(tokens.map((token) => token.id)));
  }
}

class StackAccess implements IStackAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, stackIds: Set<string>): Promise<Set<string>> {
    if (stackIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('asset_stack as stacks')
      .select('stacks.id')
      .where('stacks.id', 'in', [...stackIds])
      .where('stacks.ownerId', '=', userId)
      .execute()
      .then((stacks) => new Set(stacks.map((stack) => stack.id)));
  }
}

class TimelineAccess implements ITimelineAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('partners')
      .select('partners.sharedById')
      .where('partners.sharedById', 'in', [...partnerIds])
      .where('partners.sharedWithId', '=', userId)
      .execute()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class MemoryAccess implements IMemoryAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, memoryIds: Set<string>): Promise<Set<string>> {
    if (memoryIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('memories')
      .select('memories.id')
      .where('memories.id', 'in', [...memoryIds])
      .where('memories.ownerId', '=', userId)
      .execute()
      .then((memories) => new Set(memories.map((memory) => memory.id)));
  }
}

class PersonAccess implements IPersonAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, personIds: Set<string>): Promise<Set<string>> {
    if (personIds.size === 0) {
      return new Set();
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
  async checkFaceOwnerAccess(userId: string, assetFaceIds: Set<string>): Promise<Set<string>> {
    if (assetFaceIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('asset_faces')
      .select('asset_faces.id')
      .leftJoin('assets', (join) =>
        join.onRef('assets.id', '=', 'asset_faces.assetId').on('assets.deletedAt', 'is', null),
      )
      .where('asset_faces.id', 'in', [...assetFaceIds])
      .where('assets.ownerId', '=', userId)
      .execute()
      .then((faces) => new Set(faces.map((face) => face.id)));
  }
}

class PartnerAccess implements IPartnerAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkUpdateAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('partners')
      .select('partners.sharedById')
      .where('partners.sharedById', 'in', [...partnerIds])
      .where('partners.sharedWithId', '=', userId)
      .execute()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class TagAccess implements ITagAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, tagIds: Set<string>): Promise<Set<string>> {
    if (tagIds.size === 0) {
      return new Set();
    }

    return this.db
      .selectFrom('tags')
      .select('tags.id')
      .where('tags.id', 'in', [...tagIds])
      .where('tags.userId', '=', userId)
      .execute()
      .then((tags) => new Set(tags.map((tag) => tag.id)));
  }
}

export class AccessRepository implements IAccessRepository {
  activity: IActivityAccess;
  album: IAlbumAccess;
  asset: IAssetAccess;
  authDevice: IAuthDeviceAccess;
  memory: IMemoryAccess;
  person: IPersonAccess;
  partner: IPartnerAccess;
  stack: IStackAccess;
  tag: ITagAccess;
  timeline: ITimelineAccess;

  constructor(@InjectKysely() db: Kysely<DB>) {
    this.activity = new ActivityAccess(db);
    this.album = new AlbumAccess(db);
    this.asset = new AssetAccess(db);
    this.authDevice = new AuthDeviceAccess(db);
    this.memory = new MemoryAccess(db);
    this.person = new PersonAccess(db);
    this.partner = new PartnerAccess(db);
    this.stack = new StackAccess(db);
    this.tag = new TagAccess(db);
    this.timeline = new TimelineAccess(db);
  }
}
