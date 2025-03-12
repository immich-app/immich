import { EXTENSION_NAMES } from 'src/constants';
import { DatabaseExtension } from 'src/enum';
import { DatabaseService } from 'src/services/database.service';
import { VectorExtension } from 'src/types';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let mocks: ServiceMocks;

  let extensionRange: string;
  let versionBelowRange: string;
  let minVersionInRange: string;
  let updateInRange: string;
  let versionAboveRange: string;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DatabaseService));

    extensionRange = '0.2.x';
    mocks.database.getExtensionVersionRange.mockReturnValue(extensionRange);

    versionBelowRange = '0.1.0';
    minVersionInRange = '0.2.0';
    updateInRange = '0.2.1';
    versionAboveRange = '0.3.0';
    mocks.database.getExtensionVersion.mockResolvedValue({
      installedVersion: minVersionInRange,
      availableVersion: minVersionInRange,
    });
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should throw an error if PostgreSQL version is below minimum supported version', async () => {
      mocks.database.getPostgresVersion.mockResolvedValueOnce('13.10.0');

      await expect(sut.onBootstrap()).rejects.toThrow('Invalid PostgreSQL version. Found 13.10.0');

      expect(mocks.database.getPostgresVersion).toHaveBeenCalledTimes(1);
    });

    describe.each(<Array<{ extension: VectorExtension; extensionName: string }>>[
      { extension: DatabaseExtension.VECTOR, extensionName: EXTENSION_NAMES[DatabaseExtension.VECTOR] },
      { extension: DatabaseExtension.VECTORS, extensionName: EXTENSION_NAMES[DatabaseExtension.VECTORS] },
    ])('should work with $extensionName', ({ extension, extensionName }) => {
      beforeEach(() => {
        mocks.config.getEnv.mockReturnValue(
          mockEnvData({
            database: {
              config: {
                kysely: {
                  host: 'database',
                  port: 5432,
                  user: 'postgres',
                  password: 'postgres',
                  database: 'immich',
                },
                typeorm: {
                  connectionType: 'parts',
                  type: 'postgres',
                  host: 'database',
                  port: 5432,
                  username: 'postgres',
                  password: 'postgres',
                  database: 'immich',
                },
              },
              skipMigrations: false,
              vectorExtension: extension,
            },
          }),
        );
      });

      it(`should start up successfully with ${extension}`, async () => {
        mocks.database.getPostgresVersion.mockResolvedValue('14.0.0');
        mocks.database.getExtensionVersion.mockResolvedValue({
          installedVersion: null,
          availableVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.database.getPostgresVersion).toHaveBeenCalled();
        expect(mocks.database.createExtension).toHaveBeenCalledWith(extension);
        expect(mocks.database.createExtension).toHaveBeenCalledTimes(1);
        expect(mocks.database.getExtensionVersion).toHaveBeenCalled();
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should throw an error if the ${extension} extension is not installed`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({ installedVersion: null, availableVersion: null });
        const message = `The ${extensionName} extension is not available in this Postgres instance.
    If using a container image, ensure the image has the extension installed.`;
        await expect(sut.onBootstrap()).rejects.toThrow(message);

        expect(mocks.database.createExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
      });

      it(`should throw an error if the ${extension} extension version is below minimum supported version`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          installedVersion: versionBelowRange,
          availableVersion: versionBelowRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is ${versionBelowRange}, but Immich only supports ${extensionRange}`,
        );

        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
      });

      it(`should throw an error if ${extension} extension version is a nightly`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({ installedVersion: '0.0.0', availableVersion: '0.0.0' });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is 0.0.0, which means it is a nightly release.`,
        );

        expect(mocks.database.createExtension).not.toHaveBeenCalled();
        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
      });

      it(`should do in-range update for ${extension} extension`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        mocks.database.updateVectorExtension.mockResolvedValue({ restartRequired: false });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.database.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(mocks.database.updateVectorExtension).toHaveBeenCalledTimes(1);
        expect(mocks.database.getExtensionVersion).toHaveBeenCalled();
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should not upgrade ${extension} if same version`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should throw error if ${extension} available version is below range`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: versionBelowRange,
          installedVersion: null,
        });

        await expect(sut.onBootstrap()).rejects.toThrow();

        expect(mocks.database.createExtension).not.toHaveBeenCalled();
        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should throw error if ${extension} available version is above range`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: versionAboveRange,
          installedVersion: minVersionInRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow();

        expect(mocks.database.createExtension).not.toHaveBeenCalled();
        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it('should throw error if available version is below installed version', async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: updateInRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The database currently has ${extensionName} ${updateInRange} activated, but the Postgres instance only has ${minVersionInRange} available.`,
        );

        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it('should throw error if installed version is not in version range', async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: minVersionInRange,
          installedVersion: versionAboveRange,
        });

        await expect(sut.onBootstrap()).rejects.toThrow(
          `The ${extensionName} extension version is ${versionAboveRange}, but Immich only supports`,
        );

        expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should raise error if ${extension} extension upgrade failed`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        mocks.database.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

        await expect(sut.onBootstrap()).rejects.toThrow('Failed to update extension');

        expect(mocks.logger.warn.mock.calls[0][0]).toContain(
          `The ${extensionName} extension can be updated to ${updateInRange}.`,
        );
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
        expect(mocks.database.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
      });

      it(`should warn if ${extension} extension update requires restart`, async () => {
        mocks.database.getExtensionVersion.mockResolvedValue({
          availableVersion: updateInRange,
          installedVersion: minVersionInRange,
        });
        mocks.database.updateVectorExtension.mockResolvedValue({ restartRequired: true });

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.logger.warn).toHaveBeenCalledTimes(1);
        expect(mocks.logger.warn.mock.calls[0][0]).toContain(extensionName);
        expect(mocks.database.updateVectorExtension).toHaveBeenCalledWith(extension, updateInRange);
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should reindex ${extension} indices if needed`, async () => {
        mocks.database.shouldReindex.mockResolvedValue(true);

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.database.shouldReindex).toHaveBeenCalledTimes(2);
        expect(mocks.database.reindex).toHaveBeenCalledTimes(2);
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });

      it(`should throw an error if reindexing fails`, async () => {
        mocks.database.shouldReindex.mockResolvedValue(true);
        mocks.database.reindex.mockRejectedValue(new Error('Error reindexing'));

        await expect(sut.onBootstrap()).rejects.toBeDefined();

        expect(mocks.database.shouldReindex).toHaveBeenCalledTimes(1);
        expect(mocks.database.reindex).toHaveBeenCalledTimes(1);
        expect(mocks.database.runMigrations).not.toHaveBeenCalled();
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
        expect(mocks.logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Could not run vector reindexing checks.'),
        );
      });

      it(`should not reindex ${extension} indices if not needed`, async () => {
        mocks.database.shouldReindex.mockResolvedValue(false);

        await expect(sut.onBootstrap()).resolves.toBeUndefined();

        expect(mocks.database.shouldReindex).toHaveBeenCalledTimes(2);
        expect(mocks.database.reindex).toHaveBeenCalledTimes(0);
        expect(mocks.database.runMigrations).toHaveBeenCalledTimes(1);
        expect(mocks.logger.fatal).not.toHaveBeenCalled();
      });
    });

    it('should skip migrations if DB_SKIP_MIGRATIONS=true', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          database: {
            config: {
              kysely: {
                host: 'database',
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                database: 'immich',
              },
              typeorm: {
                connectionType: 'parts',
                type: 'postgres',
                host: 'database',
                port: 5432,
                username: 'postgres',
                password: 'postgres',
                database: 'immich',
              },
            },
            skipMigrations: true,
            vectorExtension: DatabaseExtension.VECTORS,
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.database.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw error if pgvector extension could not be created`, async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          database: {
            config: {
              kysely: {
                host: 'database',
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                database: 'immich',
              },
              typeorm: {
                connectionType: 'parts',
                type: 'postgres',
                host: 'database',
                port: 5432,
                username: 'postgres',
                password: 'postgres',
                database: 'immich',
              },
            },
            skipMigrations: true,
            vectorExtension: DatabaseExtension.VECTOR,
          },
        }),
      );
      mocks.database.getExtensionVersion.mockResolvedValue({
        installedVersion: null,
        availableVersion: minVersionInRange,
      });
      mocks.database.updateVectorExtension.mockResolvedValue({ restartRequired: false });
      mocks.database.createExtension.mockRejectedValue(new Error('Failed to create extension'));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to create extension');

      expect(mocks.logger.fatal).toHaveBeenCalledTimes(1);
      expect(mocks.logger.fatal.mock.calls[0][0]).toContain(
        `Alternatively, if your Postgres instance has pgvecto.rs, you may use this instead`,
      );
      expect(mocks.database.createExtension).toHaveBeenCalledTimes(1);
      expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
      expect(mocks.database.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw error if pgvecto.rs extension could not be created`, async () => {
      mocks.database.getExtensionVersion.mockResolvedValue({
        installedVersion: null,
        availableVersion: minVersionInRange,
      });
      mocks.database.updateVectorExtension.mockResolvedValue({ restartRequired: false });
      mocks.database.createExtension.mockRejectedValue(new Error('Failed to create extension'));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to create extension');

      expect(mocks.logger.fatal).toHaveBeenCalledTimes(1);
      expect(mocks.logger.fatal.mock.calls[0][0]).toContain(
        `Alternatively, if your Postgres instance has pgvector, you may use this instead`,
      );
      expect(mocks.database.createExtension).toHaveBeenCalledTimes(1);
      expect(mocks.database.updateVectorExtension).not.toHaveBeenCalled();
      expect(mocks.database.runMigrations).not.toHaveBeenCalled();
    });
  });
});
