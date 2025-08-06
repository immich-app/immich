import { Kysely } from 'kysely';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { StorageService } from 'src/services/storage.service';
import { newMediumService } from 'test/medium.factory';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(StorageService, {
    database: db || defaultDatabase,
    real: [AssetRepository, DatabaseRepository, SystemMetadataRepository],
    mock: [StorageRepository, ConfigRepository, LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(StorageService.name, () => {
  describe('onBoostrap', () => {
    it('should work', async () => {
      const { sut, ctx } = setup();

      const configMock = ctx.getMock(ConfigRepository);
      configMock.getEnv.mockReturnValue(mockEnvData({}));

      const storageMock = ctx.getMock(StorageRepository);
      storageMock.mkdirSync.mockReturnValue(void 0);
      storageMock.existsSync.mockReturnValue(true);
      storageMock.createFile.mockResolvedValue(void 0);
      storageMock.overwriteFile.mockResolvedValue(void 0);
      storageMock.readFile.mockResolvedValue(Buffer.from('test content'));

      await expect(sut.onBootstrap()).resolves.toBeUndefined();
    });
  });
});
