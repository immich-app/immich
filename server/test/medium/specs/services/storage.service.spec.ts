import { Kysely } from 'kysely';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { DB } from 'src/schema/index.js';
import { StorageService } from 'src/services/storage.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { mockEnvData } from 'test/repositories/config.repository.mock.js';
import { getKyselyDB } from 'test/utils.js';

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
