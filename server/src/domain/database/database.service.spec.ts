import { DatabaseExtension, DatabaseService, IDatabaseRepository, Version, VersionType } from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { newDatabaseRepositoryMock } from '@test';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let databaseMock: jest.Mocked<IDatabaseRepository>;

  beforeEach(async () => {
    databaseMock = newDatabaseRepositoryMock();

    sut = new DatabaseService(databaseMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe.each([
    [{ vectorExt: DatabaseExtension.VECTORS, extName: 'pgvecto.rs', minVersion: new Version(0, 1, 1) }],
    [{ vectorExt: DatabaseExtension.VECTOR, extName: 'pgvector', minVersion: new Version(0, 5, 0) }],
  ])('init', ({ vectorExt, extName, minVersion }) => {
    let fatalLog: jest.SpyInstance;
    let warnLog: jest.SpyInstance;

    beforeEach(async () => {
      fatalLog = jest.spyOn(ImmichLogger.prototype, 'fatal');
      warnLog = jest.spyOn(ImmichLogger.prototype, 'warn');
      databaseMock.getPreferredVectorExtension.mockReturnValue(vectorExt);

      sut = new DatabaseService(databaseMock);

      sut.minVectorsVersion = minVersion;
      sut.vectorsVersionPin = VersionType.MINOR;
    });

    afterEach(() => {
      fatalLog.mockRestore();
      warnLog.mockRestore();
    });

    it(`should resolve successfully if minimum supported PostgreSQL and ${extName} version are installed`, async () => {
      databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(14, 0, 0));
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.getPostgresVersion).toHaveBeenCalled();
      expect(databaseMock.createExtension).toHaveBeenCalledWith(vectorExt);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it('should throw an error if PostgreSQL version is below minimum supported version', async () => {
      databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(13, 0, 0));

      await expect(sut.init()).rejects.toThrow(/PostgreSQL version is 13/s);

      expect(databaseMock.getPostgresVersion).toHaveBeenCalledTimes(1);
    });

    it(`should resolve successfully if minimum supported ${extName} version is installed`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.createExtension).toHaveBeenCalledWith(vectorExt);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should throw an error if ${extName} version is not installed even after createVectors`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(null);

      await expect(sut.init()).rejects.toThrow(`Unexpected: The ${extName} extension is not installed.`);

      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw an error if ${extName} version is below minimum supported version`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(
        new Version(minVersion.major, minVersion.minor - 1, minVersion.patch),
      );

      await expect(sut.init()).rejects.toThrow();

      expect(fatalLog).toHaveBeenCalledTimes(1);
      expect(fatalLog.mock.calls[0][0]).toContain(extName);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it.each([
      { type: VersionType.PATCH, field: 'patch' },
      { type: VersionType.MINOR, field: 'minor' },
      { type: VersionType.MAJOR, field: 'major' },
    ] as const)(
      `should throw an error if ${extName} version is above pinned $field version`,
      async ({ type, field }) => {
        const version = new Version(minVersion.major, minVersion.minor, minVersion.patch);
        version[field] = minVersion[field] + 1;
        databaseMock.getExtensionVersion.mockResolvedValue(version);
        if (vectorExt === DatabaseExtension.VECTOR) {
          sut.minVectorVersion = minVersion;
          sut.vectorVersionPin = type;
        } else {
          sut.minVectorsVersion = minVersion;
          sut.vectorsVersionPin = type;
        }

        await expect(sut.init()).rejects.toThrow();

        expect(fatalLog).toHaveBeenCalledTimes(1);
        expect(fatalLog.mock.calls[0][0]).toContain(extName);
        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      },
    );

    it(`should throw an error if ${extName} version is a nightly`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 0));

      await expect(sut.init()).rejects.toThrow();

      expect(fatalLog).toHaveBeenCalledTimes(1);
      expect(fatalLog.mock.calls[0][0]).toContain(extName);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw error if ${extName} extension could not be created`, async () => {
      databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

      await expect(sut.init()).rejects.toThrow('Failed to create extension');

      expect(fatalLog).toHaveBeenCalledTimes(1);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should update ${extName} if a newer version is available`, async () => {
      const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.updateExtension).toHaveBeenCalledWith(vectorExt, version);
      expect(databaseMock.updateExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should not update ${extName} if a newer version is higher than the maximum`, async () => {
      const version = new Version(minVersion.major + 1, minVersion.minor, minVersion.patch);
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.updateExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should warn if attempted to update ${extName} and failed`, async () => {
      const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
      databaseMock.updateExtension.mockRejectedValue(new Error('Failed to update extension'));

      await expect(sut.init()).resolves.toBeUndefined();

      expect(warnLog).toHaveBeenCalledTimes(1);
      expect(warnLog.mock.calls[0][0]).toContain(extName);
      expect(databaseMock.updateExtension).toHaveBeenCalledWith(vectorExt, version);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });
  });
});
