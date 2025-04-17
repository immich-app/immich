import { ClassConstructor } from 'class-transformer';
import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { createHash, randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import { AssetFace } from 'src/database';
import { AssetJobStatus, Assets, DB, FaceSearch, Person, Sessions } from 'src/db';
import { AssetType, SourceType } from 'src/enum';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { BaseService } from 'src/services/base.service';
import { RepositoryInterface } from 'src/types';
import { newDate, newEmbedding, newUuid } from 'test/small.factory';
import { automock, ServiceOverrides } from 'test/utils';
import { Mocked } from 'vitest';

const sha256 = (value: string) => createHash('sha256').update(value).digest('base64');

// type Repositories = Omit<ServiceOverrides, 'access' | 'telemetry'>;
type RepositoriesTypes = {
  activity: ActivityRepository;
  album: AlbumRepository;
  asset: AssetRepository;
  assetJob: AssetJobRepository;
  config: ConfigRepository;
  crypto: CryptoRepository;
  database: DatabaseRepository;
  job: JobRepository;
  user: UserRepository;
  logger: LoggingRepository;
  memory: MemoryRepository;
  partner: PartnerRepository;
  person: PersonRepository;
  search: SearchRepository;
  session: SessionRepository;
  sync: SyncRepository;
  systemMetadata: SystemMetadataRepository;
  versionHistory: VersionHistoryRepository;
};
type RepositoryMocks = { [K in keyof RepositoriesTypes]: Mocked<RepositoryInterface<RepositoriesTypes[K]>> };
type RepositoryOptions = Partial<{ [K in keyof RepositoriesTypes]: 'mock' | 'real' }>;

type ContextRepositoryMocks<R extends RepositoryOptions> = {
  [K in keyof RepositoriesTypes as R[K] extends 'mock' ? K : never]: Mocked<RepositoryInterface<RepositoriesTypes[K]>>;
};

type ContextRepositories<R extends RepositoryOptions> = {
  [K in keyof RepositoriesTypes as R[K] extends 'real' ? K : never]: RepositoriesTypes[K];
};

export type Context<R extends RepositoryOptions, S extends BaseService> = {
  sut: S;
  mocks: ContextRepositoryMocks<R>;
  repos: ContextRepositories<R>;
  getRepository<T extends keyof RepositoriesTypes>(key: T): RepositoriesTypes[T];
};

export const newMediumService = <R extends RepositoryOptions, S extends BaseService>(
  Service: ClassConstructor<S>,
  options: {
    database: Kysely<DB>;
    repos: R;
  },
): Context<R, S> => {
  const repos: Partial<RepositoriesTypes> = {};
  const mocks: Partial<RepositoryMocks> = {};

  const loggerMock = getRepositoryMock('logger') as Mocked<LoggingRepository>;
  loggerMock.setContext.mockImplementation(() => {});
  repos.logger = loggerMock;

  for (const [_key, type] of Object.entries(options.repos)) {
    if (type === 'real') {
      const key = _key as keyof RepositoriesTypes;
      repos[key] = getRepository(key, options.database) as any;
      continue;
    }

    if (type === 'mock') {
      const key = _key as keyof RepositoryMocks;
      mocks[key] = getRepositoryMock(key) as any;
      continue;
    }
  }

  const makeRepository = <K extends keyof RepositoriesTypes>(key: K) => {
    return repos[key] || getRepository(key, options.database);
  };

  const deps = asDeps({ ...mocks, ...repos } as ServiceOverrides);
  const sut = new Service(...deps);

  return {
    sut,
    mocks,
    repos,
    getRepository: makeRepository,
  } as Context<R, S>;
};

export const getRepository = <K extends keyof RepositoriesTypes>(key: K, db: Kysely<DB>) => {
  switch (key) {
    case 'activity': {
      return new ActivityRepository(db);
    }

    case 'asset': {
      return new AssetRepository(db);
    }

    case 'assetJob': {
      return new AssetJobRepository(db);
    }

    case 'config': {
      return new ConfigRepository();
    }

    case 'crypto': {
      return new CryptoRepository();
    }

    case 'database': {
      const configRepo = new ConfigRepository();
      return new DatabaseRepository(db, new LoggingRepository(undefined, configRepo), configRepo);
    }

    case 'logger': {
      const configMock = { getEnv: () => ({ noColor: false }) };
      return new LoggingRepository(undefined, configMock as ConfigRepository);
    }

    case 'memory': {
      return new MemoryRepository(db);
    }

    case 'partner': {
      return new PartnerRepository(db);
    }

    case 'person': {
      return new PersonRepository(db);
    }

    case 'search': {
      return new SearchRepository(db);
    }

    case 'session': {
      return new SessionRepository(db);
    }

    case 'sync': {
      return new SyncRepository(db);
    }

    case 'systemMetadata': {
      return new SystemMetadataRepository(db);
    }

    case 'user': {
      return new UserRepository(db);
    }

    case 'versionHistory': {
      return new VersionHistoryRepository(db);
    }

    default: {
      throw new Error(`Invalid repository key: ${key}`);
    }
  }
};

const getRepositoryMock = <K extends keyof RepositoryMocks>(key: K) => {
  switch (key) {
    case 'activity': {
      return automock(ActivityRepository) as Mocked<RepositoryInterface<ActivityRepository>>;
    }

    case 'album': {
      return automock(AlbumRepository);
    }

    case 'asset': {
      return automock(AssetRepository);
    }

    case 'assetJob': {
      return automock(AssetJobRepository);
    }

    case 'config': {
      return automock(ConfigRepository);
    }

    case 'crypto': {
      return automock(CryptoRepository);
    }

    case 'database': {
      return automock(DatabaseRepository, {
        args: [undefined, { setContext: () => {} }, { getEnv: () => ({ database: { vectorExtension: '' } }) }],
      });
    }

    case 'job': {
      return automock(JobRepository, { args: [undefined, undefined, undefined, { setContext: () => {} }] });
    }

    case 'logger': {
      const configMock = { getEnv: () => ({ noColor: false }) };
      return automock(LoggingRepository, { args: [undefined, configMock], strict: false });
    }

    case 'memory': {
      return automock(MemoryRepository);
    }

    case 'partner': {
      return automock(PartnerRepository);
    }

    case 'person': {
      return automock(PersonRepository);
    }

    case 'session': {
      return automock(SessionRepository);
    }

    case 'sync': {
      return automock(SyncRepository);
    }

    case 'systemMetadata': {
      return automock(SystemMetadataRepository);
    }

    case 'user': {
      return automock(UserRepository);
    }

    case 'versionHistory': {
      return automock(VersionHistoryRepository);
    }

    default: {
      throw new Error(`Invalid repository key: ${key}`);
    }
  }
};

export const asDeps = (repositories: ServiceOverrides) => {
  return [
    repositories.logger || getRepositoryMock('logger'), // logger
    repositories.access, // access
    repositories.activity || getRepositoryMock('activity'),
    repositories.album || getRepositoryMock('album'),
    repositories.albumUser,
    repositories.apiKey,
    repositories.asset || getRepositoryMock('asset'),
    repositories.assetJob || getRepositoryMock('assetJob'),
    repositories.audit,
    repositories.config || getRepositoryMock('config'),
    repositories.cron,
    repositories.crypto || getRepositoryMock('crypto'),
    repositories.database || getRepositoryMock('database'),
    repositories.downloadRepository,
    repositories.event,
    repositories.job || getRepositoryMock('job'),
    repositories.library,
    repositories.machineLearning,
    repositories.map,
    repositories.media,
    repositories.memory || getRepositoryMock('memory'),
    repositories.metadata,
    repositories.move,
    repositories.notification,
    repositories.oauth,
    repositories.partner || getRepositoryMock('partner'),
    repositories.person || getRepositoryMock('person'),
    repositories.process,
    repositories.search,
    repositories.serverInfo,
    repositories.session || getRepositoryMock('session'),
    repositories.sharedLink,
    repositories.stack,
    repositories.storage,
    repositories.sync || getRepositoryMock('sync'),
    repositories.systemMetadata || getRepositoryMock('systemMetadata'),
    repositories.tag,
    repositories.telemetry,
    repositories.trash,
    repositories.user,
    repositories.versionHistory || getRepositoryMock('versionHistory'),
    repositories.view,
  ];
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
    isVisible: true,
    isFavorite: false,
    fileCreatedAt: now,
    fileModifiedAt: now,
    localDateTime: now,
  };

  return {
    ...defaults,
    ...asset,
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
  faceInsert,
  personInsert,
  sessionInsert,
  syncStream,
  userInsert,
};
