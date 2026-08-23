import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { ImmichEnvironment, JobName, JobStatus, UserAvatarColor } from 'src/enum';
import { ClusterGroupRepository } from 'src/repositories/cluster-group.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { UserService } from 'src/services/user.service';
import { HumanReadableSize } from 'src/utils/bytes';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory, newUuid } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

const userLicense = {
  licenseKey: 'IMCL-FF69-TUK1-RWZU-V9Q8-QGQS-S5GC-X4R2-UFK4',
  activationKey:
    'KuX8KsktrBSiXpQMAH0zLgA5SpijXVr_PDkzLdWUlAogCTMBZ0I3KCHXK0eE9EEd7harxup8_EHMeqAWeHo5VQzol6LGECpFv585U9asXD4Zc-UXt3mhJr2uhazqipBIBwJA2YhmUCDy8hiyiGsukDQNu9Rg9C77UeoKuZBWVjWUBWG0mc1iRqfvF0faVM20w53czAzlhaMxzVGc3Oimbd7xi_CAMSujF_2y8QpA3X2fOVkQkzdcH9lV0COejl7IyH27zQQ9HrlrXv3Lai5Hw67kNkaSjmunVBxC5PS0TpKoc9SfBJMaAGWnaDbjhjYUrm-8nIDQnoeEAidDXVAdPw',
};

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  process.env.IMMICH_ENV = ImmichEnvironment.Testing;

  return newMediumService(UserService, {
    database: db || defaultDatabase,
    real: [ClusterGroupRepository, CryptoRepository, ConfigRepository, SystemMetadataRepository, UserRepository],
    mock: [LoggingRepository, JobRepository, EventRepository],
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
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const user = mediumFactory.userInsert({ clusterGroupId: newUuid() });
      const created = await sut.createUser({ name: user.name, email: user.email });
      expect(created).toEqual(expect.objectContaining({ name: user.name, email: user.email }));

      await expect(sut.get(created.id)).resolves.toMatchObject({ name: user.name, email: user.email });
    });

    it('should reject user with duplicate email', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const user = mediumFactory.userInsert({ clusterGroupId: newUuid() });
      await expect(sut.createUser({ name: 'Test', email: user.email })).resolves.toMatchObject({ email: user.email });
      await expect(sut.createUser({ name: 'Test', email: user.email })).rejects.toThrow('Email is not available');
    });

    it('should not return password', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const dto = mediumFactory.userInsert({ clusterGroupId: newUuid(), password: 'password' });
      const user = await sut.createUser({ name: 'Test', email: dto.email, password: 'password' });
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

    it('should not expose private fields', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.get(user.id)).resolves.not.toMatchObject({
        shouldChangePassword: expect.anything(),
        storageLabel: expect.anything(),
      });
    });
  });

  describe('getMe', () => {
    it('should get my user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(sut.getMe(auth)).resolves.toEqual(
        expect.objectContaining({ id: user.id, email: user.email, quotaUsageInBytes: 0 }),
      );
    });

    it('should include license info', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await sut.setLicense(auth, userLicense);

      await expect(sut.getMe(auth)).resolves.toMatchObject({ license: userLicense });
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

      await expect(sut.getMe(auth)).resolves.toMatchObject({
        name: `${before.name} Updated`,
        updatedAt: after.updatedAt,
      });
    });

    it('should update the name', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { name: 'Name' };

      await expect(sut.updateMe(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMe(auth)).resolves.toMatchObject(dto);
    });

    it('should update the email', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { email: 'updated@immich.cloud' };

      await expect(sut.updateMe(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMe(auth)).resolves.toMatchObject(dto);
    });

    it('should not allow an email that is already taken', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user2.id } });

      await expect(sut.updateMe(auth, { email: user1.email })).rejects.toThrow('Email is not available');
    });

    it('should update the avatar color', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { avatarColor: UserAvatarColor.Blue };

      await expect(sut.updateMe(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMe(auth)).resolves.toMatchObject(dto);
    });

    it('should clear shouldChangePassword when the password is updated', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser({ shouldChangePassword: true });
      const auth = factory.auth({ user: { id: user.id } });

      await expect(sut.updateMe(auth, { password: 'super-secret' })).resolves.toMatchObject({
        shouldChangePassword: false,
      });
      await expect(sut.getMe(auth)).resolves.toMatchObject({ shouldChangePassword: false });
    });
  });

  describe('updateMyPreferences', () => {
    it('should update memories enabled', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { memories: { enabled: false } };

      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject({ memories: { enabled: true } });
      await expect(sut.updateMyPreferences(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject(dto);
    });

    it('should update the download archive size', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { download: { archiveSize: 1_234_567 } };

      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject({
        download: { archiveSize: 4 * HumanReadableSize.GiB },
      });
      await expect(sut.updateMyPreferences(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject(dto);
    });

    it('should update download include embedded videos', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { download: { includeEmbeddedVideos: true } };

      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject({
        download: { includeEmbeddedVideos: false },
      });
      await expect(sut.updateMyPreferences(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject(dto);
    });

    it('should update the minimum face count', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const dto = { people: { minimumFaces: 2 } };

      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject({ people: { minimumFaces: 3 } });
      await expect(sut.updateMyPreferences(auth, dto)).resolves.toMatchObject(dto);
      await expect(sut.getMyPreferences(auth)).resolves.toMatchObject(dto);
    });
  });

  describe('setLicense', () => {
    it('should set a license', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });
      await expect(sut.getLicense(auth)).rejects.toThrowError();
      const after = await sut.setLicense(auth, userLicense);
      expect(after.licenseKey).toEqual(userLicense.licenseKey);
      expect(after.activationKey).toEqual(userLicense.activationKey);
      const response = await sut.getLicense(auth);
      expect(response).toEqual(after);
      await expect(sut.getMe(auth)).resolves.toMatchObject({ license: after });
    });

    it('should reject a license key that does not start with IMCL-', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await expect(
        sut.setLicense(auth, {
          licenseKey: 'IMSV-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD',
          activationKey: 'activationKey',
        }),
      ).rejects.toThrow('Invalid license key');
    });

    it('should reject an invalid activation key', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await expect(
        sut.setLicense(auth, { ...userLicense, activationKey: `invalid${userLicense.activationKey}` }),
      ).rejects.toThrow('Invalid license key');
    });
  });

  describe('deleteLicense', () => {
    it('should delete the license', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await sut.setLicense(auth, userLicense);
      await sut.deleteLicense(auth);

      await expect(sut.getLicense(auth)).rejects.toThrowError();
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
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.Success);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });

    it('should work when there is a user to delete', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const jobMock = ctx.getMock(JobRepository);
      const { user } = await ctx.newUser({ deletedAt: DateTime.now().minus({ days: 60 }).toJSDate() });
      jobMock.queueAll.mockResolvedValue(void 0);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.Success);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([{ name: JobName.UserDelete, data: { id: user.id } }]);
    });

    it('should skip a recently deleted user', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const jobMock = ctx.getMock(JobRepository);
      await ctx.newUser({ deletedAt: DateTime.now().minus({ days: 5 }).toJSDate() });
      jobMock.queueAll.mockResolvedValue(void 0);
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.Success);
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
      await expect(sut.handleUserDeleteCheck()).resolves.toEqual(JobStatus.Success);
      expect(jobMock.queueAll).toHaveBeenCalledExactlyOnceWith([]);
    });
  });
});
