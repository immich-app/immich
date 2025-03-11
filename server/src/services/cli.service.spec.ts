import { CliService } from 'src/services/cli.service';
import { userStub } from 'test/fixtures/user.stub';
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
      mocks.user.getList.mockResolvedValue([userStub.admin]);
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
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.update.mockResolvedValue(userStub.admin);

      const ask = vitest.fn().mockImplementation(() => {});

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = mocks.user.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.update.mockResolvedValue(userStub.admin);

      const ask = vitest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = mocks.user.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
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
