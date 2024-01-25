import { IAccessRepository, chunks, setUnion } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import {
  ActivityEntity,
  AlbumEntity,
  AssetEntity,
  AssetFaceEntity,
  LibraryEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  UserTokenEntity,
} from '../entities';
import { DATABASE_PARAMETER_CHUNK_SIZE, DummyValue, GenerateSql } from '../infra.util';

type IActivityAccess = IAccessRepository['activity'];
type IAlbumAccess = IAccessRepository['album'];
type IAssetAccess = IAccessRepository['asset'];
type IAuthDeviceAccess = IAccessRepository['authDevice'];
type ILibraryAccess = IAccessRepository['library'];
type ITimelineAccess = IAccessRepository['timeline'];
type IPersonAccess = IAccessRepository['person'];
type IPartnerAccess = IAccessRepository['partner'];

class ActivityAccess implements IActivityAccess {
  constructor(
    private activityRepository: Repository<ActivityEntity>,
    private albumRepository: Repository<AlbumEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(activityIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.activityRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              userId,
            },
          })
          .then((activities) => new Set(activities.map((activity) => activity.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkAlbumOwnerAccess(userId: string, activityIds: Set<string>): Promise<Set<string>> {
    if (activityIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(activityIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.activityRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              album: {
                ownerId: userId,
              },
            },
          })
          .then((activities) => new Set(activities.map((activity) => activity.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkCreateAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.albumRepository
          .createQueryBuilder('album')
          .select('album.id')
          .leftJoin('album.sharedUsers', 'sharedUsers')
          .where('album.id IN (:...albumIds)', { albumIds: idChunk })
          .andWhere('album.isActivityEnabled = true')
          .andWhere(
            new Brackets((qb) => {
              qb.where('album.ownerId = :userId', { userId }).orWhere('sharedUsers.id = :userId', { userId });
            }),
          )
          .getMany()
          .then((albums) => new Set(albums.map((album) => album.id))),
      ),
    ).then((results) => setUnion(...results));
  }
}

class AlbumAccess implements IAlbumAccess {
  constructor(
    private albumRepository: Repository<AlbumEntity>,
    private sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.albumRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              ownerId: userId,
            },
          })
          .then((albums) => new Set(albums.map((album) => album.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkSharedAlbumAccess(userId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.albumRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              sharedUsers: {
                id: userId,
              },
            },
          })
          .then((albums) => new Set(albums.map((album) => album.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkSharedLinkAccess(sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>> {
    if (albumIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.sharedLinkRepository
          .find({
            select: { albumId: true },
            where: {
              id: sharedLinkId,
              albumId: In(idChunk),
            },
          })
          .then(
            (sharedLinks) =>
              new Set(sharedLinks.flatMap((sharedLink) => (!!sharedLink.albumId ? [sharedLink.albumId] : []))),
          ),
      ),
    ).then((results) => setUnion(...results));
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
  async checkAlbumAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.albumRepository
          .createQueryBuilder('album')
          .innerJoin('album.assets', 'asset')
          .leftJoin('album.sharedUsers', 'sharedUsers')
          .select('asset.id', 'assetId')
          .addSelect('asset.livePhotoVideoId', 'livePhotoVideoId')
          .where('array["asset"."id", "asset"."livePhotoVideoId"] && array[:...assetIds]::uuid[]', {
            assetIds: idChunk,
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where('album.ownerId = :userId', { userId }).orWhere('sharedUsers.id = :userId', { userId });
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
          }),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.assetRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              ownerId: userId,
            },
            withDeleted: true,
          })
          .then((assets) => new Set(assets.map((asset) => asset.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkPartnerAccess(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.partnerRepository
          .createQueryBuilder('partner')
          .innerJoin('partner.sharedBy', 'sharedBy')
          .innerJoin('sharedBy.assets', 'asset')
          .select('asset.id', 'assetId')
          .where('partner.sharedWithId = :userId', { userId })
          .andWhere('asset.id IN (:...assetIds)', { assetIds: idChunk })
          .getRawMany()
          .then((rows) => new Set(rows.map((row) => row.assetId))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkSharedLinkAccess(sharedLinkId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.sharedLinkRepository
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
              assetIds: idChunk,
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
          }),
      ),
    ).then((results) => setUnion(...results));
  }
}

class AuthDeviceAccess implements IAuthDeviceAccess {
  constructor(private tokenRepository: Repository<UserTokenEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, deviceIds: Set<string>): Promise<Set<string>> {
    if (deviceIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(deviceIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.tokenRepository
          .find({
            select: { id: true },
            where: {
              userId,
              id: In(idChunk),
            },
          })
          .then((tokens) => new Set(tokens.map((token) => token.id))),
      ),
    ).then((results) => setUnion(...results));
  }
}

class LibraryAccess implements ILibraryAccess {
  constructor(
    private libraryRepository: Repository<LibraryEntity>,
    private partnerRepository: Repository<PartnerEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, libraryIds: Set<string>): Promise<Set<string>> {
    if (libraryIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(libraryIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.libraryRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              ownerId: userId,
            },
          })
          .then((libraries) => new Set(libraries.map((library) => library.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.partnerRepository
          .createQueryBuilder('partner')
          .select('partner.sharedById')
          .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
          .andWhere('partner.sharedWithId = :userId', { userId })
          .getMany()
          .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
      ),
    ).then((results) => setUnion(...results));
  }
}

class TimelineAccess implements ITimelineAccess {
  constructor(private partnerRepository: Repository<PartnerEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.partnerRepository
          .createQueryBuilder('partner')
          .select('partner.sharedById')
          .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
          .andWhere('partner.sharedWithId = :userId', { userId })
          .getMany()
          .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
      ),
    ).then((results) => setUnion(...results));
  }
}

class PersonAccess implements IPersonAccess {
  constructor(
    private assetFaceRepository: Repository<AssetFaceEntity>,
    private personRepository: Repository<PersonEntity>,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkOwnerAccess(userId: string, personIds: Set<string>): Promise<Set<string>> {
    if (personIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(personIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.personRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              ownerId: userId,
            },
          })
          .then((persons) => new Set(persons.map((person) => person.id))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkFaceOwnerAccess(userId: string, assetFaceIds: Set<string>): Promise<Set<string>> {
    if (assetFaceIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(assetFaceIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.assetFaceRepository
          .find({
            select: { id: true },
            where: {
              id: In(idChunk),
              asset: {
                ownerId: userId,
              },
            },
          })
          .then((faces) => new Set(faces.map((face) => face.id))),
      ),
    ).then((results) => setUnion(...results));
  }
}

class PartnerAccess implements IPartnerAccess {
  constructor(private partnerRepository: Repository<PartnerEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  async checkUpdateAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>> {
    if (partnerIds.size === 0) {
      return new Set();
    }

    return Promise.all(
      chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        this.partnerRepository
          .createQueryBuilder('partner')
          .select('partner.sharedById')
          .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
          .andWhere('partner.sharedWithId = :userId', { userId })
          .getMany()
          .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
      ),
    ).then((results) => setUnion(...results));
  }
}

export class AccessRepository implements IAccessRepository {
  activity: IActivityAccess;
  album: IAlbumAccess;
  asset: IAssetAccess;
  authDevice: IAuthDeviceAccess;
  library: ILibraryAccess;
  person: IPersonAccess;
  partner: IPartnerAccess;
  timeline: ITimelineAccess;

  constructor(
    @InjectRepository(ActivityEntity) activityRepository: Repository<ActivityEntity>,
    @InjectRepository(AssetEntity) assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) albumRepository: Repository<AlbumEntity>,
    @InjectRepository(LibraryEntity) libraryRepository: Repository<LibraryEntity>,
    @InjectRepository(PartnerEntity) partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PersonEntity) personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(SharedLinkEntity) sharedLinkRepository: Repository<SharedLinkEntity>,
    @InjectRepository(UserTokenEntity) tokenRepository: Repository<UserTokenEntity>,
  ) {
    this.activity = new ActivityAccess(activityRepository, albumRepository);
    this.album = new AlbumAccess(albumRepository, sharedLinkRepository);
    this.asset = new AssetAccess(albumRepository, assetRepository, partnerRepository, sharedLinkRepository);
    this.authDevice = new AuthDeviceAccess(tokenRepository);
    this.library = new LibraryAccess(libraryRepository, partnerRepository);
    this.person = new PersonAccess(assetFaceRepository, personRepository);
    this.partner = new PartnerAccess(partnerRepository);
    this.timeline = new TimelineAccess(partnerRepository);
  }
}
