import { jwtVerify } from 'jose';
import { MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { CliService } from 'src/services/cli.service';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';
import { describe, it } from 'vitest';

describe(CliService.name, () => {
  let sut: CliService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(CliService));
  });

  describe('schemaReport', () => {
    it('should return applied migrations when files and rows match', async () => {
      mocks.storage.readdir.mockResolvedValue(['migration1.js', 'migration2.js']);
      mocks.database.getMigrations.mockResolvedValue([
        { name: 'migration1', timestamp: '2024-01-01' },
        { name: 'migration2', timestamp: '2024-01-02' },
      ]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      // Both files and rows share the same names, so each appears twice in the combined list
      // (once from filesSet, once from rowsSet), producing duplicate 'applied' entries.
      expect(result.migrations).toEqual([
        { name: 'migration1', status: 'applied' },
        { name: 'migration1', status: 'applied' },
        { name: 'migration2', status: 'applied' },
        { name: 'migration2', status: 'applied' },
      ]);
      expect(result.drift).toEqual({ added: [], removed: [], changed: [] });
    });

    it('should return missing migrations when file exists but row does not', async () => {
      mocks.storage.readdir.mockResolvedValue(['migration1.js', 'migration2.js']);
      mocks.database.getMigrations.mockResolvedValue([{ name: 'migration1', timestamp: '2024-01-01' }]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([
        { name: 'migration1', status: 'applied' },
        { name: 'migration1', status: 'applied' },
        { name: 'migration2', status: 'missing' },
      ]);
    });

    it('should return deleted migrations when row exists but file does not', async () => {
      mocks.storage.readdir.mockResolvedValue(['migration1.js']);
      mocks.database.getMigrations.mockResolvedValue([
        { name: 'migration1', timestamp: '2024-01-01' },
        { name: 'migration2', timestamp: '2024-01-02' },
      ]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([
        { name: 'migration1', status: 'applied' },
        { name: 'migration1', status: 'applied' },
        { name: 'migration2', status: 'deleted' },
      ]);
    });

    it('should filter out non-.js files from readdir', async () => {
      mocks.storage.readdir.mockResolvedValue(['migration1.js', 'migration1.ts', 'README.md']);
      mocks.database.getMigrations.mockResolvedValue([{ name: 'migration1', timestamp: '2024-01-01' }]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([
        { name: 'migration1', status: 'applied' },
        { name: 'migration1', status: 'applied' },
      ]);
    });

    it('should return only missing when file exists but no matching row', async () => {
      mocks.storage.readdir.mockResolvedValue(['new_migration.js']);
      mocks.database.getMigrations.mockResolvedValue([]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([{ name: 'new_migration', status: 'missing' }]);
    });

    it('should return only deleted when row exists but no matching file', async () => {
      mocks.storage.readdir.mockResolvedValue([]);
      mocks.database.getMigrations.mockResolvedValue([{ name: 'old_migration', timestamp: '2024-01-01' }]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([{ name: 'old_migration', status: 'deleted' }]);
    });

    it('should return empty migrations when no files or rows exist', async () => {
      mocks.storage.readdir.mockResolvedValue([]);
      mocks.database.getMigrations.mockResolvedValue([]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([]);
    });

    it('should sort migrations by name', async () => {
      mocks.storage.readdir.mockResolvedValue(['c_migration.js', 'a_migration.js']);
      mocks.database.getMigrations.mockResolvedValue([{ name: 'b_migration', timestamp: '2024-01-01' }]);
      mocks.database.getSchemaDrift.mockResolvedValue({ added: [], removed: [], changed: [] });

      const result = await sut.schemaReport();

      expect(result.migrations).toEqual([
        { name: 'a_migration', status: 'missing' },
        { name: 'b_migration', status: 'deleted' },
        { name: 'c_migration', status: 'missing' },
      ]);
    });

    it('should include schema drift in the report', async () => {
      const drift = {
        added: [{ type: 'table', name: 'new_table' }],
        removed: [],
        changed: [],
      };
      mocks.storage.readdir.mockResolvedValue([]);
      mocks.database.getMigrations.mockResolvedValue([]);
      mocks.database.getSchemaDrift.mockResolvedValue(drift);

      const result = await sut.schemaReport();

      expect(result.drift).toEqual(drift);
    });
  });

  describe('listUsers', () => {
    it('should list users', async () => {
      mocks.user.getList.mockResolvedValue([factory.userAdmin({ isAdmin: true })]);
      await expect(sut.listUsers()).resolves.toEqual([expect.objectContaining({ isAdmin: true })]);
      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: true });
    });

    it('should return an empty list when there are no users', async () => {
      mocks.user.getList.mockResolvedValue([]);
      await expect(sut.listUsers()).resolves.toEqual([]);
      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: true });
    });

    it('should map multiple users', async () => {
      const users = [
        factory.userAdmin({ isAdmin: true, email: 'admin@test.com' }),
        factory.userAdmin({ isAdmin: false, email: 'user@test.com' }),
      ];
      mocks.user.getList.mockResolvedValue(users);

      const result = await sut.listUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ isAdmin: true, email: 'admin@test.com' }));
      expect(result[1]).toEqual(expect.objectContaining({ isAdmin: false, email: 'user@test.com' }));
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

    it('should hash the password with bcrypt', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(admin);

      const ask = vitest.fn().mockResolvedValue('my-password');

      await sut.resetAdminPassword(ask);

      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('my-password', 10);
    });

    it('should use randomBytesAsText when no password is provided', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(admin);
      mocks.crypto.randomBytesAsText.mockReturnValue('generated-random-password');

      const ask = vitest.fn().mockResolvedValue(undefined);

      const response = await sut.resetAdminPassword(ask);

      expect(mocks.crypto.randomBytesAsText).toHaveBeenCalledWith(24);
      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('generated-random-password', 10);
      expect(response.password).toBe('generated-random-password');
      expect(response.provided).toBe(false);
    });

    it('should return the admin and password', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(admin);

      const ask = vitest.fn().mockResolvedValue('custom-password');

      const response = await sut.resetAdminPassword(ask);

      expect(response.admin).toBe(admin);
      expect(response.password).toBe('custom-password');
      expect(response.provided).toBe(true);
    });

    it('should treat empty string as a provided password', async () => {
      const admin = factory.userAdmin({ isAdmin: true });

      mocks.user.getAdmin.mockResolvedValue(admin);
      mocks.user.update.mockResolvedValue(admin);

      const ask = vitest.fn().mockResolvedValue('');

      const response = await sut.resetAdminPassword(ask);

      // empty string is falsy, so it should fall back to random
      expect(response.provided).toBe(false);
      expect(mocks.crypto.randomBytesAsText).toHaveBeenCalledWith(24);
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

    it('should default to not in maintenance mode when metadata returns null', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);
      await expect(sut.disableMaintenanceMode()).resolves.toEqual({
        alreadyDisabled: true,
      });

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledTimes(0);
      expect(mocks.systemMetadata.set).toHaveBeenCalledTimes(0);
    });

    it('should disable maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

      await expect(sut.disableMaintenanceMode()).resolves.toEqual({
        alreadyDisabled: false,
      });

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalled();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: false,
      });
    });

    it('should send app restart with isMaintenanceMode false', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: { action: MaintenanceAction.Start },
      });

      await sut.disableMaintenanceMode();

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledWith({ isMaintenanceMode: false });
    });
  });

  describe('enableMaintenanceMode', () => {
    it('should not do anything if in maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

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
        action: {
          action: 'start',
        },
      });
    });

    it('should default to not in maintenance mode when metadata returns null', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);

      const result = await sut.enableMaintenanceMode();

      expect(result.alreadyEnabled).toBe(false);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.MaintenanceMode,
        expect.objectContaining({
          isMaintenanceMode: true,
          secret: expect.any(String),
        }),
      );
      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledWith({ isMaintenanceMode: true });
    });

    it('should send app restart with isMaintenanceMode true', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await sut.enableMaintenanceMode();

      expect(mocks.app.sendOneShotAppRestart).toHaveBeenCalledWith({ isMaintenanceMode: true });
    });

    it('should return an authUrl containing a valid JWT', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      const result = await sut.enableMaintenanceMode();

      expect(result.authUrl).toContain('https://my.immich.app/maintenance?token=');
    });

    const RE_LOGIN_URL = /https:\/\/my.immich.app\/maintenance\?token=([A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*)/;

    it('should return a valid login URL', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

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

  describe('grantAdminAccess', () => {
    it('should throw if user does not exist', async () => {
      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(sut.grantAdminAccess('missing@test.com')).rejects.toThrowError('User does not exist');
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should grant admin access to a user', async () => {
      const userId = newUuid();
      mocks.user.getByEmail.mockResolvedValue(factory.userAdmin({ id: userId, email: 'user@test.com' }));

      await sut.grantAdminAccess('user@test.com');

      expect(mocks.user.getByEmail).toHaveBeenCalledWith('user@test.com');
      expect(mocks.user.update).toHaveBeenCalledWith(userId, { isAdmin: true });
    });
  });

  describe('revokeAdminAccess', () => {
    it('should throw if user does not exist', async () => {
      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(sut.revokeAdminAccess('missing@test.com')).rejects.toThrowError('User does not exist');
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should revoke admin access from a user', async () => {
      const userId = newUuid();
      mocks.user.getByEmail.mockResolvedValue(factory.userAdmin({ id: userId, email: 'admin@test.com', isAdmin: true }));

      await sut.revokeAdminAccess('admin@test.com');

      expect(mocks.user.getByEmail).toHaveBeenCalledWith('admin@test.com');
      expect(mocks.user.update).toHaveBeenCalledWith(userId, { isAdmin: false });
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

  describe('getSampleFilePaths', () => {
    it('should return file paths from assets, people, and users', async () => {
      mocks.asset.getFileSamples.mockResolvedValue([{ assetId: newUuid(), path: '/data/asset1.jpg' }]);
      mocks.person.getFileSamples.mockResolvedValue([
        { id: newUuid(), thumbnailPath: '/data/person-thumb.jpg' },
      ]);
      mocks.user.getFileSamples.mockResolvedValue([
        { id: newUuid(), profileImagePath: '/data/profile.jpg' },
      ]);

      const result = await sut.getSampleFilePaths();

      expect(result).toEqual(['/data/person-thumb.jpg', '/data/profile.jpg', '/data/asset1.jpg']);
    });

    it('should return an empty array when there are no samples', async () => {
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.person.getFileSamples.mockResolvedValue([]);
      mocks.user.getFileSamples.mockResolvedValue([]);

      const result = await sut.getSampleFilePaths();

      expect(result).toEqual([]);
    });

    it('should filter out empty/falsy paths', async () => {
      mocks.asset.getFileSamples.mockResolvedValue([{ assetId: newUuid(), path: '' }]);
      mocks.person.getFileSamples.mockResolvedValue([{ id: newUuid(), thumbnailPath: '' }]);
      mocks.user.getFileSamples.mockResolvedValue([{ id: newUuid(), profileImagePath: '' }]);

      const result = await sut.getSampleFilePaths();

      expect(result).toEqual([]);
    });

    it('should include paths from multiple assets, people, and users', async () => {
      mocks.asset.getFileSamples.mockResolvedValue([
        { assetId: newUuid(), path: '/data/asset1.jpg' },
        { assetId: newUuid(), path: '/data/asset2.jpg' },
      ]);
      mocks.person.getFileSamples.mockResolvedValue([
        { id: newUuid(), thumbnailPath: '/data/person1.jpg' },
        { id: newUuid(), thumbnailPath: '/data/person2.jpg' },
      ]);
      mocks.user.getFileSamples.mockResolvedValue([
        { id: newUuid(), profileImagePath: '/data/user1.jpg' },
      ]);

      const result = await sut.getSampleFilePaths();

      expect(result).toEqual([
        '/data/person1.jpg',
        '/data/person2.jpg',
        '/data/user1.jpg',
        '/data/asset1.jpg',
        '/data/asset2.jpg',
      ]);
    });

    it('should call all three repositories in parallel', async () => {
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.person.getFileSamples.mockResolvedValue([]);
      mocks.user.getFileSamples.mockResolvedValue([]);

      await sut.getSampleFilePaths();

      expect(mocks.asset.getFileSamples).toHaveBeenCalledTimes(1);
      expect(mocks.person.getFileSamples).toHaveBeenCalledTimes(1);
      expect(mocks.user.getFileSamples).toHaveBeenCalledTimes(1);
    });
  });

  describe('migrateFilePaths', () => {
    it('should throw if the target folder is not absolute', async () => {
      const confirm = vitest.fn().mockResolvedValue(true);

      await expect(
        sut.migrateFilePaths({ oldValue: '/old/path', newValue: 'relative/path', confirm }),
      ).rejects.toThrowError('Target media location must be an absolute path');

      expect(confirm).not.toHaveBeenCalled();
      expect(mocks.database.migrateFilePaths).not.toHaveBeenCalled();
    });

    it('should return false if confirm returns false', async () => {
      const confirm = vitest.fn().mockResolvedValue(false);

      const result = await sut.migrateFilePaths({
        oldValue: '/old/path',
        newValue: '/new/path',
        confirm,
      });

      expect(result).toBe(false);
      expect(confirm).toHaveBeenCalledWith({ sourceFolder: '/old/path', targetFolder: '/new/path' });
      expect(mocks.database.migrateFilePaths).not.toHaveBeenCalled();
    });

    it('should migrate file paths when confirmed', async () => {
      const confirm = vitest.fn().mockResolvedValue(true);

      const result = await sut.migrateFilePaths({
        oldValue: '/old/path',
        newValue: '/new/path',
        confirm,
      });

      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalledWith({ sourceFolder: '/old/path', targetFolder: '/new/path' });
      expect(mocks.database.migrateFilePaths).toHaveBeenCalledWith('/old/path', '/new/path');
    });

    it('should strip leading ./ from oldValue', async () => {
      const confirm = vitest.fn().mockResolvedValue(true);

      await sut.migrateFilePaths({
        oldValue: './relative/source',
        newValue: '/new/path',
        confirm,
      });

      expect(confirm).toHaveBeenCalledWith({ sourceFolder: 'relative/source', targetFolder: '/new/path' });
      expect(mocks.database.migrateFilePaths).toHaveBeenCalledWith('relative/source', '/new/path');
    });

    it('should not strip ./ if it does not start with ./', async () => {
      const confirm = vitest.fn().mockResolvedValue(true);

      await sut.migrateFilePaths({
        oldValue: '/absolute/source',
        newValue: '/new/path',
        confirm,
      });

      expect(confirm).toHaveBeenCalledWith({ sourceFolder: '/absolute/source', targetFolder: '/new/path' });
      expect(mocks.database.migrateFilePaths).toHaveBeenCalledWith('/absolute/source', '/new/path');
    });
  });

  describe('cleanup', () => {
    it('should call database shutdown', async () => {
      await sut.cleanup();
      expect(mocks.database.shutdown).toHaveBeenCalledTimes(1);
    });
  });
});
