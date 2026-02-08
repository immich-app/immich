import { UnauthorizedException } from '@nestjs/common';
import { SignJWT } from 'jose';
import { MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository';
import { MaintenanceWebsocketRepository } from 'src/maintenance/maintenance-websocket.repository';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { automock, AutoMocked, getMocks, ServiceMocks } from 'test/utils';

describe(MaintenanceWorkerService.name, () => {
  let sut: MaintenanceWorkerService;
  let mocks: ServiceMocks;
  let maintenanceWebsocketRepositoryMock: AutoMocked<MaintenanceWebsocketRepository>;
  let maintenanceHealthRepositoryMock: AutoMocked<MaintenanceHealthRepository>;
  let databaseBackupServiceMock: AutoMocked<DatabaseBackupService>;

  beforeEach(() => {
    mocks = getMocks();
    maintenanceWebsocketRepositoryMock = automock(MaintenanceWebsocketRepository, {
      args: [mocks.logger],
      strict: false,
    });
    maintenanceHealthRepositoryMock = automock(MaintenanceHealthRepository, {
      args: [mocks.logger],
      strict: false,
    });
    databaseBackupServiceMock = automock(DatabaseBackupService, {
      args: [
        mocks.logger,
        mocks.storage,
        mocks.config,
        mocks.systemMetadata,
        mocks.process,
        mocks.database,
        mocks.cron,
        mocks.job,
        maintenanceHealthRepositoryMock,
      ],
      strict: false,
    });

    sut = new MaintenanceWorkerService(
      mocks.logger as never,
      mocks.app,
      mocks.config,
      mocks.systemMetadata as never,
      maintenanceWebsocketRepositoryMock,
      maintenanceHealthRepositoryMock,
      mocks.storage as never,
      mocks.process,
      mocks.database as never,
      databaseBackupServiceMock,
    );

    sut.mock({
      active: true,
      action: MaintenanceAction.Start,
    });
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getSystemConfig', () => {
    it('should respond the server is in maintenance mode', () => {
      expect(sut.getSystemConfig()).toMatchObject(
        expect.objectContaining({
          maintenanceMode: true,
        }),
      );

      expect(mocks.systemMetadata.get).toHaveBeenCalledTimes(0);
    });
  });

  describe.skip('ssr');
  describe.skip('detectMediaLocation');

  describe('setStatus', () => {
    it('should broadcast status', () => {
      sut.setStatus({
        active: true,
        action: MaintenanceAction.Start,
        task: 'abc',
        error: 'def',
      });

      expect(maintenanceWebsocketRepositoryMock.serverSend).toHaveBeenCalled();
      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledTimes(2);
      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: 'start',
        task: 'abc',
        error: 'def',
      });
      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'public', {
        active: true,
        action: 'start',
        task: 'abc',
        error: 'Something went wrong, see logs!',
      });
    });
  });

  describe('logSecret', () => {
    const RE_LOGIN_URL = /https:\/\/my.immich.app\/maintenance\?token=([A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*)/;

    it('should log a valid login URL', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

      await expect(sut.logSecret()).resolves.toBeUndefined();
      expect(mocks.logger.log).toHaveBeenCalledWith(expect.stringMatching(RE_LOGIN_URL));

      const [url] = mocks.logger.log.mock.lastCall!;
      const token = RE_LOGIN_URL.exec(url)![1];

      await expect(sut.login(token)).resolves.toEqual(
        expect.objectContaining({
          username: 'immich-admin',
        }),
      );
    });
  });

  describe('authenticate', () => {
    it('should fail without a cookie', async () => {
      await expect(sut.authenticate({})).rejects.toThrowError(new UnauthorizedException('Missing JWT Token'));
    });

    it('should parse cookie properly', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

      await expect(
        sut.authenticate({
          cookie: 'immich_maintenance_token=invalid-jwt',
        }),
      ).rejects.toThrowError(new UnauthorizedException('Invalid JWT Token'));
    });
  });

  describe('status', () => {
    beforeEach(() => {
      sut.mock({
        active: true,
        action: MaintenanceAction.Start,
        error: 'secret value!',
      });
    });

    it('generates private status', async () => {
      const jwt = await new SignJWT({ _mockValue: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('4h')
        .sign(new TextEncoder().encode('secret'));

      await expect(sut.status(jwt)).resolves.toEqual(
        expect.objectContaining({
          error: 'secret value!',
        }),
      );
    });

    it('generates public status', async () => {
      await expect(sut.status()).resolves.toEqual(
        expect.objectContaining({
          error: 'Something went wrong, see logs!',
        }),
      );
    });
  });

  describe('detectPriorInstall', () => {
    it('generate report about prior installation', async () => {
      mocks.storage.readdir.mockResolvedValue(['.immich', 'file1', 'file2']);
      mocks.storage.readFile.mockResolvedValue(undefined as never);
      mocks.storage.overwriteFile.mockRejectedValue(undefined as never);

      await expect(sut.detectPriorInstall()).resolves.toMatchInlineSnapshot(`
        {
          "storage": [
            {
              "files": 2,
              "folder": "encoded-video",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "library",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "upload",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "profile",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "thumbs",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "backups",
              "readable": true,
              "writable": false,
            },
          ],
        }
      `);
    });
  });

  describe('login', () => {
    it('should fail without token', async () => {
      await expect(sut.login()).rejects.toThrowError(new UnauthorizedException('Missing JWT Token'));
    });

    it('should fail with expired JWT', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

      const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('0s')
        .sign(new TextEncoder().encode('secret'));

      await expect(sut.login(jwt)).rejects.toThrowError(new UnauthorizedException('Invalid JWT Token'));
    });

    it('should succeed with valid JWT', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

      const jwt = await new SignJWT({ _mockValue: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('4h')
        .sign(new TextEncoder().encode('secret'));

      await expect(sut.login(jwt)).resolves.toEqual(
        expect.objectContaining({
          _mockValue: true,
        }),
      );
    });
  });

  describe.skip('setAction'); // just calls setStatus+runAction

  /**
   * Actions
   */

  describe('action: start', () => {
    it('should not do anything', async () => {
      await sut.runAction({
        action: MaintenanceAction.Start,
      });

      expect(mocks.logger.log).toHaveBeenCalledTimes(0);
    });
  });

  describe('action: end', () => {
    it('should set maintenance mode', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });
      await sut.runAction({
        action: MaintenanceAction.End,
      });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: false,
      });

      expect(maintenanceWebsocketRepositoryMock.clientBroadcast).toHaveBeenCalledWith('AppRestartV1', {
        isMaintenanceMode: false,
      });

      expect(maintenanceWebsocketRepositoryMock.serverSend).toHaveBeenCalledWith('AppRestart', {
        isMaintenanceMode: false,
      });
    });
  });

  describe('action: restore database', () => {
    beforeEach(() => {
      mocks.database.tryLock.mockResolvedValueOnce(true);
    });

    it('should update maintenance mode state', async () => {
      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'filename',
      });

      expect(mocks.database.tryLock).toHaveBeenCalled();
      expect(mocks.logger.log).toHaveBeenCalledWith('Running maintenance action restore_database');

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: 'start',
        },
      });
    });

    it('should defer to database backup service', async () => {
      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith(
        'MaintenanceStatusV1',
        expect.any(String),
        {
          active: true,
          action: MaintenanceAction.RestoreDatabase,
          task: 'ready',
          progress: expect.any(Number),
        },
      );

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenLastCalledWith(
        'MaintenanceStatusV1',
        expect.any(String),
        {
          active: true,
          action: 'end',
        },
      );
    });

    it('should forward errors from database backup service', async () => {
      databaseBackupServiceMock.restoreDatabaseBackup.mockRejectedValue('Sample error');

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Sample error',
        task: 'error',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'public', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Something went wrong, see logs!',
        task: 'error',
      });
    });
  });
});
