/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { createHash, randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import { AssetFace } from 'src/database';
import { Albums, AssetJobStatus, Assets, DB, Exif, FaceSearch, Person, Sessions } from 'src/db';
import { AuthDto } from 'src/dtos/auth.dto';
import { AlbumUserRole, AssetType, AssetVisibility, SourceType, SyncRequestType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { BASE_SERVICE_DEPENDENCIES, BaseService } from 'src/services/base.service';
import { SyncService } from 'src/services/sync.service';
import { factory, newDate, newEmbedding, newUuid } from 'test/small.factory';
import { automock, wait } from 'test/utils';
import { Mocked } from 'vitest';

interface ClassConstructor<T = any> extends Function {
  new (...args: any[]): T;
}

type MediumTestOptions = {
  mock: ClassConstructor<any>[];
  real: ClassConstructor<any>[];
  database: Kysely<DB>;
};

export const newMediumService = <S extends BaseService>(Service: ClassConstructor<S>, options: MediumTestOptions) => {
  const ctx = new MediumTestContext(Service, options);
  return { sut: ctx.sut, ctx };
};

export class MediumTestContext<S extends BaseService = BaseService> {
  private repoCache: Record<string, any> = {};
  private sutDeps: any[];

  sut: S;
  database: Kysely<DB>;

  constructor(
    Service: ClassConstructor<S>,
    private options: MediumTestOptions,
  ) {
    this.sutDeps = this.makeDeps(options);
    this.sut = new Service(...this.sutDeps);
    this.database = options.database;
  }

  private makeDeps(options: MediumTestOptions) {
    const deps = BASE_SERVICE_DEPENDENCIES;

    for (const dep of options.mock) {
      if (!deps.includes(dep)) {
        throw new Error(`Mocked repository ${dep.name} is not a valid dependency`);
      }
    }

    for (const dep of options.real) {
      if (!deps.includes(dep)) {
        throw new Error(`Real repository ${dep.name} is not a valid dependency`);
      }
    }
    return (deps as ClassConstructor<any>[]).map((dep) => {
      if (options.real.includes(dep)) {
        return this.get(dep);
      }

      if (options.mock.includes(dep)) {
        return newMockRepository(dep);
      }
    });
  }

  get<T>(key: ClassConstructor<T>): T {
    if (!this.repoCache[key.name]) {
      const real = newRealRepository(key, this.options.database);
      this.repoCache[key.name] = real;
    }

    return this.repoCache[key.name];
  }

  getMock<T, R = Mocked<T>>(key: ClassConstructor<T>): R {
    const index = BASE_SERVICE_DEPENDENCIES.indexOf(key as any);
    if (index === -1 || !this.options.mock.includes(key)) {
      throw new Error(`getMock called with a key that is not a mock: ${key.name}`);
    }

    return this.sutDeps[index] as R;
  }

  async newUser(dto: Partial<Insertable<UserTable>> = {}) {
    const user = mediumFactory.userInsert(dto);
    const result = await this.get(UserRepository).create(user);
    return { user, result };
  }

  async newPartner(dto: { sharedById: string; sharedWithId: string; inTimeline?: boolean }) {
    const partner = { inTimeline: true, ...dto };
    const result = await this.get(PartnerRepository).create(partner);
    return { partner, result };
  }

  async newAsset(dto: Partial<Insertable<Assets>> = {}) {
    const asset = mediumFactory.assetInsert(dto);
    const result = await this.get(AssetRepository).create(asset);
    return { asset, result };
  }

  async newExif(dto: Insertable<Exif>) {
    const result = await this.get(AssetRepository).upsertExif(dto);
    return { result };
  }

  async newAlbum(dto: Insertable<Albums>) {
    const album = mediumFactory.albumInsert(dto);
    const result = await this.get(AlbumRepository).create(album, [], []);
    return { album, result };
  }

  async newAlbumAsset(albumAsset: { albumId: string; assetId: string }) {
    const result = await this.get(AlbumRepository).addAssetIds(albumAsset.albumId, [albumAsset.assetId]);
    return { albumAsset, result };
  }

  async newAlbumUser(dto: { albumId: string; userId: string; role?: AlbumUserRole }) {
    const { albumId, userId, role = AlbumUserRole.EDITOR } = dto;
    const result = await this.get(AlbumUserRepository).create({ albumsId: albumId, usersId: userId, role });
    return { albumUser: { albumId, userId, role }, result };
  }

  async newJobStatus(dto: Partial<Insertable<AssetJobStatus>> & { assetId: string }) {
    const jobStatus = mediumFactory.assetJobStatusInsert({ assetId: dto.assetId });
    const result = await this.get(AssetRepository).upsertJobStatus(jobStatus);
    return { jobStatus, result };
  }

  async newPerson(dto: Partial<Insertable<Person>> & { ownerId: string }) {
    const person = mediumFactory.personInsert(dto);
    const result = await this.get(PersonRepository).create(person);
    return { person, result };
  }

  async newSession(dto: Partial<Insertable<Sessions>> & { userId: string }) {
    const session = mediumFactory.sessionInsert(dto);
    const result = await this.get(SessionRepository).create(session);
    return { session, result };
  }

  async newSyncAuthUser() {
    const { user } = await this.newUser();
    const { session } = await this.newSession({ userId: user.id });
    const auth = factory.auth({
      session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    return {
      auth,
      session,
      user,
    };
  }
}

export class SyncTestContext extends MediumTestContext<SyncService> {
  constructor(database: Kysely<DB>) {
    super(SyncService, { database, real: [SyncRepository, SessionRepository], mock: [LoggingRepository] });
  }

  async syncStream(auth: AuthDto, types: SyncRequestType[]) {
    const stream = mediumFactory.syncStream();
    // Wait for 2ms to ensure all updates are available and account for setTimeout inaccuracy
    await wait(2);
    await this.sut.stream(auth, stream, { types });

    return stream.getResponse();
  }

  async syncAckAll(auth: AuthDto, response: Array<{ type: string; ack: string }>) {
    const acks: Record<string, string> = {};
    for (const { type, ack } of response) {
      acks[type] = ack;
    }

    await this.sut.setAcks(auth, { acks: Object.values(acks) });
  }
}

const newRealRepository = <T>(key: ClassConstructor<T>, db: Kysely<DB>): T => {
  switch (key) {
    case AccessRepository:
    case AlbumRepository:
    case AlbumUserRepository:
    case ActivityRepository:
    case AssetRepository:
    case AssetJobRepository:
    case MemoryRepository:
    case NotificationRepository:
    case PartnerRepository:
    case PersonRepository:
    case SearchRepository:
    case SessionRepository:
    case SyncRepository:
    case SystemMetadataRepository:
    case UserRepository:
    case VersionHistoryRepository: {
      return new key(db);
    }

    case ConfigRepository:
    case CryptoRepository: {
      return new key();
    }

    case DatabaseRepository: {
      return new key(db, LoggingRepository.create(), new ConfigRepository());
    }

    case EmailRepository: {
      return new key(LoggingRepository.create());
    }

    case LoggingRepository as unknown as ClassConstructor<LoggingRepository>: {
      return new key() as unknown as T;
    }

    default: {
      throw new Error(`Unable to create repository instance for key: ${key?.name || key}`);
    }
  }
};

const newMockRepository = <T>(key: ClassConstructor<T>) => {
  switch (key) {
    case ActivityRepository:
    case AlbumRepository:
    case AssetRepository:
    case AssetJobRepository:
    case ConfigRepository:
    case CryptoRepository:
    case MemoryRepository:
    case NotificationRepository:
    case PartnerRepository:
    case PersonRepository:
    case SessionRepository:
    case SyncRepository:
    case SystemMetadataRepository:
    case UserRepository:
    case VersionHistoryRepository: {
      return automock(key);
    }

    case DatabaseRepository: {
      return automock(DatabaseRepository, {
        args: [undefined, { setContext: () => {} }, { getEnv: () => ({ database: { vectorExtension: '' } }) }],
      });
    }

    case EmailRepository: {
      return automock(EmailRepository, { args: [{ setContext: () => {} }] });
    }

    case JobRepository: {
      return automock(JobRepository, {
        args: [
          undefined,
          undefined,
          undefined,
          {
            setContext: () => {},
          },
        ],
      });
    }

    case LoggingRepository as unknown as ClassConstructor<T>: {
      const configMock = { getEnv: () => ({ noColor: false }) };
      return automock(LoggingRepository, { args: [undefined, configMock], strict: false });
    }

    case StorageRepository: {
      return automock(StorageRepository, { args: [{ setContext: () => {} }] });
    }

    default: {
      throw new Error(`Invalid repository key: ${key}`);
    }
  }
};

const assetInsert = (asset: Partial<Insertable<Assets>> = {}) => {
  const id = asset.id || newUuid();
  const now = newDate();
  const defaults: Insertable<Assets> = {
    deviceAssetId: '',
    deviceId: '',
    originalFileName: '',
    checksum: randomBytes(32),
    type: AssetType.IMAGE,
    originalPath: '/path/to/something.jpg',
    ownerId: '@immich.cloud',
    isFavorite: false,
    fileCreatedAt: now,
    fileModifiedAt: now,
    localDateTime: now,
    visibility: AssetVisibility.TIMELINE,
  };

  return {
    ...defaults,
    ...asset,
    id,
  };
};

const albumInsert = (album: Partial<Insertable<Albums>> & { ownerId: string }) => {
  const id = album.id || newUuid();
  const defaults: Omit<Insertable<Albums>, 'ownerId'> = {
    albumName: 'Album',
  };

  return {
    ...defaults,
    ...album,
    id,
  };
};

const faceInsert = (face: Partial<Insertable<FaceSearch>> & { faceId: string }) => {
  const defaults = {
    faceId: face.faceId,
    embedding: face.embedding || newEmbedding(),
  };
  return {
    ...defaults,
    ...face,
  };
};

const assetFaceInsert = (assetFace: Partial<AssetFace> & { assetId: string }) => {
  const defaults = {
    assetId: assetFace.assetId ?? newUuid(),
    boundingBoxX1: assetFace.boundingBoxX1 ?? 0,
    boundingBoxX2: assetFace.boundingBoxX2 ?? 1,
    boundingBoxY1: assetFace.boundingBoxY1 ?? 0,
    boundingBoxY2: assetFace.boundingBoxY2 ?? 1,
    deletedAt: assetFace.deletedAt ?? null,
    id: assetFace.id ?? newUuid(),
    imageHeight: assetFace.imageHeight ?? 10,
    imageWidth: assetFace.imageWidth ?? 10,
    personId: assetFace.personId ?? null,
    sourceType: assetFace.sourceType ?? SourceType.MACHINE_LEARNING,
  };

  return {
    ...defaults,
    ...assetFace,
  };
};

const assetJobStatusInsert = (
  job: Partial<Insertable<AssetJobStatus>> & { assetId: string },
): Insertable<AssetJobStatus> => {
  const date = DateTime.now().minus({ days: 15 }).toISO();
  const defaults: Omit<Insertable<AssetJobStatus>, 'assetId'> = {
    duplicatesDetectedAt: date,
    facesRecognizedAt: date,
    metadataExtractedAt: date,
    previewAt: date,
    thumbnailAt: date,
  };

  return {
    ...defaults,
    ...job,
  };
};

const personInsert = (person: Partial<Insertable<Person>> & { ownerId: string }) => {
  const defaults = {
    birthDate: person.birthDate || null,
    color: person.color || null,
    createdAt: person.createdAt || newDate(),
    faceAssetId: person.faceAssetId || null,
    id: person.id || newUuid(),
    isFavorite: person.isFavorite || false,
    isHidden: person.isHidden || false,
    name: person.name || 'Test Name',
    ownerId: person.ownerId || newUuid(),
    thumbnailPath: person.thumbnailPath || '/path/to/thumbnail.jpg',
    updatedAt: person.updatedAt || newDate(),
    updateId: person.updateId || newUuid(),
  };
  return {
    ...defaults,
    ...person,
  };
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('base64');

const sessionInsert = ({ id = newUuid(), userId, ...session }: Partial<Insertable<Sessions>> & { userId: string }) => {
  const defaults: Insertable<Sessions> = {
    id,
    userId,
    token: sha256(id),
  };

  return {
    ...defaults,
    ...session,
    id,
  };
};

const userInsert = (user: Partial<Insertable<UserTable>> = {}) => {
  const id = user.id || newUuid();

  const defaults: Insertable<UserTable> = {
    email: `${id}@immich.cloud`,
    name: `User ${id}`,
    deletedAt: null,
  };

  return { ...defaults, ...user, id };
};

class CustomWritable extends Writable {
  private data = '';

  _write(chunk: any, encoding: string, callback: () => void) {
    this.data += chunk.toString();
    callback();
  }

  getResponse() {
    const result = this.data;
    return result
      .split('\n')
      .filter((x) => x.length > 0)
      .map((x) => JSON.parse(x));
  }
}

const syncStream = () => {
  return new CustomWritable();
};

export const mediumFactory = {
  assetInsert,
  assetFaceInsert,
  assetJobStatusInsert,
  albumInsert,
  faceInsert,
  personInsert,
  sessionInsert,
  syncStream,
  userInsert,
};
