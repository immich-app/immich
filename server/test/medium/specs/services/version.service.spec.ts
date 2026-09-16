import { Kysely } from 'kysely';
import { serverVersion } from 'src/constants.js';
import { JobName } from 'src/enum.js';
import { CronRepository } from 'src/repositories/cron.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository.js';
import { DB } from 'src/schema/index.js';
import { VersionService } from 'src/services/version.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(VersionService, {
    database: db || defaultDatabase,
    real: [DatabaseRepository, VersionHistoryRepository],
    mock: [LoggingRepository, JobRepository, CronRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(VersionService.name, () => {
  describe('onBootstrap', () => {
    it('record the current version on startup', async () => {
      const { sut, ctx } = setup();
      const versionHistoryRepo = ctx.get(VersionHistoryRepository);

      const itemsBefore = await versionHistoryRepo.getAll();
      expect(itemsBefore).toHaveLength(0);

      await sut.onBootstrap();

      const itemsAfter = await versionHistoryRepo.getAll();
      expect(itemsAfter).toHaveLength(1);
      expect(itemsAfter[0]).toEqual({
        createdAt: expect.any(Date),
        id: expect.any(String),
        version: serverVersion.toString(),
      });
    });

    it('should queue memory creation when upgrading from 1.128.0', async () => {
      const { sut, ctx } = setup();
      const jobMock = ctx.getMock(JobRepository);
      const versionHistoryRepo = ctx.get(VersionHistoryRepository);
      jobMock.queue.mockResolvedValue(void 0);

      await versionHistoryRepo.create({ version: 'v1.128.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.MemoryGenerate });
    });

    it('should not queue memory creation when upgrading from 1.129.0', async () => {
      const { sut, ctx } = setup();
      const jobMock = ctx.getMock(JobRepository);
      const versionHistoryRepo = ctx.get(VersionHistoryRepository);

      await versionHistoryRepo.create({ version: 'v1.129.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
