import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { ActivityEntity } from 'src/entities/activity.entity';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { MemoryEntity } from 'src/entities/memory.entity';
import { PartnerEntity } from 'src/entities/partner.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SessionEntity } from 'src/entities/session.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { AlbumUserRole } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { Brackets, In, Repository } from 'typeorm';

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
  constructor(
    private activityRepository: Repository<ActivityEntity>,
    private albumRepository: Repository<AlbumEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
    }

    return this.activityRepository
      .find({
        select: { id: true },
        where: {
          id: In([...activityIds]),
          userId,
        },
      })
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
    }

    return this.activityRepository
      .find({
        select: { id: true },
        where: {
          id: In([...activityIds]),
          album: {
            ownerId: userId,
          },
        },
      })
      .then((activities) => new Set(activities.map((activity) => activity.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkCreateAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.albumRepository
      .createQueryBuilder('album')
      .select('album.id')
      .leftJoin('album.albumUsers', 'album_albumUsers_users')
      .leftJoin('album_albumUsers_users.user', 'albumUsers')
      .where('album.id IN (:...albumIds)', { albumIds: [...albumIds] })
      .andWhere('album.isActivityEnabled = true')
      .andWhere(
        new Brackets((qb) => {
          qb.where('album.ownerId = :userId', { userId }).orWhere('albumUsers.id = :userId', { userId });
        }),
      )
      .getMany()
      .then((albums) => new Set(albums.map((album) => album.id)));
  }
}

class AlbumAccess implements IAlbumAccess {
  constructor(
    private albumRepository: Repository<AlbumEntity>,
    private sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.albumRepository
      .find({
        select: { id: true },
        where: {
          id: In([...albumIds]),
          ownerId: userId,
        },
      })
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedAlbumAccess(userId: string, albumIds: Set<string>, access: AlbumUserRole): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.albumRepository
      .find({
        select: { id: true },
        where: {
          id: In([...albumIds]),
          albumUsers: {
            user: { id: userId },
            // If editor access is needed we check for it, otherwise both are accepted
            role:
              access === AlbumUserRole.EDITOR ? AlbumUserRole.EDITOR : In([AlbumUserRole.EDITOR, AlbumUserRole.VIEWER]),
          },
        },
      })
      .then((albums) => new Set(albums.map((album) => album.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return this.sharedLinkRepository
      .find({
        select: { albumId: true },
        where: {
          id: sharedLinkId,
          albumId: In([...albumIds]),
        },
      })
      .then(
        (sharedLinks) => new Set(sharedLinks.flatMap((sharedLink) => (sharedLink.albumId ? [sharedLink.albumId] : []))),
      );
  }
}

class AssetAccess implements IAssetAccess {
  constructor(
    private albumRepository: Repository<AlbumEntity>,
    private assetRepository: Repository<AssetEntity>,
    private partnerRepository: Repository<PartnerEntity>,
    private sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkAlbumAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.albumRepository
      .createQueryBuilder('album')
      .innerJoin('album.assets', 'asset')
      .leftJoin('album.albumUsers', 'album_albumUsers_users')
      .leftJoin('album_albumUsers_users.user', 'albumUsers')
      .select('asset.id', 'assetId')
      .addSelect('asset.livePhotoVideoId', 'livePhotoVideoId')
      .where('array["asset"."id", "asset"."livePhotoVideoId"] && array[:...assetIds]::uuid[]', {
        assetIds: [...assetIds],
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('album.ownerId = :userId', { userId }).orWhere('albumUsers.id = :userId', { userId });
        }),
      )
      .getRawMany()
      .then((rows) => {
        const allowedIds = new Set<string>();
        for (const row of rows) {
          if (row.assetId && assetIds.has(row.assetId)) {
            allowedIds.add(row.assetId);
          }
          if (row.livePhotoVideoId && assetIds.has(row.livePhotoVideoId)) {
            allowedIds.add(row.livePhotoVideoId);
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

    return this.assetRepository
      .find({
        select: { id: true },
        where: {
          id: In([...assetIds]),
          ownerId: userId,
        },
        withDeleted: true,
      })
      .then((assets) => new Set(assets.map((asset) => asset.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.partnerRepository
      .createQueryBuilder('partner')
      .innerJoin('partner.sharedBy', 'sharedBy')
      .innerJoin('sharedBy.assets', 'asset')
      .select('asset.id', 'assetId')
      .where('partner.sharedWithId = :userId', { userId })
      .andWhere('asset.isArchived = false')
      .andWhere('asset.id IN (:...assetIds)', { assetIds: [...assetIds] })
      .getRawMany()
      .then((rows) => new Set(rows.map((row) => row.assetId)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkSharedLinkAccess(sharedLinkId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return this.sharedLinkRepository
      .createQueryBuilder('sharedLink')
      .leftJoin('sharedLink.album', 'album')
      .leftJoin('sharedLink.assets', 'assets')
      .leftJoin('album.assets', 'albumAssets')
      .select('assets.id', 'assetId')
      .addSelect('albumAssets.id', 'albumAssetId')
      .addSelect('assets.livePhotoVideoId', 'assetLivePhotoVideoId')
      .addSelect('albumAssets.livePhotoVideoId', 'albumAssetLivePhotoVideoId')
      .where('sharedLink.id = :sharedLinkId', { sharedLinkId })
      .andWhere(
        'array["assets"."id", "assets"."livePhotoVideoId", "albumAssets"."id", "albumAssets"."livePhotoVideoId"] && array[:...assetIds]::uuid[]',
        {
          assetIds: [...assetIds],
        },
      )
      .getRawMany()
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
  constructor(private sessionRepository: Repository<SessionEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, deviceIds: Set<string>): Promise<Set<string>> {
    if (deviceIds.size === 0) {
      return new Set();
    }

    return this.sessionRepository
      .find({
        select: { id: true },
        where: {
          userId,
          id: In([...deviceIds]),
        },
      })
      .then((tokens) => new Set(tokens.map((token) => token.id)));
  }
}

class StackAccess implements IStackAccess {
  constructor(private stackRepository: Repository<StackEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, stackIds: Set<string>): Promise<Set<string>> {
    if (stackIds.size === 0) {
      return new Set();
    }

    return this.stackRepository
      .find({
        select: { id: true },
        where: {
          id: In([...stackIds]),
          ownerId: userId,
        },
      })
      .then((stacks) => new Set(stacks.map((stack) => stack.id)));
  }
}

class TimelineAccess implements ITimelineAccess {
  constructor(private partnerRepository: Repository<PartnerEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return this.partnerRepository
      .createQueryBuilder('partner')
      .select('partner.sharedById')
      .where('partner.sharedById IN (:...partnerIds)', { partnerIds: [...partnerIds] })
      .andWhere('partner.sharedWithId = :userId', { userId })
      .getMany()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class MemoryAccess implements IMemoryAccess {
  constructor(private memoryRepository: Repository<MemoryEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, memoryIds: Set<string>): Promise<Set<string>> {
    if (memoryIds.size === 0) {
      return new Set();
    }

    return this.memoryRepository
      .find({
        select: { id: true },
        where: {
          id: In([...memoryIds]),
          ownerId: userId,
        },
      })
      .then((memories) => new Set(memories.map((memory) => memory.id)));
  }
}

class PersonAccess implements IPersonAccess {
  constructor(
    private assetFaceRepository: Repository<AssetFaceEntity>,
    private personRepository: Repository<PersonEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, personIds: Set<string>): Promise<Set<string>> {
    if (personIds.size === 0) {
      return new Set();
    }

    return this.personRepository
      .find({
        select: { id: true },
        where: {
          id: In([...personIds]),
          ownerId: userId,
        },
      })
      .then((persons) => new Set(persons.map((person) => person.id)));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkFaceOwnerAccess(userId: string, assetFaceIds: Set<string>): Promise<Set<string>> {
    if (assetFaceIds.size === 0) {
      return new Set();
    }

    return this.assetFaceRepository
      .find({
        select: { id: true },
        where: {
          id: In([...assetFaceIds]),
          asset: {
            ownerId: userId,
          },
        },
      })
      .then((faces) => new Set(faces.map((face) => face.id)));
  }
}

class PartnerAccess implements IPartnerAccess {
  constructor(private partnerRepository: Repository<PartnerEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkUpdateAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return this.partnerRepository
      .createQueryBuilder('partner')
      .select('partner.sharedById')
      .where('partner.sharedById IN (:...partnerIds)', { partnerIds: [...partnerIds] })
      .andWhere('partner.sharedWithId = :userId', { userId })
      .getMany()
      .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
  }
}

class TagAccess implements ITagAccess {
  constructor(private tagRepository: Repository<TagEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkOwnerAccess(userId: string, tagIds: Set<string>): Promise<Set<string>> {
    if (tagIds.size === 0) {
      return new Set();
    }

    return this.tagRepository
      .find({
        select: { id: true },
        where: {
          id: In([...tagIds]),
          userId,
        },
      })
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

  constructor(
    @InjectRepository(ActivityEntity) activityRepository: Repository<ActivityEntity>,
    @InjectRepository(AssetEntity) assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) albumRepository: Repository<AlbumEntity>,
    @InjectRepository(LibraryEntity) libraryRepository: Repository<LibraryEntity>,
    @InjectRepository(MemoryEntity) memoryRepository: Repository<MemoryEntity>,
    @InjectRepository(PartnerEntity) partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PersonEntity) personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(SharedLinkEntity) sharedLinkRepository: Repository<SharedLinkEntity>,
    @InjectRepository(SessionEntity) sessionRepository: Repository<SessionEntity>,
    @InjectRepository(StackEntity) stackRepository: Repository<StackEntity>,
    @InjectRepository(TagEntity) tagRepository: Repository<TagEntity>,
  ) {
    this.activity = new ActivityAccess(activityRepository, albumRepository);
    this.album = new AlbumAccess(albumRepository, sharedLinkRepository);
    this.asset = new AssetAccess(albumRepository, assetRepository, partnerRepository, sharedLinkRepository);
    this.authDevice = new AuthDeviceAccess(sessionRepository);
    this.memory = new MemoryAccess(memoryRepository);
    this.person = new PersonAccess(assetFaceRepository, personRepository);
    this.partner = new PartnerAccess(partnerRepository);
    this.stack = new StackAccess(stackRepository);
    this.tag = new TagAccess(tagRepository);
    this.timeline = new TimelineAccess(partnerRepository);
  }
}
