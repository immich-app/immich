import { CallHandler, Provider, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ClassConstructor } from 'class-transformer';
import { Kysely } from 'kysely';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable } from 'node:stream';
import { PNG } from 'pngjs';
import postgres from 'postgres';
import { DB } from 'src/db';
import { AssetUploadInterceptor } from 'src/middleware/asset-upload.interceptor';
import { AuthGuard } from 'src/middleware/auth.guard';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { DownloadRepository } from 'src/repositories/download.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { AuthService } from 'src/services/auth.service';
import { BaseService } from 'src/services/base.service';
import { RepositoryInterface } from 'src/types';
import { asPostgresConnectionConfig, getKyselyConfig } from 'src/utils/database';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newMediaRepositoryMock } from 'test/repositories/media.repository.mock';
import { newMetadataRepositoryMock } from 'test/repositories/metadata.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { ITelemetryRepositoryMock, newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { Readable } from 'typeorm/platform/PlatformTools';
import { assert, Mock, Mocked, vitest } from 'vitest';

export type ControllerContext = {
  authenticate: Mock;
  getHttpServer: () => any;
  reset: () => void;
  close: () => Promise<void>;
};

export const controllerSetup = async (controller: ClassConstructor<unknown>, providers: Provider[]) => {
  const noopInterceptor = { intercept: (ctx: never, next: CallHandler<unknown>) => next.handle() };
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: LoggingRepository, useValue: LoggingRepository.create() },
      { provide: AuthService, useValue: { authenticate: vi.fn() } },
      ...providers,
    ],
  })
    .overrideInterceptor(FileUploadInterceptor)
    .useValue(noopInterceptor)
    .overrideInterceptor(AssetUploadInterceptor)
    .useValue(noopInterceptor)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  // allow the AuthController to override the AuthService itself
  const authenticate = app.get<Mocked<AuthService>>(AuthService).authenticate as Mock;

  return {
    authenticate,
    getHttpServer: () => app.getHttpServer(),
    reset: () => {
      authenticate.mockReset();
    },
    close: async () => {
      await app.close();
    },
  };
};

export type AutoMocked<T> = Mocked<T> & { resetAllMocks: () => void };

const mockFn = (label: string, { strict }: { strict: boolean }) => {
  const message = `Called a mock function without a mock implementation (${label})`;
  return vitest.fn(() => {
    {
      if (strict) {
        assert.fail(message);
      } else {
        // console.warn(message);
      }
    }
  });
};

export const mockBaseService = <T extends BaseService>(service: ClassConstructor<T>) => {
  return automock(service, { args: [{ setContext: () => {} }], strict: false });
};

export const automock = <T>(
  Dependency: ClassConstructor<T>,
  options?: {
    args?: ConstructorParameters<ClassConstructor<T>>;
    strict?: boolean;
  },
): AutoMocked<T> => {
  const mock: Record<string, unknown> = {};
  const strict = options?.strict ?? true;
  const args = options?.args ?? [];

  const mocks: Mock[] = [];

  const instance = new Dependency(...args);
  for (const property of Object.getOwnPropertyNames(Dependency.prototype)) {
    if (property === 'constructor') {
      continue;
    }

    try {
      const label = `${Dependency.name}.${property}`;
      // console.log(`Automocking ${label}`);

      const target = instance[property as keyof T];
      if (typeof target === 'function') {
        const mockImplementation = mockFn(label, { strict });
        mock[property] = mockImplementation;
        mocks.push(mockImplementation);
        continue;
      }
    } catch {
      // noop
    }
  }

  const result = mock as AutoMocked<T>;
  result.resetAllMocks = () => {
    for (const mock of mocks) {
      mock.mockReset();
    }
  };

  return result;
};

export type ServiceOverrides = {
  access: AccessRepository;
  activity: ActivityRepository;
  album: AlbumRepository;
  albumUser: AlbumUserRepository;
  apiKey: ApiKeyRepository;
  audit: AuditRepository;
  asset: AssetRepository;
  assetJob: AssetJobRepository;
  config: ConfigRepository;
  cron: CronRepository;
  crypto: CryptoRepository;
  database: DatabaseRepository;
  downloadRepository: DownloadRepository;
  email: EmailRepository;
  event: EventRepository;
  job: JobRepository;
  library: LibraryRepository;
  logger: LoggingRepository;
  machineLearning: MachineLearningRepository;
  map: MapRepository;
  media: MediaRepository;
  memory: MemoryRepository;
  metadata: MetadataRepository;
  move: MoveRepository;
  notification: NotificationRepository;
  oauth: OAuthRepository;
  partner: PartnerRepository;
  person: PersonRepository;
  process: ProcessRepository;
  search: SearchRepository;
  serverInfo: ServerInfoRepository;
  session: SessionRepository;
  sharedLink: SharedLinkRepository;
  stack: StackRepository;
  storage: StorageRepository;
  sync: SyncRepository;
  systemMetadata: SystemMetadataRepository;
  tag: TagRepository;
  telemetry: TelemetryRepository;
  trash: TrashRepository;
  user: UserRepository;
  versionHistory: VersionHistoryRepository;
  view: ViewRepository;
};

