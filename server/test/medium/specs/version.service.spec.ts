import { serverVersion } from 'src/constants';
import { JobName } from 'src/enum';
import { VersionService } from 'src/services/version.service';
import { TestContext } from 'test/factory';
import { getKyselyDB, newTestService } from 'test/utils';

const setup = async () => {
  const db = await getKyselyDB();
  const context = await TestContext.from(db).create();
  const { sut, mocks } = newTestService(VersionService, context);

  return {
    context,
    sut,
    jobMock: mocks.job,
  };
};

describe(VersionService.name, () => {
  describe.concurrent('onBootstrap', () => {
    it('record the current version on startup', async () => {
      const { context, sut } = await setup();

      const itemsBefore = await context.versionHistory.getAll();
      expect(itemsBefore).toHaveLength(0);

      await sut.onBootstrap();

      const itemsAfter = await context.versionHistory.getAll();
      expect(itemsAfter).toHaveLength(1);
      expect(itemsAfter[0]).toEqual({
        createdAt: expect.any(Date),
        id: expect.any(String),
        version: serverVersion.toString(),
      });
    });

    it('should queue memory creation when upgrading from 1.128.0', async () => {
      const { context, jobMock, sut } = await setup();

      await context.versionHistory.create({ version: 'v1.128.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.MEMORIES_CREATE });
    });

    it('should not queue memory creation when upgrading from 1.129.0', async () => {
      const { context, jobMock, sut } = await setup();

      await context.versionHistory.create({ version: 'v1.129.0' });
      await sut.onBootstrap();

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
