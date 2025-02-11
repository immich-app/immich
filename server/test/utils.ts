import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable } from 'node:stream';
import { PNG } from 'pngjs';
import { ImmichWorker } from 'src/enum';
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
import { ILoggingRepository, newLoggingRepositoryMock } from 'test/repositories/logger.repository.mock';
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
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newTagRepositoryMock } from 'test/repositories/tag.repository.mock';
import { ITelemetryRepositoryMock, newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { newTrashRepositoryMock } from 'test/repositories/trash.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { newVersionHistoryRepositoryMock } from 'test/repositories/version-history.repository.mock';
import { newViewRepositoryMock } from 'test/repositories/view.repository.mock';
import { Readable } from 'typeorm/platform/PlatformTools';
import { Mocked, vitest } from 'vitest';

type Overrides = {
  worker?: ImmichWorker;
  metadataRepository?: MetadataRepository;
};
type BaseServiceArgs = ConstructorParameters<typeof BaseService>;
type Constructor<Type, Args extends Array<any>> = {
  new (...deps: Args): Type;
};

type IAccessRepository = { [K in keyof AccessRepository]: RepositoryInterface<AccessRepository[K]> };

export type ServiceMocks = {
  access: IAccessRepositoryMock;
  activity: Mocked<RepositoryInterface<ActivityRepository>>;
  album: Mocked<RepositoryInterface<AlbumRepository>>;
  albumUser: Mocked<RepositoryInterface<AlbumUserRepository>>;
  apiKey: Mocked<RepositoryInterface<ApiKeyRepository>>;
  audit: Mocked<RepositoryInterface<AuditRepository>>;
  asset: Mocked<RepositoryInterface<AssetRepository>>;
  config: Mocked<RepositoryInterface<ConfigRepository>>;
  cron: Mocked<RepositoryInterface<CronRepository>>;
  crypto: Mocked<RepositoryInterface<CryptoRepository>>;
  database: Mocked<RepositoryInterface<DatabaseRepository>>;
  event: Mocked<RepositoryInterface<EventRepository>>;
  job: Mocked<RepositoryInterface<JobRepository>>;
  library: Mocked<RepositoryInterface<LibraryRepository>>;
  logger: Mocked<ILoggingRepository>;
  machineLearning: Mocked<RepositoryInterface<MachineLearningRepository>>;
  map: Mocked<RepositoryInterface<MapRepository>>;
  media: Mocked<RepositoryInterface<MediaRepository>>;
  memory: Mocked<RepositoryInterface<MemoryRepository>>;
  metadata: Mocked<RepositoryInterface<MetadataRepository>>;
  move: Mocked<RepositoryInterface<MoveRepository>>;
  notification: Mocked<RepositoryInterface<NotificationRepository>>;
  oauth: Mocked<RepositoryInterface<OAuthRepository>>;
  partner: Mocked<RepositoryInterface<PartnerRepository>>;
  person: Mocked<RepositoryInterface<PersonRepository>>;
  process: Mocked<RepositoryInterface<ProcessRepository>>;
  search: Mocked<RepositoryInterface<SearchRepository>>;
  serverInfo: Mocked<RepositoryInterface<ServerInfoRepository>>;
  session: Mocked<RepositoryInterface<SessionRepository>>;
  sharedLink: Mocked<RepositoryInterface<SharedLinkRepository>>;
  stack: Mocked<RepositoryInterface<StackRepository>>;
  storage: Mocked<RepositoryInterface<StorageRepository>>;
  systemMetadata: Mocked<RepositoryInterface<SystemMetadataRepository>>;
  tag: Mocked<RepositoryInterface<TagRepository>>;
  telemetry: ITelemetryRepositoryMock;
  trash: Mocked<RepositoryInterface<TrashRepository>>;
  user: Mocked<RepositoryInterface<UserRepository>>;
  versionHistory: Mocked<RepositoryInterface<VersionHistoryRepository>>;
  view: Mocked<RepositoryInterface<ViewRepository>>;
};

export const newTestService = <T extends BaseService>(
  Service: Constructor<T, BaseServiceArgs>,
  overrides?: Overrides,
) => {
  const { metadataRepository } = overrides || {};

  const accessMock = newAccessRepositoryMock();
  const loggerMock = newLoggingRepositoryMock();
  const cronMock = newCronRepositoryMock();
  const cryptoMock = newCryptoRepositoryMock();
  const activityMock = newActivityRepositoryMock();
  const auditMock = newAuditRepositoryMock();
  const albumMock = newAlbumRepositoryMock();
  const albumUserMock = newAlbumUserRepositoryMock();
  const assetMock = newAssetRepositoryMock();
  const configMock = newConfigRepositoryMock();
  const databaseMock = newDatabaseRepositoryMock();
  const eventMock = newEventRepositoryMock();
  const jobMock = newJobRepositoryMock();
  const apiKeyMock = newKeyRepositoryMock();
  const libraryMock = newLibraryRepositoryMock();
  const machineLearningMock = newMachineLearningRepositoryMock();
  const mapMock = newMapRepositoryMock();
  const mediaMock = newMediaRepositoryMock();
  const memoryMock = newMemoryRepositoryMock();
  const metadataMock = (metadataRepository || newMetadataRepositoryMock()) as Mocked<
    RepositoryInterface<MetadataRepository>
  >;
  const moveMock = newMoveRepositoryMock();
  const notificationMock = newNotificationRepositoryMock();
  const oauthMock = newOAuthRepositoryMock();
  const partnerMock = newPartnerRepositoryMock();
  const personMock = newPersonRepositoryMock();
  const processMock = newProcessRepositoryMock();
  const searchMock = newSearchRepositoryMock();
  const serverInfoMock = newServerInfoRepositoryMock();
  const sessionMock = newSessionRepositoryMock();
  const sharedLinkMock = newSharedLinkRepositoryMock();
  const stackMock = newStackRepositoryMock();
  const storageMock = newStorageRepositoryMock();
  const systemMock = newSystemMetadataRepositoryMock();
  const tagMock = newTagRepositoryMock();
  const telemetryMock = newTelemetryRepositoryMock();
  const trashMock = newTrashRepositoryMock();
  const userMock = newUserRepositoryMock();
  const versionHistoryMock = newVersionHistoryRepositoryMock();
  const viewMock = newViewRepositoryMock();

  const sut = new Service(
    loggerMock as ILoggingRepository as LoggingRepository,
    accessMock as IAccessRepository as AccessRepository,
    activityMock as RepositoryInterface<ActivityRepository> as ActivityRepository,
    auditMock as RepositoryInterface<AuditRepository> as AuditRepository,
    albumMock as RepositoryInterface<AlbumRepository> as AlbumRepository,
    albumUserMock as RepositoryInterface<AlbumUserRepository> as AlbumUserRepository,
    assetMock as RepositoryInterface<AssetRepository> as AssetRepository,
    configMock as RepositoryInterface<ConfigRepository> as ConfigRepository,
    cronMock as RepositoryInterface<CronRepository> as CronRepository,
    cryptoMock as RepositoryInterface<CryptoRepository> as CryptoRepository,
    databaseMock as RepositoryInterface<DatabaseRepository> as DatabaseRepository,
    eventMock as RepositoryInterface<EventRepository> as EventRepository,
    jobMock as RepositoryInterface<JobRepository> as JobRepository,
    apiKeyMock as RepositoryInterface<ApiKeyRepository> as ApiKeyRepository,
    libraryMock as RepositoryInterface<LibraryRepository> as LibraryRepository,
    machineLearningMock as RepositoryInterface<MachineLearningRepository> as MachineLearningRepository,
    mapMock as RepositoryInterface<MapRepository> as MapRepository,
    mediaMock as RepositoryInterface<MediaRepository> as MediaRepository,
    memoryMock as RepositoryInterface<MemoryRepository> as MemoryRepository,
    metadataMock as RepositoryInterface<MetadataRepository> as MetadataRepository,
    moveMock as RepositoryInterface<MoveRepository> as MoveRepository,
    notificationMock as RepositoryInterface<NotificationRepository> as NotificationRepository,
    oauthMock as RepositoryInterface<OAuthRepository> as OAuthRepository,
    partnerMock as RepositoryInterface<PartnerRepository> as PartnerRepository,
    personMock as RepositoryInterface<PersonRepository> as PersonRepository,
    processMock as RepositoryInterface<ProcessRepository> as ProcessRepository,
    searchMock as RepositoryInterface<SearchRepository> as SearchRepository,
    serverInfoMock as RepositoryInterface<ServerInfoRepository> as ServerInfoRepository,
    sessionMock as RepositoryInterface<SessionRepository> as SessionRepository,
    sharedLinkMock as RepositoryInterface<SharedLinkRepository> as SharedLinkRepository,
    stackMock as RepositoryInterface<StackRepository> as StackRepository,
    storageMock as RepositoryInterface<StorageRepository> as StorageRepository,
    systemMock as RepositoryInterface<SystemMetadataRepository> as SystemMetadataRepository,
    tagMock as RepositoryInterface<TagRepository> as TagRepository,
    telemetryMock as unknown as TelemetryRepository,
    trashMock as RepositoryInterface<TrashRepository> as TrashRepository,
    userMock as RepositoryInterface<UserRepository> as UserRepository,
    versionHistoryMock as RepositoryInterface<VersionHistoryRepository> as VersionHistoryRepository,
    viewMock as RepositoryInterface<ViewRepository> as ViewRepository,
  );

  return {
    sut,
    mocks: {
      access: accessMock,
      apiKey: apiKeyMock,
      cron: cronMock,
      crypto: cryptoMock,
      activity: activityMock,
      audit: auditMock,
      album: albumMock,
      albumUser: albumUserMock,
      asset: assetMock,
      config: configMock,
      database: databaseMock,
      event: eventMock,
      job: jobMock,
      library: libraryMock,
      logger: loggerMock,
      machineLearning: machineLearningMock,
      map: mapMock,
      media: mediaMock,
      memory: memoryMock,
      metadata: metadataMock,
      move: moveMock,
      notification: notificationMock,
      oauth: oauthMock,
      partner: partnerMock,
      person: personMock,
      process: processMock,
      search: searchMock,
      serverInfo: serverInfoMock,
      session: sessionMock,
      sharedLink: sharedLinkMock,
      stack: stackMock,
      storage: storageMock,
      systemMetadata: systemMock,
      tag: tagMock,
      telemetry: telemetryMock,
      trash: trashMock,
      user: userMock,
      versionHistory: versionHistoryMock,
      view: viewMock,
    } as ServiceMocks,
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
