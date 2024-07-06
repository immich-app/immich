import { DatabaseExtension, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { DatabaseService } from 'src/services/database.service';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { Mocked } from 'vitest';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let databaseMock: Mocked<IDatabaseRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    delete process.env.DB_SKIP_MIGRATIONS;
    delete process.env.DB_VECTOR_EXTENSION;
    databaseMock = newDatabaseRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new DatabaseService(databaseMock, loggerMock);

    databaseMock.getExtensionVersion.mockResolvedValue('0.2.0');
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if PostgreSQL version is below minimum supported version', async () => {
    databaseMock.getPostgresVersion.mockResolvedValueOnce('13.10.0');

    await expect(sut.onBootstrapEvent()).rejects.toThrow('Invalid PostgreSQL version. Found 13.10.0');

    expect(databaseMock.getPostgresVersion).toHaveBeenCalledTimes(1);
  });

  it(`should start up successfully with pgvectors`, async () => {
    databaseMock.getPostgresVersion.mockResolvedValue('14.0.0');

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(databaseMock.getPostgresVersion).toHaveBeenCalled();
    expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTORS);
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it(`should start up successfully with pgvector`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getPostgresVersion.mockResolvedValue('14.0.0');
    databaseMock.getExtensionVersion.mockResolvedValue('0.5.0');

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTOR);
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it(`should throw an error if the pgvecto.rs extension is not installed`, async () => {
    databaseMock.getExtensionVersion.mockResolvedValue('');
    await expect(sut.onBootstrapEvent()).rejects.toThrow(`Unexpected: The pgvecto.rs extension is not installed.`);

    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw an error if the pgvector extension is not installed`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('');
    await expect(sut.onBootstrapEvent()).rejects.toThrow(`Unexpected: The pgvector extension is not installed.`);

    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw an error if the pgvecto.rs extension version is below minimum supported version`, async () => {
    databaseMock.getExtensionVersion.mockResolvedValue('0.1.0');

    await expect(sut.onBootstrapEvent()).rejects.toThrow(
      'The pgvecto.rs extension version is 0.1.0, but Immich only supports 0.2.x.',
    );

    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw an error if the pgvector extension version is below minimum supported version`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('0.1.0');

    await expect(sut.onBootstrapEvent()).rejects.toThrow(
      'The pgvector extension version is 0.1.0, but Immich only supports >=0.5 <1',
    );

    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw an error if pgvecto.rs extension version is a nightly`, async () => {
    databaseMock.getExtensionVersion.mockResolvedValue('0.0.0');

    await expect(sut.onBootstrapEvent()).rejects.toThrow(
      'The pgvecto.rs extension version is 0.0.0, which means it is a nightly release.',
    );

    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw an error if pgvector extension version is a nightly`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('0.0.0');

    await expect(sut.onBootstrapEvent()).rejects.toThrow(
      'The pgvector extension version is 0.0.0, which means it is a nightly release.',
    );

    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw error if pgvecto.rs extension could not be created`, async () => {
    databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

    await expect(sut.onBootstrapEvent()).rejects.toThrow('Failed to create extension');

    expect(loggerMock.fatal).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal.mock.calls[0][0]).toContain(
      'Alternatively, if your Postgres instance has pgvector, you may use this instead',
    );
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  it(`should throw error if pgvector extension could not be created`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('0.0.0');
    databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

    await expect(sut.onBootstrapEvent()).rejects.toThrow('Failed to create extension');

    expect(loggerMock.fatal).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal.mock.calls[0][0]).toContain(
      'Alternatively, if your Postgres instance has pgvecto.rs, you may use this instead',
    );
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });

  for (const version of ['0.2.1', '0.2.0', '0.2.9']) {
    it(`should update the pgvecto.rs extension to ${version}`, async () => {
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
      databaseMock.getExtensionVersion.mockResolvedValueOnce(void 0);
      databaseMock.getExtensionVersion.mockResolvedValue(version);

      await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vectors', version);
      expect(databaseMock.updateVectorExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal).not.toHaveBeenCalled();
    });
  }

  for (const version of ['0.5.1', '0.6.0', '0.7.10']) {
    it(`should update the pgvectors extension to ${version}`, async () => {
      process.env.DB_VECTOR_EXTENSION = 'pgvector';
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
      databaseMock.getExtensionVersion.mockResolvedValueOnce(void 0);
      databaseMock.getExtensionVersion.mockResolvedValue(version);

      await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vector', version);
      expect(databaseMock.updateVectorExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal).not.toHaveBeenCalled();
    });
  }

  for (const version of ['0.1.0', '0.3.0', '1.0.0']) {
    it(`should not upgrade pgvecto.rs to ${version}`, async () => {
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal).not.toHaveBeenCalled();
    });
  }

  for (const version of ['0.4.0', '0.7.1', '0.7.2', '1.0.0']) {
    it(`should not upgrade pgvector to ${version}`, async () => {
      process.env.DB_VECTOR_EXTENSION = 'pgvector';
      databaseMock.getExtensionVersion.mockResolvedValue('0.7.2');
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(loggerMock.fatal).not.toHaveBeenCalled();
    });
  }

  it(`should warn if the pgvecto.rs extension upgrade failed`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('0.5.0');
    databaseMock.getAvailableExtensionVersion.mockResolvedValue('0.5.2');
    databaseMock.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(loggerMock.warn.mock.calls[0][0]).toContain('The pgvector extension can be updated to 0.5.2.');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
    expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vector', '0.5.2');
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  });

  it(`should warn if the pgvector extension upgrade failed`, async () => {
    databaseMock.getAvailableExtensionVersion.mockResolvedValue('0.2.1');
    databaseMock.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(loggerMock.warn.mock.calls[0][0]).toContain('The pgvecto.rs extension can be updated to 0.2.1.');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
    expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vectors', '0.2.1');
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  });

  it(`should warn if the pgvecto.rs extension update requires restart`, async () => {
    databaseMock.getAvailableExtensionVersion.mockResolvedValue('0.2.1');
    databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: true });

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn.mock.calls[0][0]).toContain('pgvecto.rs');
    expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vectors', '0.2.1');
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it(`should warn if the pgvector extension update requires restart`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getExtensionVersion.mockResolvedValue('0.5.0');
    databaseMock.getAvailableExtensionVersion.mockResolvedValue('0.5.1');
    databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: true });

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn.mock.calls[0][0]).toContain('pgvector');
    expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith('vector', '0.5.1');
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it('should reindex if needed', async () => {
    databaseMock.shouldReindex.mockResolvedValue(true);

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
    expect(databaseMock.reindex).toHaveBeenCalledTimes(2);
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it('should not reindex if not needed', async () => {
    databaseMock.shouldReindex.mockResolvedValue(false);

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
    expect(databaseMock.reindex).toHaveBeenCalledTimes(0);
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it('should skip migrations if DB_SKIP_MIGRATIONS=true', async () => {
    process.env.DB_SKIP_MIGRATIONS = 'true';
    databaseMock.getExtensionVersion.mockResolvedValue('0.2.0');

    await expect(sut.onBootstrapEvent()).resolves.toBeUndefined();

    expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  });
});
