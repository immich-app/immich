import { UnauthorizedException } from '@nestjs/common';
import { SignJWT } from 'jose';
import { DateTime } from 'luxon';
import { PassThrough, Readable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import { MaintenanceAction, StorageFolder, SystemMetadataKey } from 'src/enum';
import { MaintenanceEphemeralStateRepository } from 'src/maintenance/maintenance-ephemeral-state.repository';
import { MaintenanceWebsocketRepository } from 'src/maintenance/maintenance-websocket.repository';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { automock, AutoMocked, getMocks, mockDuplex, mockSpawn, ServiceMocks } from 'test/utils';

describe(MaintenanceWorkerService.name, () => {
  let sut: MaintenanceWorkerService;
  let mocks: ServiceMocks;
  let maintenanceWebsocketRepositoryMock: AutoMocked<MaintenanceWebsocketRepository>;
  let maintenanceEphemeralStateRepositoryMock: AutoMocked<MaintenanceEphemeralStateRepository>;

  beforeEach(() => {
    mocks = getMocks();
    maintenanceWebsocketRepositoryMock = automock(MaintenanceWebsocketRepository, {
      args: [mocks.logger],
      strict: false,
    });

    maintenanceEphemeralStateRepositoryMock = automock(MaintenanceEphemeralStateRepository, {
      strict: false,
    });

    sut = new MaintenanceWorkerService(
      mocks.logger as never,
      mocks.app,
      mocks.config,
      mocks.systemMetadata as never,
      maintenanceWebsocketRepositoryMock,
      maintenanceEphemeralStateRepositoryMock,
      mocks.storage as never,
      mocks.process,
      mocks.database as never,
    );
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getSystemConfig', () => {
    it('should respond the server is in maintenance mode', async () => {
      await expect(sut.getSystemConfig()).resolves.toMatchObject(
        expect.objectContaining({
          maintenanceMode: true,
        }),
      );

      expect(mocks.systemMetadata.get).toHaveBeenCalledTimes(0);
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

      maintenanceEphemeralStateRepositoryMock.getSecret.mockReturnValue('secret');

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

  describe('endMaintenance', () => {
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

  describe('action: restore database', () => {
    beforeEach(() => {
      function* mockData() {
        yield '';
      }

      mocks.database.tryLock.mockResolvedValueOnce(true);

      mocks.storage.readdir.mockResolvedValue([]);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, 'data', ''));
      mocks.process.createSpawnDuplexStream.mockImplementation(() => mockDuplex('command', 0, 'data', ''));
      mocks.storage.rename.mockResolvedValue();
      mocks.storage.unlink.mockResolvedValue();
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(mockData()));
      mocks.storage.createWriteStream.mockReturnValue(new PassThrough());
      mocks.storage.createGzip.mockReturnValue(new PassThrough());
      mocks.storage.createGunzip.mockReturnValue(new PassThrough());
    });

    it('should update maintenance mode state', async () => {
      maintenanceEphemeralStateRepositoryMock.getSecret.mockReturnValue('secret');

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

    it('should fail to restore invalid backup', async () => {
      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'filename',
      });

      expect(maintenanceEphemeralStateRepositoryMock.setStatus).toHaveBeenCalledWith({
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: Invalid backup file format!',
      });
    });

    it('should successfully run a backup', async () => {
      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename',
      });

      expect(maintenanceEphemeralStateRepositoryMock.setStatus).toHaveBeenCalledWith({
        action: MaintenanceAction.RestoreDatabase,
        progress: expect.any(Number),
      });

      expect(maintenanceEphemeralStateRepositoryMock.setStatus).toHaveBeenLastCalledWith({
        action: 'end',
      });
    });

    it('should fail if backup creation fails', async () => {
      mocks.process.createSpawnDuplexStream.mockReturnValueOnce(mockDuplex('pg_dump', 1, '', 'error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename',
      });

      expect(maintenanceEphemeralStateRepositoryMock.setStatus).toHaveBeenLastCalledWith({
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: pg_dump non-zero exit code (1)\nerror',
      });
    });

    it('should fail if restore itself fails', async () => {
      mocks.process.createSpawnDuplexStream
        .mockReturnValueOnce(mockDuplex('pg_dump', 0, 'data', ''))
        .mockReturnValueOnce(mockDuplex('gzip', 0, 'data', ''))
        .mockReturnValueOnce(mockDuplex('psql', 1, '', 'error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename',
      });

      expect(maintenanceEphemeralStateRepositoryMock.setStatus).toHaveBeenLastCalledWith({
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: psql non-zero exit code (1)\nerror',
      });
    });
  });

  /**
   * Backups
   */

  describe('listBackups', () => {
    it('should give us all valid and failed backups', async () => {
      mocks.storage.readdir.mockResolvedValue([
        `immich-db-backup-${DateTime.fromISO('2025-07-25T11:02:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
        `immich-db-backup-${DateTime.fromISO('2025-07-27T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
        'immich-db-backup-1753789649000.sql.gz',
        `immich-db-backup-${DateTime.fromISO('2025-07-29T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
      ]);

      await expect(sut.listBackups()).resolves.toMatchObject({
        backups: [
          'immich-db-backup-20250729T110116-v1.234.5-pg14.5.sql.gz',
          'immich-db-backup-20250727T110116-v1.234.5-pg14.5.sql.gz',
          'immich-db-backup-1753789649000.sql.gz',
        ],
        failedBackups: ['immich-db-backup-20250725T110216-v1.234.5-pg14.5.sql.gz.tmp'],
      });
    });
  });

  describe('deleteBackup', () => {
    it('should unlink the target file', async () => {
      await sut.deleteBackup('filename');
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(`${StorageCore.getBaseFolder(StorageFolder.Backups)}/filename`);
    });
  });
});
