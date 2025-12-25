import { jwtVerify } from 'jose';
import { SystemMetadataKey } from 'src/enum';
import { CliService } from 'src/services/cli.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';
import { describe, it } from 'vitest';

describe(CliService.name, () => {
  let sut: CliService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(CliService));
  });

  describe('listUsers', () => {
    it('should list users', async () => {
      mocks.user.getList.mockResolvedValue([factory.userAdmin({ isAdmin: true })]);
      await expect(sut.listUsers()).resolves.toEqual([expect.objectContaining({ isAdmin: true })]);
      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: true });
    });
  });

  describe('resetAdminPassword', () => {
    it('should only work when there is an admin account', async () => {
      mocks.user.getAdmin.mockResolvedValue(void 0);
      const ask = vitest.fn().mockResolvedValue('new-password');

      await expect(sut.resetAdminPassword(ask)).rejects.toThrowError('Admin account does not exist');

      expect(ask).not.toHaveBeenCalled();
    });

    it('should default to a random password', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(factory.userAdmin({ isAdmin: true }));

      const ask = vitest.fn().mockImplementation(() => {});

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = mocks.user.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(admin.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(admin);

      const ask = vitest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = mocks.user.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(admin.id);
      expect(update.password).toBeDefined();
    });
  });

  describe('disablePasswordLogin', () => {
    it('should disable password login', async () => {
      await sut.disablePasswordLogin();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith('system-config', { passwordLogin: { enabled: false } });
    });
  });

  describe('enablePasswordLogin', () => {
    it('should enable password login', async () => {
      await sut.enablePasswordLogin();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith('system-config', {});
    });
  });

  describe('disableMaintenanceMode', () => {
    it('should not do anything if not in maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });
      await expect(sut.disableMaintenanceMode()).resolves.toEqual({
        alreadyDisabled: true,
      });

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledTimes(0);
      expect(mocks.systemMetadata.set).toHaveBeenCalledTimes(0);
      expect(mocks.event.emit).toHaveBeenCalledTimes(0);
    });

    it('should disable maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: true, secret: 'secret' });
      await expect(sut.disableMaintenanceMode()).resolves.toEqual({
        alreadyDisabled: false,
      });

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalled();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: false,
      });
    });
  });

  describe('enableMaintenanceMode', () => {
    it('should not do anything if in maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: true, secret: 'secret' });
      await expect(sut.enableMaintenanceMode()).resolves.toEqual(
        expect.objectContaining({
          alreadyEnabled: true,
        }),
      );

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledTimes(0);
      expect(mocks.systemMetadata.set).toHaveBeenCalledTimes(0);
      expect(mocks.event.emit).toHaveBeenCalledTimes(0);
    });

    it('should enable maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });
      await expect(sut.enableMaintenanceMode()).resolves.toEqual(
        expect.objectContaining({
          alreadyEnabled: false,
        }),
      );

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalled();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: true,
        secret: expect.stringMatching(/^\w{128}$/),
      });
    });

    const RE_LOGIN_URL = /https:\/\/my.immich.app\/maintenance\?token=([A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*)/;

    it('should return a valid login URL', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: true, secret: 'secret' });

      const result = await sut.enableMaintenanceMode();

      expect(result).toEqual(
        expect.objectContaining({
          authUrl: expect.stringMatching(RE_LOGIN_URL),
          alreadyEnabled: true,
        }),
      );

      const token = RE_LOGIN_URL.exec(result.authUrl)![1];

      await expect(jwtVerify(token, new TextEncoder().encode('secret'))).resolves.toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            username: 'cli-admin',
          }),
        }),
      );
    });
  });

  describe('disableOAuthLogin', () => {
    it('should disable oauth login', async () => {
      await sut.disableOAuthLogin();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith('system-config', {});
    });
  });

  describe('enableOAuthLogin', () => {
    it('should enable oauth login', async () => {
      await sut.enableOAuthLogin();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith('system-config', { oauth: { enabled: true } });
    });
  });
});
