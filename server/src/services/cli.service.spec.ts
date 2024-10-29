import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { CliService } from 'src/services/cli.service';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService } from 'test/utils';
import { Mocked, describe, it } from 'vitest';

describe(CliService.name, () => {
  let sut: CliService;

  let userMock: Mocked<IUserRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, userMock, systemMock } = newTestService(CliService));
  });

  describe('listUsers', () => {
    it('should list users', async () => {
      userMock.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.listUsers()).resolves.toEqual([expect.objectContaining({ isAdmin: true })]);
      expect(userMock.getList).toHaveBeenCalledWith({ withDeleted: true });
    });
  });

  describe('resetAdminPassword', () => {
    it('should only work when there is an admin account', async () => {
      userMock.getAdmin.mockResolvedValue(null);
      const ask = vitest.fn().mockResolvedValue('new-password');

      await expect(sut.resetAdminPassword(ask)).rejects.toThrowError('Admin account does not exist');

      expect(ask).not.toHaveBeenCalled();
    });

    it('should default to a random password', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = vitest.fn().mockImplementation(() => {});

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = vitest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
      expect(update.password).toBeDefined();
    });
  });

  describe('disablePasswordLogin', () => {
    it('should disable password login', async () => {
      await sut.disablePasswordLogin();
      expect(systemMock.set).toHaveBeenCalledWith('system-config', { passwordLogin: { enabled: false } });
    });
  });

  describe('enablePasswordLogin', () => {
    it('should enable password login', async () => {
      await sut.enablePasswordLogin();
      expect(systemMock.set).toHaveBeenCalledWith('system-config', {});
    });
  });

  describe('disableOAuthLogin', () => {
    it('should disable oauth login', async () => {
      await sut.disableOAuthLogin();
      expect(systemMock.set).toHaveBeenCalledWith('system-config', {});
    });
  });

  describe('enableOAuthLogin', () => {
    it('should enable oauth login', async () => {
      await sut.enableOAuthLogin();
      expect(systemMock.set).toHaveBeenCalledWith('system-config', { oauth: { enabled: true } });
    });
  });
});
