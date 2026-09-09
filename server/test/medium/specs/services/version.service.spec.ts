import { Kysely } from 'kysely';
import { serverVersion } from 'src/constants';
import { JobName } from 'src/enum';
import { CronRepository } from 'src/repositories/cron.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { DB } from 'src/schema';
import { VersionService } from 'src/services/version.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

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

    it('should queue spatial metadata detection when upgrading from 3.1.0', async () => {
      const { sut, ctx } = setup();
      const jobMock = ctx.getMock(JobRepository);
      const versionHistoryRepo = ctx.get(VersionHistoryRepository);
      jobMock.queue.mockResolvedValue(void 0);

      await versionHistoryRepo.create({ version: 'v3.1.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.AssetDetectSpatialMetadataQueueAll });
    });

    it('should not queue spatial metadata detection when already on 3.2.0-rc.0', async () => {
      const { sut, ctx } = setup();
      const jobMock = ctx.getMock(JobRepository);
      const versionHistoryRepo = ctx.get(VersionHistoryRepository);

      await versionHistoryRepo.create({ version: 'v3.2.0-rc.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
