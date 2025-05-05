import { Kysely } from 'kysely';
import { serverVersion } from 'src/constants';
import { DB } from 'src/db';
import { JobName } from 'src/enum';
import { VersionService } from 'src/services/version.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

describe(VersionService.name, () => {
  let defaultDatabase: Kysely<DB>;

  const setup = (db?: Kysely<DB>) => {
    return newMediumService(VersionService, {
      database: db || defaultDatabase,
      repos: {
        job: 'mock',
        database: 'real',
        versionHistory: 'real',
      },
    });
  };

  beforeAll(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('onBootstrap', () => {
    it('record the current version on startup', async () => {
      const { sut, repos } = setup();

      const itemsBefore = await repos.versionHistory.getAll();
      expect(itemsBefore).toHaveLength(0);

      await sut.onBootstrap();

      const itemsAfter = await repos.versionHistory.getAll();
      expect(itemsAfter).toHaveLength(1);
      expect(itemsAfter[0]).toEqual({
        createdAt: expect.any(Date),
        id: expect.any(String),
        version: serverVersion.toString(),
      });
    });

    it('should queue memory creation when upgrading from 1.128.0', async () => {
      const { sut, repos, mocks } = setup();
      mocks.job.queue.mockResolvedValue(void 0);

      await repos.versionHistory.create({ version: 'v1.128.0' });
      await sut.onBootstrap();

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.MEMORIES_CREATE });
    });

    it('should not queue memory creation when upgrading from 1.129.0', async () => {
      const { sut, repos, mocks } = setup();

      await repos.versionHistory.create({ version: 'v1.129.0' });
      await sut.onBootstrap();

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });
});
