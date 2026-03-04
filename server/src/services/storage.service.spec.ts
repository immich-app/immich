import { JobStatus, SystemMetadataKey } from 'src/enum';
import { StorageService } from 'src/services/storage.service';
import { ImmichStartupError } from 'src/utils/misc';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';

describe(StorageService.name, () => {
  let sut: StorageService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StorageService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should enable mount folder checking', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.SystemFlags, {
        mountChecks: {
          backups: true,
          'encoded-video': true,
          library: true,
          profile: true,
          thumbs: true,
          upload: true,
        },
      });
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/encoded-video'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/profile'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/thumbs'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/upload'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/backups'));
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/encoded-video/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/library/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/profile/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/thumbs/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/upload/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/backups/.immich'),
        expect.any(Buffer),
      );
    });

    it('should enable mount folder checking for a new folder type', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        mountChecks: {
          backups: false,
          'encoded-video': true,
          library: false,
          profile: true,
          thumbs: true,
          upload: true,
        },
      });
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.SystemFlags, {
        mountChecks: {
          backups: true,
          'encoded-video': true,
          library: true,
          profile: true,
          thumbs: true,
          upload: true,
        },
      });
      expect(mocks.storage.mkdirSync).toHaveBeenCalledTimes(2);
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/backups'));
      expect(mocks.storage.createFile).toHaveBeenCalledTimes(2);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/library/.immich'),
        expect.any(Buffer),
      );
      expect(mocks.storage.createFile).toHaveBeenCalledWith(
        expect.stringContaining('/data/backups/.immich'),
        expect.any(Buffer),
      );
    });

    it('should throw an error if .immich is missing', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ mountChecks: { upload: true } });
      mocks.storage.readFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to read');

      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should throw an error if .immich is present but read-only', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ mountChecks: { upload: true } });
      mocks.storage.overwriteFile.mockRejectedValue(
        new Error("ENOENT: no such file or directory, open '/app/.immich'"),
      );

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to write');

      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should skip mount file creation if file already exists', async () => {
      const error = new Error('Error creating file') as any;
      error.code = 'EEXIST';
      mocks.systemMetadata.get.mockResolvedValue({ mountChecks: {} });
      mocks.storage.createFile.mockRejectedValue(error);
      mocks.asset.getFileSamples.mockResolvedValue([]);

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.logger.warn).toHaveBeenCalledWith('Found existing mount file, skipping creation');
    });

    it('should throw an error if mount file could not be created', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ mountChecks: {} });
      mocks.storage.createFile.mockRejectedValue(new Error('Error creating file'));

      await expect(sut.onBootstrap()).rejects.toBeInstanceOf(ImmichStartupError);
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should startup if checks are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ mountChecks: { upload: true } });
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: { ignoreMountCheckErrors: true },
        }),
      );
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.storage.overwriteFile.mockRejectedValue(
        new Error("ENOENT: no such file or directory, open '/app/.immich'"),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(SystemMetadataKey.SystemFlags, expect.anything());
    });

    it('should detect media location from /data when it exists', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
          },
        }),
      );
      mocks.storage.existsSync.mockImplementation((path: string) => path === '/data');

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/'));
    });

    it('should fall back to /usr/src/app/upload when both candidates exist', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
          },
        }),
      );
      mocks.storage.existsSync.mockReturnValue(true);

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/usr/src/app/upload/'));
    });

    it('should fall back to /usr/src/app/upload when no candidates exist', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
          },
        }),
      );
      mocks.storage.existsSync.mockReturnValue(false);

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/usr/src/app/upload/'));
    });

    it('should migrate file paths when media location changes', async () => {
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve({ location: '/usr/src/app/upload' });
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([
        { path: '/usr/src/app/upload/library/some-file.jpg' } as any,
      ]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.database.migrateFilePaths).toHaveBeenCalledWith('/usr/src/app/upload', '/data');
    });

    it('should not migrate file paths when media location has not changed', async () => {
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve({ location: '/data' });
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([
        { path: '/data/library/some-file.jpg' } as any,
      ]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.database.migrateFilePaths).not.toHaveBeenCalled();
    });

    it('should throw an error for inconsistent media location', async () => {
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve({ location: '/old-location' });
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([
        { path: '/totally-different/library/some-file.jpg' } as any,
      ]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).rejects.toThrow('Detected an inconsistent media location');
    });

    it('should detect previous location from upload/ prefix in sample path', async () => {
      // To hit the `path.startsWith('upload/')` branch, we need:
      // 1. savedValue?.location to be empty
      // 2. getEnv().storage.mediaLocation to be falsy (so `previous` stays empty)
      // 3. path starts with 'upload/'
      // But mediaLocation is used by detectMediaLocation, so we need it for the current location.
      // We need to use existsSync to set the mediaLocation via detection instead.
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([
        { path: 'upload/library/some-file.jpg' } as any,
      ]);
      // mediaLocation is NOT set so `detectMediaLocation` will be used, and
      // line 152 `!previous && this.configRepository.getEnv().storage.mediaLocation` will be false
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
          },
        }),
      );
      // Only /data exists, so detectMediaLocation returns /data
      mocks.storage.existsSync.mockImplementation((path: string) => path === '/data');

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.database.migrateFilePaths).toHaveBeenCalledWith('upload', '/data');
    });

    it('should use saved media location value if it matches current', async () => {
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve({ location: '/data' });
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(
        SystemMetadataKey.MediaLocation,
        expect.anything(),
      );
    });

    it('should save new media location when it differs from saved value', async () => {
      mocks.systemMetadata.get.mockImplementation((key: string) => {
        if (key === SystemMetadataKey.SystemFlags) {
          return Promise.resolve({
            mountChecks: {
              backups: true,
              'encoded-video': true,
              library: true,
              profile: true,
              thumbs: true,
              upload: true,
            },
          });
        }
        if (key === SystemMetadataKey.MediaLocation) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.MediaLocation,
        { location: '/data' },
      );
    });

    it('should throw ImmichStartupError when s3 backend requested but not configured', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            backend: 's3' as any,
            mediaLocation: '/data',
            s3: {
              bucket: '',
              region: 'us-east-1',
              endpoint: undefined,
              accessKeyId: undefined,
              secretAccessKey: undefined,
              presignedUrlExpiry: 3600,
              serveMode: 'redirect',
            },
          },
        }),
      );

      await expect(sut.onBootstrap()).rejects.toThrow(
        'IMMICH_STORAGE_BACKEND is set to s3 but IMMICH_S3_BUCKET is not configured',
      );
    });

    it('should not skip mount checks when all flags are already set', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        mountChecks: {
          backups: true,
          'encoded-video': true,
          library: true,
          profile: true,
          thumbs: true,
          upload: true,
        },
      });
      mocks.asset.getFileSamples.mockResolvedValue([]);
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          storage: {
            ignoreMountCheckErrors: false,
            mediaLocation: '/data',
          },
        }),
      );

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      // Should not create new mount files since all flags are already set
      expect(mocks.storage.createFile).not.toHaveBeenCalled();
      // Should not update system flags since nothing changed
      expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(SystemMetadataKey.SystemFlags, expect.anything());
    });
  });

  describe('handleDeleteFiles', () => {
    it('should handle null values', async () => {
      await sut.handleDeleteFiles({ files: [undefined, null] });

      expect(mocks.storage.unlink).not.toHaveBeenCalled();
    });

    it('should handle an error removing a file', async () => {
      mocks.storage.unlink.mockRejectedValue(new Error('something-went-wrong'));

      await sut.handleDeleteFiles({ files: ['/path/to/something'] });

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/something');
    });

    it('should remove the file', async () => {
      await sut.handleDeleteFiles({ files: ['/path/to/something'] });

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/something');
    });

    it('should return JobStatus.Success', async () => {
      const result = await sut.handleDeleteFiles({ files: ['/path/to/something'] });
      expect(result).toBe(JobStatus.Success);
    });

    it('should handle multiple files including null values', async () => {
      await sut.handleDeleteFiles({
        files: ['/path/to/file1', null, undefined, '/path/to/file2'],
      });

      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/file1');
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/file2');
    });

    it('should continue deleting files even if one fails', async () => {
      mocks.storage.unlink
        .mockRejectedValueOnce(new Error('first-file-error'))
        .mockResolvedValueOnce(undefined);

      await sut.handleDeleteFiles({ files: ['/path/to/file1', '/path/to/file2'] });

      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/file1');
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/file2');
    });
  });
});
