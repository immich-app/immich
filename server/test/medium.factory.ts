/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { createHash, randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import { AssetFace } from 'src/database';
import { AuthDto, LoginResponseDto } from 'src/dtos/auth.dto';
import {
  AlbumUserRole,
  AssetType,
  AssetVisibility,
  MemoryType,
  SourceType,
  SyncEntityType,
  SyncRequestType,
} from 'src/enum';
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
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncCheckpointRepository } from 'src/repositories/sync-checkpoint.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { DB } from 'src/schema';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetJobStatusTable } from 'src/schema/tables/asset-job-status.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { SessionTable } from 'src/schema/tables/session.table';
import { StackTable } from 'src/schema/tables/stack.table';
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

  async newStack(dto: Omit<Insertable<StackTable>, 'primaryAssetId'>, assetIds: string[]) {
    const date = factory.date();
    const stack = {
      id: factory.uuid(),
      createdAt: date,
      updatedAt: date,
      ...dto,
    };

    const result = await this.get(StackRepository).create(stack, assetIds);
    return { stack: { ...stack, primaryAssetId: assetIds[0] }, result };
  }

  async newAsset(dto: Partial<Insertable<AssetTable>> = {}) {
    const asset = mediumFactory.assetInsert(dto);
    const result = await this.get(AssetRepository).create(asset);
    return { asset, result };
  }

  async newAssetFace(dto: Partial<Insertable<AssetFace>> & { assetId: string }) {
    const assetFace = mediumFactory.assetFaceInsert(dto);
    const result = await this.get(PersonRepository).createAssetFace(assetFace);
    return { assetFace, result };
  }

  async newMemory(dto: Partial<Insertable<MemoryTable>> = {}) {
    const memory = mediumFactory.memoryInsert(dto);
    const result = await this.get(MemoryRepository).create(memory, new Set<string>());
    return { memory, result };
  }

  async newMemoryAsset(dto: { memoryId: string; assetId: string }) {
    const result = await this.get(MemoryRepository).addAssetIds(dto.memoryId, [dto.assetId]);
    return { memoryAsset: dto, result };
  }

  async newExif(dto: Insertable<AssetExifTable>) {
    const result = await this.get(AssetRepository).upsertExif(dto);
    return { result };
  }

  async newAlbum(dto: Insertable<AlbumTable>) {
    const album = mediumFactory.albumInsert(dto);
    const result = await this.get(AlbumRepository).create(album, [], []);
    return { album, result };
  }

  async newAlbumAsset(albumAsset: { albumId: string; assetId: string }) {
    const result = await this.get(AlbumRepository).addAssetIds(albumAsset.albumId, [albumAsset.assetId]);
    return { albumAsset, result };
  }

  async newAlbumUser(dto: { albumId: string; userId: string; role?: AlbumUserRole }) {
    const { albumId, userId, role = AlbumUserRole.Editor } = dto;
    const result = await this.get(AlbumUserRepository).create({ albumsId: albumId, usersId: userId, role });
    return { albumUser: { albumId, userId, role }, result };
  }

  async newJobStatus(dto: Partial<Insertable<AssetJobStatusTable>> & { assetId: string }) {
    const jobStatus = mediumFactory.assetJobStatusInsert({ assetId: dto.assetId });
    const result = await this.get(AssetRepository).upsertJobStatus(jobStatus);
    return { jobStatus, result };
  }

  async newPerson(dto: Partial<Insertable<PersonTable>> & { ownerId: string }) {
    const person = mediumFactory.personInsert(dto);
    const result = await this.get(PersonRepository).create(person);
    return { person, result };
  }

  async newSession(dto: Partial<Insertable<SessionTable>> & { userId: string }) {
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
    super(SyncService, {
      database,
      real: [SyncRepository, SyncCheckpointRepository, SessionRepository],
      mock: [LoggingRepository],
    });
  }

  async syncStream(auth: AuthDto, types: SyncRequestType[], reset?: boolean) {
    const stream = mediumFactory.syncStream();
    // Wait for 2ms to ensure all updates are available and account for setTimeout inaccuracy
    await wait(2);
    await this.sut.stream(auth, stream, { types, reset });

    return stream.getResponse();
  }

  async assertSyncIsComplete(auth: AuthDto, types: SyncRequestType[]) {
    await expect(this.syncStream(auth, types)).resolves.toEqual([
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  }

  async syncAckAll(auth: AuthDto, response: Array<{ type: string; ack: string }>) {
    const acks: Record<string, string> = {};
    const syncAcks: string[] = [];
    for (const { type, ack } of response) {
      if (type === SyncEntityType.SyncAckV1) {
        syncAcks.push(ack);
        continue;
      }
      acks[type] = ack;
    }

    await this.sut.setAcks(auth, { acks: [...Object.values(acks), ...syncAcks] });
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
    case SharedLinkRepository:
    case StackRepository:
    case SyncRepository:
    case SyncCheckpointRepository:
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
    case SyncCheckpointRepository:
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

    case EventRepository: {
      return automock(EventRepository, { args: [undefined, undefined, { setContext: () => {} }] });
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

const assetInsert = (asset: Partial<Insertable<AssetTable>> = {}) => {
  const id = asset.id || newUuid();
  const now = newDate();
  const defaults: Insertable<AssetTable> = {
    deviceAssetId: '',
    deviceId: '',
    originalFileName: '',
    checksum: randomBytes(32),
    type: AssetType.Image,
    originalPath: '/path/to/something.jpg',
    ownerId: 'not-a-valid-uuid',
    isFavorite: false,
    fileCreatedAt: now,
    fileModifiedAt: now,
    localDateTime: now,
    visibility: AssetVisibility.Timeline,
  };

  return {
    ...defaults,
    ...asset,
    id,
  };
};

const albumInsert = (album: Partial<Insertable<AlbumTable>> & { ownerId: string }) => {
  const id = album.id || newUuid();
  const defaults: Omit<Insertable<AlbumTable>, 'ownerId'> = {
    albumName: 'Album',
  };

  return {
    ...defaults,
    ...album,
    id,
  };
};

const faceInsert = (face: Partial<Insertable<FaceSearchTable>> & { faceId: string }) => {
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
    sourceType: assetFace.sourceType ?? SourceType.MachineLearning,
  };

  return {
    ...defaults,
    ...assetFace,
  };
};

const assetJobStatusInsert = (
  job: Partial<Insertable<AssetJobStatusTable>> & { assetId: string },
): Insertable<AssetJobStatusTable> => {
  const date = DateTime.now().minus({ days: 15 }).toISO();
  const defaults: Omit<Insertable<AssetJobStatusTable>, 'assetId'> = {
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

const personInsert = (person: Partial<Insertable<PersonTable>> & { ownerId: string }) => {
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
  };
  return {
    ...defaults,
    ...person,
  };
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('base64');

const sessionInsert = ({
  id = newUuid(),
  userId,
  ...session
}: Partial<Insertable<SessionTable>> & { userId: string }) => {
  const defaults: Insertable<SessionTable> = {
    id,
    userId,
    isPendingSyncReset: false,
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

  const defaults = {
    email: `${id}@immich.cloud`,
    name: `User ${id}`,
    deletedAt: null,
    isAdmin: false,
    profileImagePath: '',
    profileChangedAt: newDate(),
    shouldChangePassword: true,
    storageLabel: null,
    pinCode: null,
    oauthId: '',
    avatarColor: null,
    quotaSizeInBytes: null,
    quotaUsageInBytes: 0,
  };

  return { ...defaults, ...user, id };
};

const memoryInsert = (memory: Partial<Insertable<MemoryTable>> = {}) => {
  const id = memory.id || newUuid();
  const date = newDate();

  const defaults: Insertable<MemoryTable> = {
    id,
    createdAt: date,
    updatedAt: date,
    deletedAt: null,
    type: MemoryType.OnThisDay,
    data: { year: 2025 },
    showAt: null,
    hideAt: null,
    seenAt: null,
    isSaved: false,
    memoryAt: date,
    ownerId: memory.ownerId || newUuid(),
  };

  return { ...defaults, ...memory, id };
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

const loginDetails = () => {
  return { isSecure: false, clientIp: '', deviceType: '', deviceOS: '' };
};

const loginResponse = (): LoginResponseDto => {
  const user = userInsert({});
  return {
    accessToken: 'access-token',
    userId: user.id,
    userEmail: user.email,
    name: user.name,
    profileImagePath: user.profileImagePath,
    isAdmin: user.isAdmin,
    shouldChangePassword: user.shouldChangePassword,
    isOnboarded: false,
  };
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
  memoryInsert,
  loginDetails,
  loginResponse,
};
