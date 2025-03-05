import { Kysely, sql } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable } from 'node:stream';
import { parse } from 'pg-connection-string';
import { PNG } from 'pngjs';
import postgres, { Notice } from 'postgres';
import { DB } from 'src/db';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
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
import { BaseService } from 'src/services/base.service';
import { RepositoryInterface } from 'src/types';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newActivityRepositoryMock } from 'test/repositories/activity.repository.mock';
import { newAlbumUserRepositoryMock } from 'test/repositories/album-user.repository.mock';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newKeyRepositoryMock } from 'test/repositories/api-key.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newAuditRepositoryMock } from 'test/repositories/audit.repository.mock';
import { newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
import { newCronRepositoryMock } from 'test/repositories/cron.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLibraryRepositoryMock } from 'test/repositories/library.repository.mock';
import { newLoggingRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMachineLearningRepositoryMock } from 'test/repositories/machine-learning.repository.mock';
import { newMapRepositoryMock } from 'test/repositories/map.repository.mock';
import { newMediaRepositoryMock } from 'test/repositories/media.repository.mock';
import { newMemoryRepositoryMock } from 'test/repositories/memory.repository.mock';
import { newMetadataRepositoryMock } from 'test/repositories/metadata.repository.mock';
import { newMoveRepositoryMock } from 'test/repositories/move.repository.mock';
import { newNotificationRepositoryMock } from 'test/repositories/notification.repository.mock';
import { newOAuthRepositoryMock } from 'test/repositories/oauth.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newProcessRepositoryMock } from 'test/repositories/process.repository.mock';
import { newSearchRepositoryMock } from 'test/repositories/search.repository.mock';
import { newServerInfoRepositoryMock } from 'test/repositories/server-info.repository.mock';
import { newSessionRepositoryMock } from 'test/repositories/session.repository.mock';
import { newSharedLinkRepositoryMock } from 'test/repositories/shared-link.repository.mock';
import { newStackRepositoryMock } from 'test/repositories/stack.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSyncRepositoryMock } from 'test/repositories/sync.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newTagRepositoryMock } from 'test/repositories/tag.repository.mock';
import { ITelemetryRepositoryMock, newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { newTrashRepositoryMock } from 'test/repositories/trash.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { newVersionHistoryRepositoryMock } from 'test/repositories/version-history.repository.mock';
import { newViewRepositoryMock } from 'test/repositories/view.repository.mock';
import { Readable } from 'typeorm/platform/PlatformTools';
import { Mocked, vitest } from 'vitest';

export type ServiceOverrides = {
  access: AccessRepository;
  activity: ActivityRepository;
  album: AlbumRepository;
  albumUser: AlbumUserRepository;
  apiKey: ApiKeyRepository;
  audit: AuditRepository;
  asset: AssetRepository;
  config: ConfigRepository;
  cron: CronRepository;
  crypto: CryptoRepository;
  database: DatabaseRepository;
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
  const mocks: ServiceMocks = {
    access: newAccessRepositoryMock(),
    logger: newLoggingRepositoryMock(),
    cron: newCronRepositoryMock(),
    crypto: newCryptoRepositoryMock(),
    activity: newActivityRepositoryMock(),
    audit: newAuditRepositoryMock(),
    album: newAlbumRepositoryMock(),
    albumUser: newAlbumUserRepositoryMock(),
    asset: newAssetRepositoryMock(),
    config: newConfigRepositoryMock(),
    database: newDatabaseRepositoryMock(),
    event: newEventRepositoryMock(),
    job: newJobRepositoryMock(),
    apiKey: newKeyRepositoryMock(),
    library: newLibraryRepositoryMock(),
    machineLearning: newMachineLearningRepositoryMock(),
    map: newMapRepositoryMock(),
    media: newMediaRepositoryMock(),
    memory: newMemoryRepositoryMock(),
    metadata: newMetadataRepositoryMock(),
    move: newMoveRepositoryMock(),
    notification: newNotificationRepositoryMock(),
    oauth: newOAuthRepositoryMock(),
    partner: newPartnerRepositoryMock(),
    person: newPersonRepositoryMock(),
    process: newProcessRepositoryMock(),
    search: newSearchRepositoryMock(),
    serverInfo: newServerInfoRepositoryMock(),
    session: newSessionRepositoryMock(),
    sharedLink: newSharedLinkRepositoryMock(),
    stack: newStackRepositoryMock(),
    storage: newStorageRepositoryMock(),
    sync: newSyncRepositoryMock(),
    systemMetadata: newSystemMetadataRepositoryMock(),
    tag: newTagRepositoryMock(),
    telemetry: newTelemetryRepositoryMock(),
    trash: newTrashRepositoryMock(),
    user: newUserRepositoryMock(),
    versionHistory: newVersionHistoryRepositoryMock(),
    view: newViewRepositoryMock(),
  };

  const sut = new Service(
    overrides.logger || (mocks.logger as As<LoggingRepository>),
    overrides.access || (mocks.access as IAccessRepository as AccessRepository),
    overrides.activity || (mocks.activity as As<ActivityRepository>),
    overrides.album || (mocks.album as As<AlbumRepository>),
    overrides.albumUser || (mocks.albumUser as As<AlbumUserRepository>),
    overrides.apiKey || (mocks.apiKey as As<ApiKeyRepository>),
    overrides.asset || (mocks.asset as As<AssetRepository>),
    overrides.audit || (mocks.audit as As<AuditRepository>),
    overrides.config || (mocks.config as As<ConfigRepository> as ConfigRepository),
    overrides.cron || (mocks.cron as As<CronRepository>),
    overrides.crypto || (mocks.crypto as As<CryptoRepository>),
    overrides.database || (mocks.database as As<DatabaseRepository>),
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

export const getKyselyDB = async (suffix?: string): Promise<Kysely<DB>> => {
  const parsed = parse(process.env.IMMICH_TEST_POSTGRES_URL!);

  const parsedOptions = {
    ...parsed,
    ssl: false,
    host: parsed.host ?? undefined,
    port: parsed.port ? Number(parsed.port) : undefined,
    database: parsed.database ?? undefined,
  };

  const driverOptions = {
    ...parsedOptions,
    onnotice: (notice: Notice) => {
      if (notice['severity'] !== 'NOTICE') {
        console.warn('Postgres notice:', notice);
      }
    },
    max: 10,
    types: {
      date: {
        to: 1184,
        from: [1082, 1114, 1184],
        serialize: (x: Date | string) => (x instanceof Date ? x.toISOString() : x),
        parse: (x: string) => new Date(x),
      },
      bigint: {
        to: 20,
        from: [20],
        parse: (value: string) => Number.parseInt(value),
        serialize: (value: number) => value.toString(),
      },
    },
    connection: {
      TimeZone: 'UTC',
    },
  };

  const kysely = new Kysely<DB>({
    dialect: new PostgresJSDialect({ postgres: postgres({ ...driverOptions, max: 1, database: 'postgres' }) }),
  });
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const dbName = `immich_${suffix ?? randomSuffix}`;

  await sql.raw(`CREATE DATABASE ${dbName} WITH TEMPLATE immich OWNER postgres;`).execute(kysely);

  return new Kysely<DB>({
    dialect: new PostgresJSDialect({ postgres: postgres({ ...driverOptions, database: dbName }) }),
  });
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
