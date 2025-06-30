import { Kysely } from 'kysely';
import { serverVersion } from 'src/constants';
import { JobName } from 'src/enum';
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
    mock: [LoggingRepository, JobRepository],
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

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.MEMORIES_CREATE });
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
