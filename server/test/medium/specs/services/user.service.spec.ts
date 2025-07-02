import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { ImmichEnvironment, JobName, JobStatus } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { UserService } from 'src/services/user.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  process.env.IMMICH_ENV = ImmichEnvironment.TESTING;

  return newMediumService(UserService, {
    database: db || defaultDatabase,
    real: [CryptoRepository, ConfigRepository, SystemMetadataRepository, UserRepository],
    mock: [LoggingRepository, JobRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
  const { ctx } = setup();
  await ctx.newUser({ isAdmin: true, email: 'admin@immich.cloud' });
});

describe(UserService.name, () => {
  describe('create', () => {
    it('should create a user', async () => {
      const { sut } = setup();
      const user = mediumFactory.userInsert();
      await expect(sut.createUser({ name: user.name, email: user.email })).resolves.toEqual(
        expect.objectContaining({ name: user.name, email: user.email }),
      );
    });

    it('should reject user with duplicate email', async () => {
      const { sut } = setup();
      const user = mediumFactory.userInsert();
      await expect(sut.createUser({ email: user.email })).resolves.toMatchObject({ email: user.email });
      await expect(sut.createUser({ email: user.email })).rejects.toThrow('User exists');
    });

    it('should not return password', async () => {
      const { sut } = setup();
      const dto = mediumFactory.userInsert({ password: 'password' });
      const user = await sut.createUser({ email: dto.email, password: 'password' });
      expect((user as any).password).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should get users', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth = factory.auth({ user: user1 });

      await expect(sut.search(auth)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: user1.email }),
          expect.objectContaining({ email: user2.email }),
        ]),
      );
    });
  });

  describe('get', () => {
    it('should get a user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.get(user.id)).resolves.toEqual(
        expect.objectContaining({
          id: user.id,
          name: user.name,
          email: user.email,
        }),
      );
    });

    it('should not return password', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const result = await sut.get(user.id);

      expect((result as any).password).toBeUndefined();
    });
  });

  describe('updateMe', () => {
    it('should update a user', async () => {
      const { sut, ctx } = setup();
      const { user, result: before } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });
      const after = await sut.updateMe(auth, { name: `${before.name} Updated` });

      expect(before.updatedAt).toBeDefined();
      expect(after.updatedAt).toBeDefined();
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });

  describe('setLicense', () => {
    it('should set a license', async () => {
      const license = {
        licenseKey: 'IMCL-FF69-TUK1-RWZU-V9Q8-QGQS-S5GC-X4R2-UFK4',
        activationKey:
          'KuX8KsktrBSiXpQMAH0zLgA5SpijXVr_PDkzLdWUlAogCTMBZ0I3KCHXK0eE9EEd7harxup8_EHMeqAWeHo5VQzol6LGECpFv585U9asXD4Zc-UXt3mhJr2uhazqipBIBwJA2YhmUCDy8hiyiGsukDQNu9Rg9C77UeoKuZBWVjWUBWG0mc1iRqfvF0faVM20w53czAzlhaMxzVGc3Oimbd7xi_CAMSujF_2y8QpA3X2fOVkQkzdcH9lV0COejl7IyH27zQQ9HrlrXv3Lai5Hw67kNkaSjmunVBxC5PS0TpKoc9SfBJMaAGWnaDbjhjYUrm-8nIDQnoeEAidDXVAdPw',
      };
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });
      await expect(sut.getLicense(auth)).rejects.toThrowError();
      const after = await sut.setLicense(auth, license);
      expect(after.licenseKey).toEqual(license.licenseKey);
      expect(after.activationKey).toEqual(license.activationKey);
      const getResponse = await sut.getLicense(auth);
      expect(getResponse).toEqual(after);
    });
  });

  describe.sequential('handleUserDeleteCheck', () => {
    beforeEach(async () => {
      const { sut } = setup();
      // These tests specifically have to be sequential otherwise we hit race conditions with config changes applying in incorrect tests
      const config = await sut.getConfig({ withCache: false });
      config.user.deleteDelay = 7;
      await sut.updateConfig(config);
    });

    it('should work when there are no deleted users', async () => {
      const { sut, ctx } = setup();
      const jobMock = ctx.getMock(JobRepository);
      jobMock.queueAll.mockResolvedValue(void 0);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });

    it('should work when there is a user to delete', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const jobMock = ctx.getMock(JobRepository);
      const { user } = await ctx.newUser({ deletedAt: DateTime.now().minus({ days: 60 }).toJSDate() });
      jobMock.queueAll.mockResolvedValue(void 0);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([
        { name: JobName.USER_DELETION, data: { id: user.id } },
      ]);
    });

    it('should skip a recently deleted user', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const jobMock = ctx.getMock(JobRepository);
      await ctx.newUser({ deletedAt: DateTime.now().minus({ days: 5 }).toJSDate() });
      jobMock.queueAll.mockResolvedValue(void 0);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });

    it('should respect a custom user delete delay', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const jobMock = ctx.getMock(JobRepository);
      await ctx.newUser({ deletedAt: DateTime.now().minus({ days: 25 }).toJSDate() });
      jobMock.queueAll.mockResolvedValue(void 0);
      const config = await sut.getConfig({ withCache: false });
      config.user.deleteDelay = 30;
      await sut.updateConfig(config);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });
  });
});
