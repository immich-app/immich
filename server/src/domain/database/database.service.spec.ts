import { ImmichLogger } from '@app/infra/logger';
import { newDatabaseRepositoryMock } from '@test';
import { Version } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository } from '../repositories';
import { DatabaseService } from './database.service';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let databaseMock: jest.Mocked<IDatabaseRepository>;
  let fatalLog: jest.SpyInstance;

  beforeEach(async () => {
    databaseMock = newDatabaseRepositoryMock();
    fatalLog = jest.spyOn(ImmichLogger.prototype, 'fatal');

    sut = new DatabaseService(databaseMock);

    sut.minVectorsVersion = new Version(0, 1, 1);
    sut.maxVectorsVersion = new Version(0, 1, 11);
  });

  afterEach(() => {
    fatalLog.mockRestore();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    it('should return if minimum supported vectors version is installed', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 1));

      await sut.init();

      expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTORS);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it('should return if maximum supported vectors version is installed', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 11));

      await sut.init();

      expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTORS);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it('should throw an error if vectors version is not installed even after createVectors', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(null);

      await expect(sut.init()).rejects.toThrow('Unexpected: The pgvecto.rs extension is not installed.');

      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it('should throw an error if vectors version is below minimum supported version', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 0, 1));

      await expect(sut.init()).rejects.toThrow(/('tensorchord\/pgvecto-rs:pg14-v0.1.11')/s);

      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it('should throw an error if vectors version is above maximum supported version', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 12));

      await expect(sut.init()).rejects.toThrow(
        /('DROP EXTENSION IF EXISTS vectors').*('tensorchord\/pgvecto-rs:pg14-v0\.1\.11')/s,
      );

      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it('should throw an error if vectors version is a nightly', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 0, 0));

      await expect(sut.init()).rejects.toThrow(
        /(nightly).*('DROP EXTENSION IF EXISTS vectors').*('tensorchord\/pgvecto-rs:pg14-v0\.1\.11')/s,
      );

      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it('should throw error if vectors extension could not be created', async () => {
      databaseMock.createExtension.mockRejectedValueOnce(new Error('Failed to create extension'));

      await expect(sut.init()).rejects.toThrow('Failed to create extension');

      expect(fatalLog).toHaveBeenCalledTimes(1);
      expect(fatalLog.mock.calls[0][0]).toMatch(/('tensorchord\/pgvecto-rs:pg14-v0\.1\.11').*(v1\.91\.0)/s);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    for (const major of [14, 15, 16]) {
      it(`should suggest image with postgres ${major} if database is ${major}`, async () => {
        databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 1));
        databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(major, 0, 0));

        await expect(sut.init()).rejects.toThrow(new RegExp(`tensorchord\/pgvecto-rs:pg${major}-v0\\.1\\.11`, 's'));
      });
    }

    it('should not suggest image if postgres version is not in 14, 15 or 16', async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 1));
      [13, 17].forEach((major) => databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(major, 0, 0)));

      await expect(sut.init()).rejects.toThrow(/^(?:(?!tensorchord\/pgvecto-rs).)*$/s);
      await expect(sut.init()).rejects.toThrow(/^(?:(?!tensorchord\/pgvecto-rs).)*$/s);
    });

    it('should set the image to the maximum supported version', async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 1));

      await expect(sut.init()).rejects.toThrow(/('tensorchord\/pgvecto-rs:pg14-v0\.1\.11')/s);

      sut.maxVectorsVersion = new Version(0, 1, 12);
      await expect(sut.init()).rejects.toThrow(/('tensorchord\/pgvecto-rs:pg14-v0\.1\.12')/s);
    });
  });
});
