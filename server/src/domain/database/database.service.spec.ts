import { newDatabaseRepositoryMock } from '@test';
import { Version } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository } from '../repositories';
import { DatabaseService } from './database.service';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let databaseMock: jest.Mocked<IDatabaseRepository>;

  beforeEach(async () => {
    databaseMock = newDatabaseRepositoryMock();

    sut = new DatabaseService(databaseMock);
    sut.minVectorsVersion = new Version(0, 1, 1);
    sut.maxVectorsVersion = new Version(0, 1, 11);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    let assertVectorsSpy: jest.SpyInstance;

    beforeEach(() => {
      assertVectorsSpy = jest.spyOn(sut, 'assertVectors');
    });

    afterEach(() => {
      assertVectorsSpy.mockRestore();
    });

    it('should initialize the database', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 1));

      await sut.init();

      expect(assertVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    });
  });

  describe('assertVectors', () => {
    let createVectorsSpy: jest.SpyInstance;

    beforeEach(() => {
      createVectorsSpy = jest.spyOn(sut, 'createVectors');
    });

    afterEach(() => {
      createVectorsSpy.mockRestore();
    });

    it('should return if minimum supported vectors version is installed', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 1));

      await sut.assertVectors();

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });

    it('should return if maximum supported vectors version is installed', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 11));

      await sut.assertVectors();

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if vectors version is not installed even after createVectors', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(null);

      await expect(sut.assertVectors()).rejects.toThrow('Unexpected: The pgvecto.rs extension is not installed.');

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if vectors version is a nightly', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 0, 0));

      await expect(sut.assertVectors()).rejects.toThrow();

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if vectors version is below minimum supported version', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 0, 1));

      await expect(sut.assertVectors()).rejects.toThrow();

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if vectors version is above maximum supported version', async () => {
      databaseMock.getExtensionVersion.mockResolvedValueOnce(new Version(0, 1, 12));

      await expect(sut.assertVectors()).rejects.toThrow();

      expect(createVectorsSpy).toHaveBeenCalledTimes(1);
      expect(databaseMock.getExtensionVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('createVectors', () => {
    it('should create vectors extension', async () => {
      await sut.createVectors();

      expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTORS);
      expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    });

    it('should throw error if vectors extension could not be created', async () => {
      databaseMock.createExtension.mockRejectedValueOnce(new Error('Failed to create extension'));

      await expect(sut.createVectors()).rejects.toThrow('Failed to create extension');
    });
  });

  describe('getVectorsImage', () => {
    it('should return pgvecto.rs image', async () => {
      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg14-v0.1.11');
    });

    it('should set the correct postgres version', async () => {
      [14, 15, 16].forEach((major) => databaseMock.getPostgresVersion.mockResolvedValueOnce(new Version(major, 0, 0)));

      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg14-v0.1.11');
      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg15-v0.1.11');
      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg16-v0.1.11');
    });

    it('should use the maximum supported version', async () => {
      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg14-v0.1.11');

      sut.maxVectorsVersion = new Version(0, 1, 12);

      expect(await sut.getVectorsImage()).toEqual('tensorchord/pgvecto-rs:pg14-v0.1.12');
    });
  });
});
