import { Readable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFileType, JobName, JobStatus, QueueName } from 'src/enum';
import { StorageMigrationService } from 'src/services/storage-migration.service';
import { StorageService } from 'src/services/storage.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(StorageMigrationService.name, () => {
  let sut: StorageMigrationService;
  let mocks: ServiceMocks;

  let mockDiskBackend: {
    exists: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getServeStrategy: ReturnType<typeof vi.fn>;
    downloadToTemp: ReturnType<typeof vi.fn>;
  };

  let mockS3Backend: {
    exists: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getServeStrategy: ReturnType<typeof vi.fn>;
    downloadToTemp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StorageMigrationService));

    mockDiskBackend = {
      exists: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getServeStrategy: vi.fn(),
      downloadToTemp: vi.fn(),
    };

    mockS3Backend = {
      exists: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getServeStrategy: vi.fn(),
      downloadToTemp: vi.fn(),
    };

    vi.spyOn(StorageService, 'getDiskBackend').mockReturnValue(
      mockDiskBackend as unknown as ReturnType<typeof StorageService.getDiskBackend>,
    );
    vi.spyOn(StorageService, 'getS3Backend').mockReturnValue(
      mockS3Backend as unknown as ReturnType<typeof StorageService.getS3Backend>,
    );
    vi.spyOn(StorageCore, 'getMediaLocation').mockReturnValue('/usr/src/app/upload');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getEstimate', () => {
    it('should return file counts and size from repository', async () => {
      const fileCounts = {
        originals: 100,
        thumbnails: 200,
        previews: 150,
        fullsize: 50,
        sidecars: 10,
        encodedVideos: 30,
        personThumbnails: 20,
        profileImages: 5,
      };
      mocks.storageMigration.getFileCounts.mockResolvedValue(fileCounts);
      mocks.storageMigration.getOriginalsSizeEstimate.mockResolvedValue(1_000_000);

      const result = await sut.getEstimate('toS3');

      expect(result).toEqual({
        direction: 'toS3',
        fileCounts: {
          ...fileCounts,
          total: 565,
        },
        estimatedSizeBytes: 1_000_000,
      });
      expect(mocks.storageMigration.getFileCounts).toHaveBeenCalledWith('toS3');
      expect(mocks.storageMigration.getOriginalsSizeEstimate).toHaveBeenCalledWith('toS3');
    });
  });

  describe('start', () => {
    const defaultOptions = {
      direction: 'toS3' as const,
      deleteSource: false,
      fileTypes: {
        originals: true,
        thumbnails: true,
        previews: true,
        fullsize: true,
        encodedVideos: true,
        sidecars: true,
        personThumbnails: true,
        profileImages: true,
      },
      concurrency: 4,
    };

    const nonZeroFileCounts = {
      originals: 10,
      thumbnails: 0,
      previews: 0,
      fullsize: 0,
      sidecars: 0,
      encodedVideos: 0,
      personThumbnails: 0,
      profileImages: 0,
    };

    it('should validate backend config, check no active migration, queue orchestrator, and return batchId', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 's3' } }));
      mocks.job.isActive.mockResolvedValue(false);
      mockS3Backend.exists.mockResolvedValue(true);
      mocks.storageMigration.getFileCounts.mockResolvedValue(nonZeroFileCounts);

      const result = await sut.start(defaultOptions);

      expect(result).toHaveProperty('batchId');
      expect(typeof result.batchId).toBe('string');
      expect(mocks.job.isActive).toHaveBeenCalledWith(QueueName.StorageBackendMigration);
      expect(mocks.job.queue).toHaveBeenCalledWith(
        expect.objectContaining({
          name: JobName.StorageBackendMigrationQueueAll,
          data: expect.objectContaining({
            direction: 'toS3',
            deleteSource: false,
            batchId: result.batchId,
          }),
        }),
      );
    });

    it('should throw if backend config does not match direction (toS3 but backend=disk)', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 'disk' } }));

      await expect(sut.start(defaultOptions)).rejects.toThrow(
        'Storage backend must be set to "s3" (IMMICH_STORAGE_BACKEND=s3) to migrate to S3',
      );
    });

    it('should throw if backend config does not match direction (toDisk but backend=s3)', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 's3' } }));

      await expect(sut.start({ ...defaultOptions, direction: 'toDisk' })).rejects.toThrow(
        'Storage backend must be set to "disk" (IMMICH_STORAGE_BACKEND=disk) to migrate to disk',
      );
    });

    it('should throw if migration already active', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 's3' } }));
      mocks.job.isActive.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(true);
      mocks.storageMigration.getFileCounts.mockResolvedValue(nonZeroFileCounts);

      await expect(sut.start(defaultOptions)).rejects.toThrow('A storage migration is already in progress');
    });

    it('should throw if there are no files to migrate', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 's3' } }));
      mockS3Backend.exists.mockResolvedValue(true);
      mocks.storageMigration.getFileCounts.mockResolvedValue({
        originals: 0,
        thumbnails: 0,
        previews: 0,
        fullsize: 0,
        sidecars: 0,
        encodedVideos: 0,
        personThumbnails: 0,
        profileImages: 0,
      });

      await expect(sut.start(defaultOptions)).rejects.toThrow('No files to migrate');
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueAll', () => {
    const baseJob = {
      direction: 'toS3' as const,
      deleteSource: false,
      batchId: 'batch-1',
      concurrency: 4,
    };

    const allFileTypes = {
      originals: true,
      thumbnails: true,
      previews: true,
      fullsize: true,
      encodedVideos: true,
      sidecars: true,
      personThumbnails: true,
      profileImages: true,
    };

    beforeEach(() => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ storage: { backend: 's3' } }));
    });

    it('should stream files based on fileTypes flags and queue worker jobs', async () => {
      mocks.storageMigration.streamOriginals.mockReturnValue(
        makeStream([{ id: 'asset-1', originalPath: '/usr/src/app/upload/library/user/ab/cd/file.jpg' }]),
      );
      mocks.storageMigration.streamAssetFiles.mockReturnValue(
        makeStream([
          {
            id: 'file-1',
            assetId: 'asset-1',
            path: '/usr/src/app/upload/thumbs/user/ab/cd/thumb.webp',
            type: AssetFileType.Thumbnail,
          },
        ]),
      );
      mocks.storageMigration.streamEncodedVideos.mockReturnValue(
        makeStream([
          {
            id: 'file-2',
            assetId: 'asset-2',
            path: '/usr/src/app/upload/encoded-video/user/ab/cd/video.mp4',
            type: AssetFileType.EncodedVideo,
          },
        ]),
      );
      mocks.storageMigration.streamPersonThumbnails.mockReturnValue(
        makeStream([{ id: 'person-1', thumbnailPath: '/usr/src/app/upload/thumbs/user/ab/cd/person.jpeg' }]),
      );
      mocks.storageMigration.streamProfileImages.mockReturnValue(
        makeStream([{ id: 'user-1', profileImagePath: '/usr/src/app/upload/profile/user/ab/cd/profile.jpg' }]),
      );

      const result = await sut.handleQueueAll({ ...baseJob, fileTypes: allFileTypes });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.job.queueAll).toHaveBeenCalled();

      // Verify the jobs were queued
      const queuedJobs = mocks.job.queueAll.mock.calls.flat().flat();
      expect(queuedJobs).toHaveLength(5);
      expect(queuedJobs[0]).toEqual(
        expect.objectContaining({
          name: JobName.StorageBackendMigrationSingle,
          data: expect.objectContaining({
            entityType: 'asset',
            entityId: 'asset-1',
            fileType: 'original',
            sourcePath: '/usr/src/app/upload/library/user/ab/cd/file.jpg',
          }),
        }),
      );
    });

    it('should only queue enabled file types (thumbnails=false skips thumbnails)', async () => {
      mocks.storageMigration.streamOriginals.mockReturnValue(
        makeStream([{ id: 'asset-1', originalPath: '/usr/src/app/upload/library/user/ab/cd/file.jpg' }]),
      );
      mocks.storageMigration.streamAssetFiles.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamEncodedVideos.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamPersonThumbnails.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamProfileImages.mockReturnValue(makeStream([]));

      const fileTypes = {
        originals: true,
        thumbnails: false,
        previews: false,
        fullsize: false,
        encodedVideos: false,
        sidecars: false,
        personThumbnails: false,
        profileImages: false,
      };

      const result = await sut.handleQueueAll({ ...baseJob, fileTypes });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storageMigration.streamOriginals).toHaveBeenCalledWith('toS3');
      expect(mocks.storageMigration.streamAssetFiles).not.toHaveBeenCalled();
      expect(mocks.storageMigration.streamEncodedVideos).not.toHaveBeenCalled();
      expect(mocks.storageMigration.streamPersonThumbnails).not.toHaveBeenCalled();
      expect(mocks.storageMigration.streamProfileImages).not.toHaveBeenCalled();
    });

    it('should stream asset files for selected thumbnail types only', async () => {
      mocks.storageMigration.streamOriginals.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamAssetFiles.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamEncodedVideos.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamPersonThumbnails.mockReturnValue(makeStream([]));
      mocks.storageMigration.streamProfileImages.mockReturnValue(makeStream([]));

      const fileTypes = {
        originals: false,
        thumbnails: true,
        previews: true,
        fullsize: false,
        encodedVideos: false,
        sidecars: false,
        personThumbnails: false,
        profileImages: false,
      };

      await sut.handleQueueAll({ ...baseJob, fileTypes });

      expect(mocks.storageMigration.streamOriginals).not.toHaveBeenCalled();
      expect(mocks.storageMigration.streamAssetFiles).toHaveBeenCalledWith('toS3', [
        AssetFileType.Thumbnail,
        AssetFileType.Preview,
      ]);
    });
  });

  describe('handleMigration', () => {
    const baseJob = {
      entityType: 'asset' as const,
      entityId: 'asset-1',
      fileType: 'original' as string | null,
      sourcePath: '/usr/src/app/upload/library/user/ab/cd/file.jpg',
      batchId: 'batch-1',
      direction: 'toS3' as const,
      deleteSource: false,
    };

    it('should copy file from source to target, update DB path, write migration log, and return Success', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(baseJob);

      expect(result).toBe(JobStatus.Success);
      // For toS3: source is disk, target is S3
      expect(mockDiskBackend.exists).toHaveBeenCalledWith(baseJob.sourcePath);
      expect(mockS3Backend.exists).toHaveBeenCalledWith('library/user/ab/cd/file.jpg');
      expect(mockDiskBackend.get).toHaveBeenCalledWith(baseJob.sourcePath);
      expect(mockS3Backend.put).toHaveBeenCalledWith('library/user/ab/cd/file.jpg', mockStream);
      expect(mocks.storageMigration.updateAssetOriginalPath).toHaveBeenCalledWith(
        'asset-1',
        baseJob.sourcePath,
        'library/user/ab/cd/file.jpg',
      );
      expect(mocks.storageMigration.createLogEntry).toHaveBeenCalledWith({
        entityType: 'asset',
        entityId: 'asset-1',
        fileType: 'original',
        oldPath: baseJob.sourcePath,
        newPath: 'library/user/ab/cd/file.jpg',
        direction: 'toS3',
        batchId: 'batch-1',
      });
    });

    it('should skip when source file not found and return Skipped', async () => {
      mockDiskBackend.exists.mockResolvedValue(false);

      const result = await sut.handleMigration(baseJob);

      expect(result).toBe(JobStatus.Skipped);
      expect(mockS3Backend.put).not.toHaveBeenCalled();
      expect(mocks.storageMigration.updateAssetOriginalPath).not.toHaveBeenCalled();
    });

    it('should skip copy when target already exists (idempotency) but still update DB and log', async () => {
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(true); // target already exists
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(baseJob);

      expect(result).toBe(JobStatus.Success);
      // Should NOT copy
      expect(mockDiskBackend.get).not.toHaveBeenCalled();
      expect(mockS3Backend.put).not.toHaveBeenCalled();
      // But should update DB and log
      expect(mocks.storageMigration.updateAssetOriginalPath).toHaveBeenCalled();
      expect(mocks.storageMigration.createLogEntry).toHaveBeenCalled();
    });

    it('should skip on optimistic concurrency conflict (0 rows affected) and return Skipped', async () => {
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({
        stream: new Readable({
          read() {
            this.push(null);
          },
        }),
      });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(false); // 0 rows

      const result = await sut.handleMigration(baseJob);

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.storageMigration.createLogEntry).not.toHaveBeenCalled();
    });

    it('should delete source when deleteSource is true', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mockDiskBackend.delete.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration({ ...baseJob, deleteSource: true });

      expect(result).toBe(JobStatus.Success);
      expect(mockDiskBackend.delete).toHaveBeenCalledWith(baseJob.sourcePath);
    });

    it('should not delete source when deleteSource is false', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration({ ...baseJob, deleteSource: false });

      expect(result).toBe(JobStatus.Success);
      expect(mockDiskBackend.delete).not.toHaveBeenCalled();
    });

    it('should return Failed when copy throws an error', async () => {
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockRejectedValue(new Error('Read error'));

      const result = await sut.handleMigration(baseJob);

      expect(result).toBe(JobStatus.Failed);
    });

    it('should handle toDisk direction correctly (S3 source, disk target)', async () => {
      const toDiskJob = {
        entityType: 'asset' as const,
        entityId: 'asset-1',
        fileType: 'original' as string | null,
        sourcePath: 'library/user/ab/cd/file.jpg',
        batchId: 'batch-1',
        direction: 'toDisk' as const,
        deleteSource: false,
      };

      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockS3Backend.exists.mockResolvedValue(true);
      mockDiskBackend.exists.mockResolvedValue(false);
      mockS3Backend.get.mockResolvedValue({ stream: mockStream });
      mockDiskBackend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(toDiskJob);

      expect(result).toBe(JobStatus.Success);
      // For toDisk: source is S3, target is disk
      expect(mockS3Backend.exists).toHaveBeenCalledWith('library/user/ab/cd/file.jpg');
      expect(mockDiskBackend.exists).toHaveBeenCalledWith('/usr/src/app/upload/library/user/ab/cd/file.jpg');
      expect(mockS3Backend.get).toHaveBeenCalledWith('library/user/ab/cd/file.jpg');
      expect(mockDiskBackend.put).toHaveBeenCalledWith('/usr/src/app/upload/library/user/ab/cd/file.jpg', mockStream);
    });

    it('should update encoded video path for encodedVideo file type', async () => {
      const encodedVideoJob = {
        ...baseJob,
        fileType: 'encodedVideo',
        sourcePath: '/usr/src/app/upload/encoded-video/user/ab/cd/video.mp4',
      };

      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetEncodedVideoPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(encodedVideoJob);

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storageMigration.updateAssetEncodedVideoPath).toHaveBeenCalledWith(
        'asset-1',
        encodedVideoJob.sourcePath,
        'encoded-video/user/ab/cd/video.mp4',
      );
    });

    it('should update asset file path for assetFile entity type', async () => {
      const assetFileJob = {
        ...baseJob,
        entityType: 'assetFile' as const,
        entityId: 'file-1',
        fileType: AssetFileType.Thumbnail,
        sourcePath: '/usr/src/app/upload/thumbs/user/ab/cd/thumb.webp',
      };

      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateAssetFilePath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(assetFileJob);

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storageMigration.updateAssetFilePath).toHaveBeenCalledWith(
        'file-1',
        assetFileJob.sourcePath,
        'thumbs/user/ab/cd/thumb.webp',
      );
    });

    it('should update person thumbnail path for person entity type', async () => {
      const personJob = {
        ...baseJob,
        entityType: 'person' as const,
        entityId: 'person-1',
        fileType: null,
        sourcePath: '/usr/src/app/upload/thumbs/user/ab/cd/person.jpeg',
      };

      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updatePersonThumbnailPath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(personJob);

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storageMigration.updatePersonThumbnailPath).toHaveBeenCalledWith(
        'person-1',
        personJob.sourcePath,
        'thumbs/user/ab/cd/person.jpeg',
      );
    });

    it('should update user profile image path for user entity type', async () => {
      const userJob = {
        ...baseJob,
        entityType: 'user' as const,
        entityId: 'user-1',
        fileType: null,
        sourcePath: '/usr/src/app/upload/profile/user/ab/cd/profile.jpg',
      };

      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockDiskBackend.exists.mockResolvedValue(true);
      mockS3Backend.exists.mockResolvedValue(false);
      mockDiskBackend.get.mockResolvedValue({ stream: mockStream });
      mockS3Backend.put.mockResolvedValue(void 0);
      mocks.storageMigration.updateUserProfileImagePath.mockResolvedValue(true);
      mocks.storageMigration.createLogEntry.mockResolvedValue({} as any);

      const result = await sut.handleMigration(userJob);

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storageMigration.updateUserProfileImagePath).toHaveBeenCalledWith(
        'user-1',
        userJob.sourcePath,
        'profile/user/ab/cd/profile.jpg',
      );
    });
  });

  describe('rollback', () => {
    it('should revert paths from migration log and delete log entries', async () => {
      const entries = [
        {
          id: 'log-1',
          entityType: 'asset',
          entityId: 'asset-1',
          fileType: 'original',
          oldPath: '/usr/src/app/upload/library/user/ab/cd/file.jpg',
          newPath: 'library/user/ab/cd/file.jpg',
          direction: 'toS3',
          batchId: 'batch-1',
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          entityType: 'assetFile',
          entityId: 'file-1',
          fileType: AssetFileType.Thumbnail,
          oldPath: '/usr/src/app/upload/thumbs/user/ab/cd/thumb.webp',
          newPath: 'thumbs/user/ab/cd/thumb.webp',
          direction: 'toS3',
          batchId: 'batch-1',
          createdAt: new Date(),
        },
      ];

      mocks.storageMigration.getLogEntriesByBatch.mockResolvedValue(entries as any);
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValue(true);
      mocks.storageMigration.updateAssetFilePath.mockResolvedValue(true);
      mocks.storageMigration.deleteLogEntriesByBatch.mockResolvedValue(undefined as any);

      const result = await sut.rollback('batch-1');

      expect(result).toEqual({ rolledBack: 2, failed: 0, total: 2 });
      // Rollback swaps newPath -> oldPath
      expect(mocks.storageMigration.updateAssetOriginalPath).toHaveBeenCalledWith(
        'asset-1',
        'library/user/ab/cd/file.jpg',
        '/usr/src/app/upload/library/user/ab/cd/file.jpg',
      );
      expect(mocks.storageMigration.updateAssetFilePath).toHaveBeenCalledWith(
        'file-1',
        'thumbs/user/ab/cd/thumb.webp',
        '/usr/src/app/upload/thumbs/user/ab/cd/thumb.webp',
      );
      expect(mocks.storageMigration.deleteLogEntriesByBatch).toHaveBeenCalledWith('batch-1');
    });

    it('should return zero counts when no entries found for batchId', async () => {
      mocks.storageMigration.getLogEntriesByBatch.mockResolvedValue([]);
      mocks.storageMigration.deleteLogEntriesByBatch.mockResolvedValue(undefined as any);

      const result = await sut.rollback('nonexistent-batch');

      expect(result).toEqual({ rolledBack: 0, failed: 0, total: 0 });
      expect(mocks.storageMigration.deleteLogEntriesByBatch).toHaveBeenCalledWith('nonexistent-batch');
    });

    it('should track failed rollbacks and NOT delete log entries if any fail', async () => {
      const entries = [
        {
          id: 'log-1',
          entityType: 'asset',
          entityId: 'asset-1',
          fileType: 'original',
          oldPath: '/usr/src/app/upload/library/user/ab/cd/file.jpg',
          newPath: 'library/user/ab/cd/file.jpg',
          direction: 'toS3',
          batchId: 'batch-1',
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          entityType: 'asset',
          entityId: 'asset-2',
          fileType: 'original',
          oldPath: '/usr/src/app/upload/library/user/ef/gh/file2.jpg',
          newPath: 'library/user/ef/gh/file2.jpg',
          direction: 'toS3',
          batchId: 'batch-1',
          createdAt: new Date(),
        },
      ];

      mocks.storageMigration.getLogEntriesByBatch.mockResolvedValue(entries as any);
      // First succeeds, second fails due to concurrency conflict
      mocks.storageMigration.updateAssetOriginalPath.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const result = await sut.rollback('batch-1');

      expect(result).toEqual({ rolledBack: 1, failed: 1, total: 2 });
      // Should NOT delete log entries when there are failures
      expect(mocks.storageMigration.deleteLogEntriesByBatch).not.toHaveBeenCalled();
    });

    it('should track failed rollbacks when updatePath throws an error', async () => {
      const entries = [
        {
          id: 'log-1',
          entityType: 'asset',
          entityId: 'asset-1',
          fileType: 'original',
          oldPath: '/usr/src/app/upload/library/user/ab/cd/file.jpg',
          newPath: 'library/user/ab/cd/file.jpg',
          direction: 'toS3',
          batchId: 'batch-1',
          createdAt: new Date(),
        },
      ];

      mocks.storageMigration.getLogEntriesByBatch.mockResolvedValue(entries as any);
      mocks.storageMigration.updateAssetOriginalPath.mockRejectedValue(new Error('DB error'));

      const result = await sut.rollback('batch-1');

      expect(result).toEqual({ rolledBack: 0, failed: 1, total: 1 });
      expect(mocks.storageMigration.deleteLogEntriesByBatch).not.toHaveBeenCalled();
    });
  });
});