type As<T> = T extends RepositoryInterface<infer U> ? U : never;
type IAccessRepository = { [K in keyof AccessRepository]: RepositoryInterface<AccessRepository[K]> };

export type ServiceMocks = {
  [K in keyof Omit<ServiceOverrides, 'access' | 'telemetry'>]: Mocked<RepositoryInterface<ServiceOverrides[K]>>;
} & { access: IAccessRepositoryMock; telemetry: ITelemetryRepositoryMock };

type BaseServiceArgs = ConstructorParameters<typeof BaseService>;
type Constructor<Type, Args extends Array<any>> = {
  new (...deps: Args): Type;
};

export const newTestService = <T extends BaseService>(
  Service: Constructor<T, BaseServiceArgs>,
  overrides: Partial<ServiceOverrides> = {},
) => {
  const loggerMock = { setContext: () => {} };
  const configMock = { getEnv: () => ({}) };

  const mocks: ServiceMocks = {
    access: newAccessRepositoryMock(),
    // eslint-disable-next-line no-sparse-arrays
    logger: automock(LoggingRepository, { args: [, configMock], strict: false }),
    // eslint-disable-next-line no-sparse-arrays
    cron: automock(CronRepository, { args: [, loggerMock] }),
    crypto: newCryptoRepositoryMock(),
    activity: automock(ActivityRepository),
    audit: automock(AuditRepository),
    album: automock(AlbumRepository, { strict: false }),
    albumUser: automock(AlbumUserRepository),
    asset: newAssetRepositoryMock(),
    assetJob: automock(AssetJobRepository),
    config: newConfigRepositoryMock(),
    database: newDatabaseRepositoryMock(),
    downloadRepository: automock(DownloadRepository, { strict: false }),
    email: automock(EmailRepository, { args: [loggerMock] }),
    // eslint-disable-next-line no-sparse-arrays
    event: automock(EventRepository, { args: [, , loggerMock], strict: false }),
    job: newJobRepositoryMock(),
    apiKey: automock(ApiKeyRepository),
    library: automock(LibraryRepository, { strict: false }),
    machineLearning: automock(MachineLearningRepository, { args: [loggerMock], strict: false }),
    map: automock(MapRepository, { args: [undefined, undefined, { setContext: () => {} }] }),
    media: newMediaRepositoryMock(),
    memory: automock(MemoryRepository),
    metadata: newMetadataRepositoryMock(),
    move: automock(MoveRepository, { strict: false }),
    notification: automock(NotificationRepository),
    oauth: automock(OAuthRepository, { args: [loggerMock] }),
    partner: automock(PartnerRepository, { strict: false }),
    person: newPersonRepositoryMock(),
    process: automock(ProcessRepository),
    search: automock(SearchRepository, { strict: false }),
    // eslint-disable-next-line no-sparse-arrays
    serverInfo: automock(ServerInfoRepository, { args: [, loggerMock], strict: false }),
    session: automock(SessionRepository),
    sharedLink: automock(SharedLinkRepository),
    stack: automock(StackRepository),
    storage: newStorageRepositoryMock(),
    sync: automock(SyncRepository),
    systemMetadata: newSystemMetadataRepositoryMock(),
    // systemMetadata: automock(SystemMetadataRepository, { strict: false }),
    // eslint-disable-next-line no-sparse-arrays
    tag: automock(TagRepository, { args: [, loggerMock], strict: false }),
    telemetry: newTelemetryRepositoryMock(),
    trash: automock(TrashRepository),
    user: automock(UserRepository, { strict: false }),
    versionHistory: automock(VersionHistoryRepository),
    view: automock(ViewRepository),
  };

  const sut = new Service(
    overrides.logger || (mocks.logger as As<LoggingRepository>),
    overrides.access || (mocks.access as IAccessRepository as AccessRepository),
    overrides.activity || (mocks.activity as As<ActivityRepository>),
    overrides.album || (mocks.album as As<AlbumRepository>),
    overrides.albumUser || (mocks.albumUser as As<AlbumUserRepository>),
    overrides.apiKey || (mocks.apiKey as As<ApiKeyRepository>),
    overrides.asset || (mocks.asset as As<AssetRepository>),
    overrides.assetJob || (mocks.assetJob as As<AssetJobRepository>),
    overrides.audit || (mocks.audit as As<AuditRepository>),
    overrides.config || (mocks.config as As<ConfigRepository> as ConfigRepository),
    overrides.cron || (mocks.cron as As<CronRepository>),
    overrides.crypto || (mocks.crypto as As<CryptoRepository>),
    overrides.database || (mocks.database as As<DatabaseRepository>),
    overrides.downloadRepository || (mocks.downloadRepository as As<DownloadRepository>),
    overrides.email || (mocks.email as As<EmailRepository>),
    overrides.event || (mocks.event as As<EventRepository>),
    overrides.job || (mocks.job as As<JobRepository>),
    overrides.library || (mocks.library as As<LibraryRepository>),
    overrides.machineLearning || (mocks.machineLearning as As<MachineLearningRepository>),
    overrides.map || (mocks.map as As<MapRepository>),
    overrides.media || (mocks.media as As<MediaRepository>),
    overrides.memory || (mocks.memory as As<MemoryRepository>),
    overrides.metadata || (mocks.metadata as As<MetadataRepository>),
    overrides.move || (mocks.move as As<MoveRepository>),
    overrides.notification || (mocks.notification as As<NotificationRepository>),
    overrides.oauth || (mocks.oauth as As<OAuthRepository>),
    overrides.partner || (mocks.partner as As<PartnerRepository>),
    overrides.person || (mocks.person as As<PersonRepository>),
    overrides.process || (mocks.process as As<ProcessRepository>),
    overrides.search || (mocks.search as As<SearchRepository>),
    overrides.serverInfo || (mocks.serverInfo as As<ServerInfoRepository>),
    overrides.session || (mocks.session as As<SessionRepository>),
    overrides.sharedLink || (mocks.sharedLink as As<SharedLinkRepository>),
    overrides.stack || (mocks.stack as As<StackRepository>),
    overrides.storage || (mocks.storage as As<StorageRepository>),
    overrides.sync || (mocks.sync as As<SyncRepository>),
    overrides.systemMetadata || (mocks.systemMetadata as As<SystemMetadataRepository>),
    overrides.tag || (mocks.tag as As<TagRepository>),
    overrides.telemetry || (mocks.telemetry as unknown as TelemetryRepository),
    overrides.trash || (mocks.trash as As<TrashRepository>),
    overrides.user || (mocks.user as As<UserRepository>),
    overrides.versionHistory || (mocks.versionHistory as As<VersionHistoryRepository>),
    overrides.view || (mocks.view as As<ViewRepository>),
  );

  return {
    sut,
    mocks,
  };
};

