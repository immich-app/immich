import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { DB } from 'src/db';
import { JobName, JobStatus } from 'src/enum';
import { UserService } from 'src/services/user.service';
import { TestContext, TestFactory } from 'test/factory';
import { getKyselyDB, newTestService, ServiceMocks } from 'test/utils';

const setup = async (db: Kysely<DB>) => {
  const context = await TestContext.from(db).withUser({ isAdmin: true }).create();
  const { sut, mocks } = newTestService(UserService, context);

  return { sut, mocks, context };
};

describe(UserService.name, () => {
  let sut: UserService;
  let context: TestContext;
  let mocks: ServiceMocks;

  beforeAll(async () => {
    ({ sut, context, mocks } = await setup(await getKyselyDB()));
  });

  describe('create', () => {
    it('should create a user', async () => {
      const userDto = TestFactory.user();

      await expect(sut.createUser(userDto)).resolves.toEqual(
        expect.objectContaining({
          id: userDto.id,
          name: userDto.name,
          email: userDto.email,
        }),
      );
    });

    it('should reject user with duplicate email', async () => {
      const userDto = TestFactory.user();
      const userDto2 = TestFactory.user({ email: userDto.email });

      await sut.createUser(userDto);

      await expect(sut.createUser(userDto2)).rejects.toThrow('User exists');
    });

    it('should not return password', async () => {
      const user = await sut.createUser(TestFactory.user());

      expect((user as any).password).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should get a user', async () => {
      const userDto = TestFactory.user();

      await context.createUser(userDto);

      await expect(sut.get(userDto.id)).resolves.toEqual(
        expect.objectContaining({
          id: userDto.id,
          name: userDto.name,
          email: userDto.email,
        }),
      );
    });

    it('should not return password', async () => {
      const { id } = await context.createUser();

      const user = await sut.get(id);

      expect((user as any).password).toBeUndefined();
    });
  });

  describe('updateMe', () => {
    it('should update a user', async () => {
      const userDto = TestFactory.user();
      const sessionDto = TestFactory.session({ userId: userDto.id });
      const authDto = TestFactory.auth({ user: userDto });

      const before = await context.createUser(userDto);
      await context.createSession(sessionDto);

      const newUserDto = TestFactory.user();

      const after = await sut.updateMe(authDto, { name: newUserDto.name, email: newUserDto.email });

      if (!before || !after) {
        expect.fail('User should be found');
      }

      expect(before.updatedAt).toBeDefined();
      expect(after.updatedAt).toBeDefined();
      expect(before.updatedAt).not.toEqual(after.updatedAt);
      expect(after).toEqual(expect.objectContaining({ name: newUserDto.name, email: newUserDto.email }));
    });
  });

  describe('setLicense', () => {
    const userLicense = {
      licenseKey: 'IMCL-FF69-TUK1-RWZU-V9Q8-QGQS-S5GC-X4R2-UFK4',
      activationKey:
        'KuX8KsktrBSiXpQMAH0zLgA5SpijXVr_PDkzLdWUlAogCTMBZ0I3KCHXK0eE9EEd7harxup8_EHMeqAWeHo5VQzol6LGECpFv585U9asXD4Zc-UXt3mhJr2uhazqipBIBwJA2YhmUCDy8hiyiGsukDQNu9Rg9C77UeoKuZBWVjWUBWG0mc1iRqfvF0faVM20w53czAzlhaMxzVGc3Oimbd7xi_CAMSujF_2y8QpA3X2fOVkQkzdcH9lV0COejl7IyH27zQQ9HrlrXv3Lai5Hw67kNkaSjmunVBxC5PS0TpKoc9SfBJMaAGWnaDbjhjYUrm-8nIDQnoeEAidDXVAdPw',
    };
    it('should set a license', async () => {
      const userDto = TestFactory.user();
      const sessionDto = TestFactory.session({ userId: userDto.id });
      const authDto = TestFactory.auth({ user: userDto });

      await context.getFactory().withUser(userDto).withSession(sessionDto).create();

      await expect(sut.getLicense(authDto)).rejects.toThrowError();

      const after = await sut.setLicense(authDto, userLicense);

      expect(after.licenseKey).toEqual(userLicense.licenseKey);
      expect(after.activationKey).toEqual(userLicense.activationKey);

      const getResponse = await sut.getLicense(authDto);
      expect(getResponse).toEqual(after);
    });
  });

  describe.sequential('handleUserDeleteCheck', () => {
    beforeEach(async () => {
      // These tests specifically have to be sequential otherwise we hit race conditions with config changes applying in incorrect tests
      const config = await sut.getConfig({ withCache: false });
      config.user.deleteDelay = 7;
      await sut.updateConfig(config);
    });

    it('should work when there are no deleted users', async () => {
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });

    it('should work when there is a user to delete', async () => {
      const { sut, context, mocks } = await setup(await getKyselyDB());
      const user = TestFactory.user({ deletedAt: DateTime.now().minus({ days: 60 }).toJSDate() });

      await context.createUser(user);

      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledExactlyOnceWith([
        { name: JobName.USER_DELETION, data: { id: user.id } },
      ]);
    });

    it('should skip a recently deleted user', async () => {
      const { sut, context, mocks } = await setup(await getKyselyDB());
      const user = TestFactory.user({ deletedAt: DateTime.now().minus({ days: 5 }).toJSDate() });

      await context.createUser(user);

      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });

    it('should respect a custom user delete delay', async () => {
      const db = await getKyselyDB();
      const { sut, context, mocks } = await setup(db);
      const user = TestFactory.user({ deletedAt: DateTime.now().minus({ days: 25 }).toJSDate() });
      await context.createUser(user);

      const config = await sut.getConfig({ withCache: false });
      config.user.deleteDelay = 30;

      await sut.updateConfig(config);

      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });
  });
});
