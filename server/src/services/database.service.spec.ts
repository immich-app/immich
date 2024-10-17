import { IConfigRepository } from 'src/interfaces/config.interface';
import {
  DatabaseExtension,
  EXTENSION_NAMES,
  IDatabaseRepository,
  VectorExtension,
} from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { DatabaseService } from 'src/services/database.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;

  let configMock: Mocked<IConfigRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let extensionRange: string;
  let versionBelowRange: string;
  let minVersionInRange: string;
  let updateInRange: string;
  let versionAboveRange: string;

  beforeEach(() => {
    ({ sut, configMock, databaseMock, loggerMock } = newTestService(DatabaseService));

    extensionRange = '0.2.x';
    databaseMock.getExtensionVersionRange.mockReturnValue(extensionRange);

    versionBelowRange = '0.1.0';
    minVersionInRange = '0.2.0';
    updateInRange = '0.2.1';
    versionAboveRange = '0.3.0';
    databaseMock.getExtensionVersion.mockResolvedValue({
      installedVersion: minVersionInRange,
      availableVersion: minVersionInRange,
    });
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should throw an error if PostgreSQL version is below minimum supported version', async () => {
      databaseMock.getPostgresVersion.mockResolvedValueOnce('13.10.0');

      await expect(sut.onBootstrap()).rejects.toThrow('Invalid PostgreSQL version. Found 13.10.0');

      expect(databaseMock.getPostgresVersion).toHaveBeenCalledTimes(1);
    });

    describe.each(<Array<{ extension: VectorExtension; extensionName: string }>>[
      { extension: DatabaseExtension.VECTOR, extensionName: EXTENSION_NAMES[DatabaseExtension.VECTOR] },
      { extension: DatabaseExtension.VECTORS, extensionName: EXTENSION_NAMES[DatabaseExtension.VECTORS] },
    ])('should work with $extensionName', ({ extension, extensionName }) => {
      beforeEach(() => {
        configMock.getEnv.mockReturnValue(
          mockEnvData({
            database: {
              host: 'database',
              port: 5432,
              username: 'postgres',
              password: 'postgres',
              name: 'immich',
              skipMigrations: false,
              vectorExtension: extension,
            },
          }),
        );
      });

      it(`should start up successfully with ${extension}`, async () => {
        databaseMock.getPostgresVersion.mockResolvedValue('14.0.0');
        databaseMock.getExtensionVersion.mockResolvedValue({
          installedVersion: null,
          availableVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(databaseMock.getPostgresVersion).toHaveBeenCalled();
        expect(databaseMock.createExtension).toHaveBeenCalledWith(extension);
        expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
        expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should throw an error if the ${extension} extension is not installed`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({ installedVersion: null, availableVersion: null });
        const message = `The ${extensionName} extension is not available in this Postgres instance.
    If using a container image, ensure the image has the extension installed.`;
        await expect(sut.onBootstrap()).rejects.toThrow(message);

        expect(databaseMock.createExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      });

      it(`should throw an error if the ${extension} extension version is below minimum supported version`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          installedVersion: versionBelowRange,
          availableVersion: versionBelowRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is ${versionBelowRange}, but Immich only supports ${extensionRange}`,
        );

        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      });

      it(`should throw an error if ${extension} extension version is a nightly`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({ installedVersion: '0.0.0', availableVersion: '0.0.0' });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is 0.0.0, which means it is a nightly release.`,
        );

        expect(databaseMock.createExtension).not.toHaveBeenCalled();
        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      });

      it(`should do in-range update for ${extension} extension`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: false });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(databaseMock.updateVectorExtension).toHaveBeenCalledTimes(1);
        expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should not upgrade ${extension} if same version`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should throw error if ${extension} available version is below range`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: versionBelowRange,
          installedVersion: null,
        });

        await expect(sut.onBootstrap()).rejects.toThrow();

        expect(databaseMock.createExtension).not.toHaveBeenCalled();
        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should throw error if ${extension} available version is above range`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: versionAboveRange,
          installedVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow();

        expect(databaseMock.createExtension).not.toHaveBeenCalled();
        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it('should throw error if available version is below installed version', async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: updateInRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The database currently has ${extensionName} ${updateInRange} activated, but the Postgres instance only has ${minVersionInRange} available.`,
        );

        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it('should throw error if installed version is not in version range', async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: versionAboveRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is ${versionAboveRange}, but Immich only supports`,
        );

        expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should raise error if ${extension} extension upgrade failed`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        databaseMock.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

        await expect(sut.onBootstrap()).rejects.toThrow('Failed to update extension');

        expect(loggerMock.warn.mock.calls[0][0]).toContain(
          `The ${extensionName} extension can be updated to ${updateInRange}.`,
        );
        expect(loggerMock.fatal).not.toHaveBeenCalled();
        expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      });

      it(`should warn if ${extension} extension update requires restart`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: true });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn.mock.calls[0][0]).toContain(extensionName);
        expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should reindex ${extension} indices if needed`, async () => {
        databaseMock.shouldReindex.mockResolvedValue(true);

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
        expect(databaseMock.reindex).toHaveBeenCalledTimes(2);
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });

      it(`should throw an error if reindexing fails`, async () => {
        databaseMock.shouldReindex.mockResolvedValue(true);
        databaseMock.reindex.mockRejectedValue(new Error('Error reindexing'));

        await expect(sut.onBootstrap()).rejects.toBeDefined();

        expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(1);
        expect(databaseMock.reindex).toHaveBeenCalledTimes(1);
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
        expect(loggerMock.fatal).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalledWith(
          expect.stringContaining('Could not run vector reindexing checks.'),
        );
      });

      it(`should not reindex ${extension} indices if not needed`, async () => {
        databaseMock.shouldReindex.mockResolvedValue(false);

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
        expect(databaseMock.reindex).toHaveBeenCalledTimes(0);
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(loggerMock.fatal).not.toHaveBeenCalled();
      });
    });

    it('should skip migrations if DB_SKIP_MIGRATIONS=true', async () => {
      configMock.getEnv.mockReturnValue(
        mockEnvData({
          database: {
            host: 'database',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            name: 'immich',
            skipMigrations: true,
            vectorExtension: DatabaseExtension.VECTORS,
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw error if pgvector extension could not be created`, async () => {
      configMock.getEnv.mockReturnValue(
        mockEnvData({
          database: {
            host: 'database',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            name: 'immich',
            skipMigrations: true,
            vectorExtension: DatabaseExtension.VECTOR,
          },
        }),
      );
      databaseMock.getExtensionVersion.mockResolvedValue({
        installedVersion: null,
        availableVersion: minVersionInRange,
      });
      databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: false });
      databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to create extension');

      expect(loggerMock.fatal).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal.mock.calls[0][0]).toContain(
        `Alternatively, if your Postgres instance has pgvecto.rs, you may use this instead`,
      );
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw error if pgvecto.rs extension could not be created`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue({
        installedVersion: null,
        availableVersion: minVersionInRange,
      });
      databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: false });
      databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to create extension');

      expect(loggerMock.fatal).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal.mock.calls[0][0]).toContain(
        `Alternatively, if your Postgres instance has pgvector, you may use this instead`,
      );
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });
  });

  describe('handleConnectionError', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should not override interval', () => {
      sut.handleConnectionError(new Error('Error'));
      expect(loggerMock.error).toHaveBeenCalled();

      sut.handleConnectionError(new Error('foo'));
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });

    it('should reconnect when interval elapses', async () => {
      databaseMock.reconnect.mockResolvedValue(true);

      sut.handleConnectionError(new Error('error'));
      await vi.advanceTimersByTimeAsync(5000);

      expect(databaseMock.reconnect).toHaveBeenCalledTimes(1);
      expect(loggerMock.log).toHaveBeenCalledWith('Database reconnected');

      await vi.advanceTimersByTimeAsync(5000);
      expect(databaseMock.reconnect).toHaveBeenCalledTimes(1);
    });

    it('should try again when reconnection fails', async () => {
      databaseMock.reconnect.mockResolvedValueOnce(false);

      sut.handleConnectionError(new Error('error'));
      await vi.advanceTimersByTimeAsync(5000);

      expect(databaseMock.reconnect).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));

      databaseMock.reconnect.mockResolvedValueOnce(true);
      await vi.advanceTimersByTimeAsync(5000);
      expect(databaseMock.reconnect).toHaveBeenCalledTimes(2);
      expect(loggerMock.log).toHaveBeenCalledWith('Database reconnected');
    });
  });
});