const createPNG = (r: number, g: number, b: number) => {
  const image = new PNG({ width: 1, height: 1 });
  image.data[0] = r;
  image.data[1] = g;
  image.data[2] = b;
  image.data[3] = 255;
  return PNG.sync.write(image);
};

function* newPngFactory() {
  for (let r = 0; r < 255; r++) {
    for (let g = 0; g < 255; g++) {
      for (let b = 0; b < 255; b++) {
        yield createPNG(r, g, b);
      }
    }
  }
}

const pngFactory = newPngFactory();

const withDatabase = (url: string, name: string) => url.replace('/immich', `/${name}`);

export const getKyselyDB = async (suffix?: string): Promise<Kysely<DB>> => {
  const testUrl = process.env.IMMICH_TEST_POSTGRES_URL!;
  const sql = postgres({
    ...asPostgresConnectionConfig({ connectionType: 'url', url: withDatabase(testUrl, 'postgres') }),
    max: 1,
  });

  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const dbName = `immich_${suffix ?? randomSuffix}`;
  await sql.unsafe(`CREATE DATABASE ${dbName} WITH TEMPLATE immich OWNER postgres;`);

  return new Kysely<DB>(getKyselyConfig({ connectionType: 'url', url: withDatabase(testUrl, dbName) }));
};

export const newRandomImage = () => {
  const { value } = pngFactory.next();
  if (!value) {
    throw new Error('Ran out of random asset data');
  }

  return value;
};

export const mockSpawn = vitest.fn((exitCode: number, stdout: string, stderr: string, error?: unknown) => {
  return {
    stdout: new Readable({
      read() {
        this.push(stdout); // write mock data to stdout
        this.push(null); // end stream
      },
    }),
    stderr: new Readable({
      read() {
        this.push(stderr); // write mock data to stderr
        this.push(null); // end stream
      },
    }),
    stdin: new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    }),
    exitCode,
    on: vitest.fn((event, callback: any) => {
      if (event === 'close') {
        callback(0);
      }
      if (event === 'error' && error) {
        callback(error);
      }
      if (event === 'exit') {
        callback(exitCode);
      }
    }),
  } as unknown as ChildProcessWithoutNullStreams;
});

export async function* makeStream<T>(items: T[] = []): AsyncIterableIterator<T> {
  for (const item of items) {
    await Promise.resolve();
    yield item;
  }
}
