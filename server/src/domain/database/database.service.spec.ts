import {
  DatabaseExtension,
  DatabaseService,
  IDatabaseRepository,
  VectorIndex,
  Version,
  VersionType,
} from '@app/domain';
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
  ] as const)('init', ({ vectorExt, extName, minVersion }) => {
    let fatalLog: jest.SpyInstance;
    let errorLog: jest.SpyInstance;
    let warnLog: jest.SpyInstance;

    beforeEach(async () => {
      fatalLog = jest.spyOn(ImmichLogger.prototype, 'fatal');
      errorLog = jest.spyOn(ImmichLogger.prototype, 'error');
      warnLog = jest.spyOn(ImmichLogger.prototype, 'warn');
      databaseMock.getPreferredVectorExtension.mockReturnValue(vectorExt);
      databaseMock.getExtensionVersion.mockResolvedValue(minVersion);

      sut = new DatabaseService(databaseMock);

      sut.minVectorVersion = minVersion;
      sut.minVectorsVersion = minVersion;
      sut.vectorVersionPin = VersionType.MINOR;
      sut.vectorsVersionPin = VersionType.MINOR;
    });

    afterEach(() => {
      fatalLog.mockRestore();
      warnLog.mockRestore();
    });

    it(`should resolve successfully if minimum supported PostgreSQL and ${extName} version are installed`, async () => {
      databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(14, 0, 0));

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

      await expect(sut.init()).rejects.toThrow('PostgreSQL version is 13');

      expect(databaseMock.getPostgresVersion).toHaveBeenCalledTimes(1);
    });

    it(`should resolve successfully if minimum supported ${extName} version is installed`, async () => {
      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.createExtension).toHaveBeenCalledWith(vectorExt);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should throw an error if ${extName} version is not installed even after createVectorExtension`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(null);

      await expect(sut.init()).rejects.toThrow(`Unexpected: ${extName} extension is not installed.`);

      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it(`should throw an error if ${extName} version is below minimum supported version`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(
        new Version(minVersion.major, minVersion.minor - 1, minVersion.patch),
      );

      await expect(sut.init()).rejects.toThrow(extName);

      expect(databaseMock.runMigrations).not.toHaveBeenCalled();
    });

    it.each([
      { type: VersionType.EQUAL, max: 'no', actual: 'patch' },
      { type: VersionType.PATCH, max: 'patch', actual: 'minor' },
      { type: VersionType.MINOR, max: 'minor', actual: 'major' },
    ] as const)(
      `should throw an error if $max upgrade from min version is allowed and ${extName} version is $actual`,
      async ({ type, actual }) => {
        const version = new Version(minVersion.major, minVersion.minor, minVersion.patch);
        version[actual] = minVersion[actual] + 1;
        databaseMock.getExtensionVersion.mockResolvedValue(version);
        if (vectorExt === DatabaseExtension.VECTOR) {
          sut.minVectorVersion = minVersion;
          sut.vectorVersionPin = type;
        } else {
          sut.minVectorsVersion = minVersion;
          sut.vectorsVersionPin = type;
        }

        await expect(sut.init()).rejects.toThrow(extName);

        expect(databaseMock.runMigrations).not.toHaveBeenCalled();
      },
    );

    it(`should throw an error if ${extName} version is a nightly`, async () => {
      databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 0));

      await expect(sut.init()).rejects.toThrow(extName);

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
      const version = new Version(minVersion.major, minVersion.minor + 1, minVersion.patch);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
      expect(databaseMock.updateVectorExtension).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should not update ${extName} if a newer version is higher than the maximum`, async () => {
      const version = new Version(minVersion.major + 1, minVersion.minor, minVersion.patch);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

      await expect(sut.init()).resolves.toBeUndefined();

      expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it(`should warn if attempted to update ${extName} and failed`, async () => {
      const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
      databaseMock.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

      await expect(sut.init()).resolves.toBeUndefined();

      expect(warnLog).toHaveBeenCalledTimes(1);
      expect(warnLog.mock.calls[0][0]).toContain(extName);
      expect(errorLog).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
      expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    });

    it(`should warn if ${extName} update requires restart`, async () => {
      const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
      databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
      databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: true });

      await expect(sut.init()).resolves.toBeUndefined();

      expect(warnLog).toHaveBeenCalledTimes(1);
      expect(warnLog.mock.calls[0][0]).toContain(extName);
      expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
      expect(fatalLog).not.toHaveBeenCalled();
    });

    it.each([{ index: VectorIndex.CLIP }, { index: VectorIndex.FACE }])(
      `should reindex $index if necessary`,
      async ({ index }) => {
        databaseMock.shouldReindex.mockImplementation((indexArg) => Promise.resolve(indexArg === index));

        await expect(sut.init()).resolves.toBeUndefined();

        expect(databaseMock.shouldReindex).toHaveBeenCalledWith(index);
        expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
        expect(databaseMock.reindex).toHaveBeenCalledWith(index);
        expect(databaseMock.reindex).toHaveBeenCalledTimes(1);
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(fatalLog).not.toHaveBeenCalled();
      },
    );

    it.each([{ index: VectorIndex.CLIP }, { index: VectorIndex.FACE }])(
      `should not reindex $index if not necessary`,
      async () => {
        databaseMock.shouldReindex.mockResolvedValue(false);

        await expect(sut.init()).resolves.toBeUndefined();

        expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
        expect(databaseMock.reindex).not.toHaveBeenCalled();
        expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
        expect(fatalLog).not.toHaveBeenCalled();
      },
    );
  });
});
