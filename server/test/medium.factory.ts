import { ClassConstructor } from 'class-transformer';
import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { AssetJobStatus, Assets, DB } from 'src/db';
import { AssetType } from 'src/enum';
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
import { SessionRepository } from 'src/repositories/session.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { BaseService } from 'src/services/base.service';
import { RepositoryInterface } from 'src/types';
import { newDate, newUuid } from 'test/small.factory';
import { automock, ServiceOverrides } from 'test/utils';
import { Mocked } from 'vitest';

// type Repositories = Omit<ServiceOverrides, 'access' | 'telemetry'>;
type Repositories = {
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
  session: SessionRepository;
  systemMetadata: SystemMetadataRepository;
  versionHistory: VersionHistoryRepository;
};
type RepositoryMocks = { [K in keyof Repositories]: Mocked<RepositoryInterface<Repositories[K]>> };
type RepositoryOptions = Partial<{ [K in keyof Repositories]: 'mock' | 'real' }>;

type ContextRepositoryMocks<R extends RepositoryOptions> = {
  [K in keyof Repositories as R[K] extends 'mock' ? K : never]: Mocked<RepositoryInterface<Repositories[K]>>;
};

type ContextRepositories<R extends RepositoryOptions> = {
  [K in keyof Repositories as R[K] extends 'real' ? K : never]: Repositories[K];
};

export type Context<R extends RepositoryOptions, S extends BaseService> = {
  sut: S;
  mocks: ContextRepositoryMocks<R>;
  repos: ContextRepositories<R>;
  getRepository<T extends keyof Repositories>(key: T): Repositories[T];
};

export const newMediumService = <R extends RepositoryOptions, S extends BaseService>(
  Service: ClassConstructor<S>,
  options: {
    database: Kysely<DB>;
    repos: R;
  },
): Context<R, S> => {
  const repos: Partial<Repositories> = {};
  const mocks: Partial<RepositoryMocks> = {};

  const loggerMock = getRepositoryMock('logger') as Mocked<LoggingRepository>;
  loggerMock.setContext.mockImplementation(() => {});
  repos.logger = loggerMock;

  for (const [_key, type] of Object.entries(options.repos)) {
    if (type === 'real') {
      const key = _key as keyof Repositories;
      repos[key] = getRepository(key, options.database) as any;
      continue;
    }

    if (type === 'mock') {
      const key = _key as keyof RepositoryMocks;
      mocks[key] = getRepositoryMock(key) as any;
      continue;
    }
  }

  const makeRepository = <K extends keyof Repositories>(key: K) => {
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

export const getRepository = <K extends keyof Repositories>(key: K, db: Kysely<DB>) => {
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

    case 'session': {
      return new SessionRepository(db);
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

const getRepositoryMock = <K extends keyof Repositories>(key: K) => {
  switch (key) {
    case 'activity': {
      return automock(ActivityRepository);
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

    case 'session': {
      return automock(SessionRepository);
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
    repositories.person,
    repositories.process,
    repositories.search,
    repositories.serverInfo,
    repositories.session || getRepositoryMock('session'),
    repositories.sharedLink,
    repositories.stack,
    repositories.storage,
    repositories.sync,
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

const userInsert = (user: Partial<Insertable<UserTable>> = {}) => {
  const id = user.id || newUuid();

  const defaults: Insertable<UserTable> = {
    email: `${id}@immich.cloud`,
    name: `User ${id}`,
    deletedAt: null,
  };

  return { ...defaults, ...user, id };
};

export const mediumFactory = {
  assetInsert,
  assetJobStatusInsert,
  userInsert,
};
