import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable } from 'node:stream';
import { PNG } from 'pngjs';
import { ImmichWorker } from 'src/enum';
import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { BaseService } from 'src/services/base.service';
import { newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
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
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
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
import { newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { newTrashRepositoryMock } from 'test/repositories/trash.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { newVersionHistoryRepositoryMock } from 'test/repositories/version-history.repository.mock';
import { newViewRepositoryMock } from 'test/repositories/view.repository.mock';
import { Readable } from 'typeorm/platform/PlatformTools';
import { Mocked, vitest } from 'vitest';

type Overrides = {
  worker?: ImmichWorker;
  metadataRepository?: IMetadataRepository;
};
type BaseServiceArgs = ConstructorParameters<typeof BaseService>;
type Constructor<Type, Args extends Array<any>> = {
  new (...deps: Args): Type;
};

export const newTestService = <T extends BaseService>(
  Service: Constructor<T, BaseServiceArgs>,
  overrides?: Overrides,
) => {
  const { metadataRepository } = overrides || {};

  const accessMock = newAccessRepositoryMock();
  const loggerMock = newLoggerRepositoryMock();
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
  const keyMock = newKeyRepositoryMock();
  const libraryMock = newLibraryRepositoryMock();
  const machineLearningMock = newMachineLearningRepositoryMock();
  const mapMock = newMapRepositoryMock();
  const mediaMock = newMediaRepositoryMock();
  const memoryMock = newMemoryRepositoryMock();
  const metadataMock = (metadataRepository || newMetadataRepositoryMock()) as Mocked<IMetadataRepository>;
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
    loggerMock,
    accessMock,
    activityMock,
    auditMock,
    albumMock,
    albumUserMock,
    assetMock,
    configMock,
    cronMock,
    cryptoMock,
    databaseMock,
    eventMock,
    jobMock,
    keyMock,
    libraryMock,
    machineLearningMock,
    mapMock,
    mediaMock,
    memoryMock,
    metadataMock,
    moveMock,
    notificationMock,
    oauthMock,
    partnerMock,
    personMock,
    processMock,
    searchMock,
    serverInfoMock,
    sessionMock,
    sharedLinkMock,
    stackMock,
    storageMock,
    systemMock,
    tagMock,
    telemetryMock,
    trashMock,
    userMock,
    versionHistoryMock,
    viewMock,
  );

  return {
    sut,
    accessMock,
    loggerMock,
    cronMock,
    cryptoMock,
    activityMock,
    auditMock,
    albumMock,
    albumUserMock,
    assetMock,
    configMock,
    databaseMock,
    eventMock,
    jobMock,
    keyMock,
    libraryMock,
    machineLearningMock,
    mapMock,
    mediaMock,
    memoryMock,
    metadataMock,
    moveMock,
    notificationMock,
    oauthMock,
    partnerMock,
    personMock,
    processMock,
    searchMock,
    serverInfoMock,
    sessionMock,
    sharedLinkMock,
    stackMock,
    storageMock,
    systemMock,
    tagMock,
    telemetryMock,
    trashMock,
    userMock,
    versionHistoryMock,
    viewMock,
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
