import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignJWT } from 'jose';
import { DateTime } from 'luxon';
import { PassThrough, Readable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import { MaintenanceAction, StorageFolder, SystemMetadataKey } from 'src/enum';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository';
import { MaintenanceWebsocketRepository } from 'src/maintenance/maintenance-websocket.repository';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { automock, AutoMocked, getMocks, mockDuplex, mockSpawn, ServiceMocks } from 'test/utils';

function* mockData() {
  yield '';
}

describe(MaintenanceWorkerService.name, () => {
  let sut: MaintenanceWorkerService;
  let mocks: ServiceMocks;
  let maintenanceWebsocketRepositoryMock: AutoMocked<MaintenanceWebsocketRepository>;
  let maintenanceHealthRepositoryMock: AutoMocked<MaintenanceHealthRepository>;

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

      mocks.storage.readdir.mockResolvedValue([]);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, 'data', ''));
      mocks.process.spawnDuplexStream.mockImplementation(() => mockDuplex('command', 0, 'data', ''));
      mocks.process.fork.mockImplementation(() => mockSpawn(0, 'Immich Server is listening', ''));
      mocks.storage.rename.mockResolvedValue();
      mocks.storage.unlink.mockResolvedValue();
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(mockData()));
      mocks.storage.createWriteStream.mockReturnValue(new PassThrough());
      mocks.storage.createGzip.mockReturnValue(new PassThrough());
      mocks.storage.createGunzip.mockReturnValue(new PassThrough());
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

    it('should fail to restore invalid backup', async () => {
      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'filename',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: Invalid backup file format!',
        task: 'error',
      });
    });

    it('should successfully run a backup', async () => {
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

      expect(maintenanceHealthRepositoryMock.checkApiHealth).toHaveBeenCalled();
      expect(mocks.process.spawnDuplexStream).toHaveBeenCalledTimes(3);
    });

    it('should fail if backup creation fails', async () => {
      mocks.process.spawnDuplexStream.mockReturnValueOnce(mockDuplex('pg_dump', 1, '', 'error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: pg_dump non-zero exit code (1)\nerror',
        task: 'error',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenLastCalledWith(
        'MaintenanceStatusV1',
        expect.any(String),
        expect.objectContaining({
          task: 'error',
        }),
      );
    });

    it('should fail if restore itself fails', async () => {
      mocks.process.spawnDuplexStream
        .mockReturnValueOnce(mockDuplex('pg_dump', 0, 'data', ''))
        .mockReturnValueOnce(mockDuplex('gzip', 0, 'data', ''))
        .mockReturnValueOnce(mockDuplex('psql', 1, '', 'error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: psql non-zero exit code (1)\nerror',
        task: 'error',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenLastCalledWith(
        'MaintenanceStatusV1',
        expect.any(String),
        expect.objectContaining({
          task: 'error',
        }),
      );
    });

    it('should rollback if database migrations fail', async () => {
      mocks.database.runMigrations.mockRejectedValue(new Error('Migrations Error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: Migrations Error',
        task: 'error',
      });

      expect(maintenanceHealthRepositoryMock.checkApiHealth).toHaveBeenCalledTimes(0);
      expect(mocks.process.spawnDuplexStream).toHaveBeenCalledTimes(4);
    });

    it('should rollback if API healthcheck fails', async () => {
      maintenanceHealthRepositoryMock.checkApiHealth.mockRejectedValue(new Error('Health Error'));

      await sut.runAction({
        action: MaintenanceAction.RestoreDatabase,
        restoreBackupFilename: 'development-filename.sql',
      });

      expect(maintenanceWebsocketRepositoryMock.clientSend).toHaveBeenCalledWith('MaintenanceStatusV1', 'private', {
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        error: 'Error: Health Error',
        task: 'error',
      });

      expect(maintenanceHealthRepositoryMock.checkApiHealth).toHaveBeenCalled();
      expect(mocks.process.spawnDuplexStream).toHaveBeenCalledTimes(4);
    });
  });

  /**
   * Backups
   */

  describe('listBackups', () => {
    it('should give us all backups', async () => {
      mocks.storage.readdir.mockResolvedValue([
        `immich-db-backup-${DateTime.fromISO('2025-07-25T11:02:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
        `immich-db-backup-${DateTime.fromISO('2025-07-27T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
        'immich-db-backup-1753789649000.sql.gz',
        `immich-db-backup-${DateTime.fromISO('2025-07-29T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
      ]);
      mocks.storage.stat.mockResolvedValue({ size: 1024 } as any);

      await expect(sut.listBackups()).resolves.toMatchObject({
        backups: [
          { filename: 'immich-db-backup-20250729T110116-v1.234.5-pg14.5.sql.gz', filesize: 1024 },
          { filename: 'immich-db-backup-20250727T110116-v1.234.5-pg14.5.sql.gz', filesize: 1024 },
          { filename: 'immich-db-backup-1753789649000.sql.gz', filesize: 1024 },
        ],
      });
    });
  });

  describe('deleteBackup', () => {
    it('should reject invalid file names', async () => {
      await expect(sut.deleteBackup(['filename'])).rejects.toThrowError(
        new BadRequestException('Invalid backup name!'),
      );
    });

    it('should unlink the target file', async () => {
      await sut.deleteBackup(['filename.sql']);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/filename.sql`,
      );
    });
  });

  describe('uploadBackup', () => {
    it('should reject invalid file names', async () => {
      await expect(sut.uploadBackup({ originalname: 'invalid backup' } as never)).rejects.toThrowError(
        new BadRequestException('Invalid backup name!'),
      );
    });

    it('should write file', async () => {
      await sut.uploadBackup({ originalname: 'path.sql.gz', buffer: 'buffer' } as never);
      expect(mocks.storage.createOrOverwriteFile).toBeCalledWith('/data/backups/uploaded-path.sql.gz', 'buffer');
    });
  });

  describe('downloadBackup', () => {
    it('should reject invalid file names', () => {
      expect(() => sut.downloadBackup('invalid backup')).toThrowError(new BadRequestException('Invalid backup name!'));
    });

    it('should get backup path', () => {
      expect(sut.downloadBackup('hello.sql.gz')).toEqual(
        expect.objectContaining({
          path: '/data/backups/hello.sql.gz',
        }),
      );
    });
  });
});
