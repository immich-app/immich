import { Controller, INestApplication, Post, UseInterceptors } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vitest } from 'vitest';
import { UploadFieldName } from 'src/dtos/asset-media.dto.js';
import { RouteKey } from 'src/enum.js';
import { AuthRequest } from 'src/middleware/auth.guard.js';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { AssetMediaService } from 'src/services/asset-media.service.js';

@Controller(RouteKey.Asset)
@UseInterceptors(FileUploadInterceptor)
class TestAssetController {
  @Post()
  upload() {
    return { status: 'created' };
  }
}

@Controller(RouteKey.User)
@UseInterceptors(FileUploadInterceptor)
class TestUserController {
  @Post('profile-image')
  uploadProfile() {
    return { status: 'created' };
  }
}

describe(FileUploadInterceptor.name, () => {
  let app: INestApplication;
  let sut: FileUploadInterceptor;

  const assetServiceMock = {
    canUploadFile: vitest.fn(),
    getUploadFolder: vitest.fn(),
    getUploadFilename: vitest.fn(),
    onUploadError: vitest.fn(),
  };

  const storageRepositoryMock = {
    createWriteStream: vitest.fn(),
    unlink: vitest.fn(),
  };

  const loggerMock = {
    setContext: vitest.fn(),
    error: vitest.fn(),
    warn: vitest.fn(),
    debug: vitest.fn(),
    verbose: vitest.fn(),
    log: vitest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestAssetController, TestUserController],
      providers: [
        FileUploadInterceptor,
        { provide: Reflector, useValue: new Reflector() },
        { provide: AssetMediaService, useValue: assetServiceMock },
        { provide: StorageRepository, useValue: storageRepositoryMock },
        { provide: LoggingRepository, useValue: loggerMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    sut = moduleRef.get(FileUploadInterceptor);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vitest.clearAllMocks();

    assetServiceMock.canUploadFile.mockReturnValue(true);
    assetServiceMock.getUploadFolder.mockReturnValue('/uploads/user-id/12/34');
    assetServiceMock.getUploadFilename.mockImplementation((req) => {
      const extension = req.fieldName === 'sidecarData' ? '.xmp' : '.jpg';
      return `${req.file.uuid}${extension}`;
    });
    assetServiceMock.onUploadError.mockResolvedValue(undefined);

    storageRepositoryMock.createWriteStream.mockImplementation(() => new PassThrough());
    storageRepositoryMock.unlink.mockResolvedValue(undefined);
  });

  describe('Empty file upload', () => {
    it('should reject with HTTP 400 and delete destination file when assetData is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .attach('assetData', Buffer.alloc(0), 'empty.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('File is empty');
      expect(storageRepositoryMock.createWriteStream).toHaveBeenCalledTimes(1);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(1);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.jpg$/),
      );
    });

    it('should reject with HTTP 400 and delete destination file when profile picture is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/profile-image')
        .attach('file', Buffer.alloc(0), 'empty-profile.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('File is empty');
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(1);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.jpg$/),
      );
    });
  });

  describe('Cleanup failure', () => {
    it('should preserve HTTP 400 and log cleanup failure when unlink throws', async () => {
      const unlinkError = new Error('Disk unlink failure');
      storageRepositoryMock.unlink.mockRejectedValueOnce(unlinkError);

      const response = await request(app.getHttpServer())
        .post('/assets')
        .attach('assetData', Buffer.alloc(0), 'empty.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('File is empty');
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to remove file from disk: /uploads/user-id/12/34/'),
        unlinkError,
      );
    });

    it('should invoke callback exactly once when cleanup fails', async () => {
      const unlinkError = new Error('Disk unlink failure');
      storageRepositoryMock.unlink.mockRejectedValueOnce(unlinkError);

      const mockRequest = new EventEmitter() as AuthRequest;
      const mockFile = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'empty.jpg',
        stream: Readable.from([]),
      } as Express.Multer.File;

      const callback = vitest.fn();

      await new Promise<void>((resolve) => {
        callback.mockImplementation(() => resolve());
        (sut as any).handleFile(mockRequest, mockFile, callback);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: 'File is empty' }));
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to remove file from disk: /uploads/user-id/12/34/'),
        unlinkError,
      );
    });
  });

  describe('Valid non-empty upload', () => {
    it('should retain file and not call unlink for non-empty upload', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .attach('assetData', Buffer.from('valid-image-content'), 'valid.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ status: 'created' });
      expect(storageRepositoryMock.createWriteStream).toHaveBeenCalledTimes(1);
      expect(storageRepositoryMock.unlink).not.toHaveBeenCalled();
    });
  });

  describe('Pipeline failure', () => {
    it('should clean up partially written file and return error when pipeline fails', async () => {
      const streamError = new Error('Pipeline write error');
      storageRepositoryMock.createWriteStream.mockImplementationOnce(() => {
        const stream = new PassThrough();
        queueMicrotask(() => {
          stream.destroy(streamError);
        });
        return stream;
      });

      const mockRequest = new EventEmitter() as AuthRequest;
      const mockFile = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'test.jpg',
        stream: Readable.from([Buffer.from('partial-data')]),
      } as Express.Multer.File;

      const callback = vitest.fn();

      await new Promise<void>((resolve) => {
        callback.mockImplementation(() => resolve());
        (sut as any).handleFile(mockRequest, mockFile, callback);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(streamError);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(1);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.jpg$/),
      );
    });
  });

  describe('Multi-file upload', () => {
    it('should clean up both previously stored file and failing file when second file is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .attach('assetData', Buffer.from('valid-primary-asset'), 'valid.jpg')
        .attach('sidecarData', Buffer.alloc(0), 'empty.xmp');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('File is empty');
      expect(storageRepositoryMock.createWriteStream).toHaveBeenCalledTimes(2);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(2);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.jpg$/),
      );
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.xmp$/),
      );
    });

    it('should clean up previously stored file and failing file when second file encounters pipeline failure', async () => {
      const sidecarError = new Error('Sidecar pipeline error');
      let streamCount = 0;
      storageRepositoryMock.createWriteStream.mockImplementation(() => {
        streamCount++;
        const stream = new PassThrough();
        if (streamCount === 2) {
          queueMicrotask(() => {
            stream.destroy(sidecarError);
          });
        }
        return stream;
      });

      const mockRequest = new EventEmitter() as AuthRequest;
      const primaryFile = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'asset.jpg',
        stream: Readable.from([Buffer.from('valid-asset')]),
      } as Express.Multer.File;

      const sidecarFile = {
        fieldname: UploadFieldName.SIDECAR_DATA,
        originalname: 'sidecar.xmp',
        stream: Readable.from([Buffer.from('broken-sidecar')]),
      } as Express.Multer.File;

      const primaryCallback = vitest.fn();
      const sidecarCallback = vitest.fn();

      await new Promise<void>((resolve) => {
        primaryCallback.mockImplementation(() => resolve());
        (sut as any).handleFile(mockRequest, primaryFile, primaryCallback);
      });

      expect(primaryCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ path: expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.jpg$/) }),
      );
      const storedPath = primaryCallback.mock.calls[0][1].path;

      await new Promise<void>((resolve) => {
        sidecarCallback.mockImplementation(() => resolve());
        (sut as any).handleFile(mockRequest, sidecarFile, sidecarCallback);
      });

      expect(sidecarCallback).toHaveBeenCalledWith(sidecarError);

      const removeCallback = vitest.fn();
      await new Promise<void>((resolve) => {
        removeCallback.mockImplementation(() => resolve());
        (sut as any).removeFile(mockRequest, { path: storedPath } as Express.Multer.File, removeCallback);
      });

      expect(removeCallback).toHaveBeenCalledWith(null);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledTimes(2);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(storedPath);
      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/uploads\/user-id\/12\/34\/.*\.xmp$/),
      );
    });
  });

  describe('removeFile', () => {
    it('should delete file and notify callback with null on success', async () => {
      const callback = vitest.fn();
      const mockRequest = {} as AuthRequest;
      const mockFile = { path: '/uploads/user-id/12/34/file.jpg' } as Express.Multer.File;

      await new Promise<void>((resolve) => {
        callback.mockImplementation(() => resolve());
        (sut as any).removeFile(mockRequest, mockFile, callback);
      });

      expect(storageRepositoryMock.unlink).toHaveBeenCalledWith('/uploads/user-id/12/34/file.jpg');
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should forward unlink error to callback when removeFile fails', async () => {
      const removeError = new Error('Remove file error');
      storageRepositoryMock.unlink.mockRejectedValueOnce(removeError);

      const callback = vitest.fn();
      const mockRequest = {} as AuthRequest;
      const mockFile = { path: '/uploads/user-id/12/34/file.jpg' } as Express.Multer.File;

      await new Promise<void>((resolve) => {
        callback.mockImplementation(() => resolve());
        (sut as any).removeFile(mockRequest, mockFile, callback);
      });

      expect(callback).toHaveBeenCalledWith(removeError);
    });
  });

  describe('Connection reset handling', () => {
    it('should log debug and queue upload error cleanup on ECONNRESET', () => {
      const mockRequest = new EventEmitter() as AuthRequest;
      const mockFile = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'test.jpg',
        stream: new PassThrough(),
      } as unknown as Express.Multer.File;

      const callback = vitest.fn();
      (sut as any).handleFile(mockRequest, mockFile, callback);

      const resetError = Object.assign(new Error('Connection reset'), { code: 'ECONNRESET' });
      mockRequest.emit('error', resetError);

      expect(loggerMock.debug).toHaveBeenCalledWith('Upload was cancelled');
      expect(assetServiceMock.onUploadError).toHaveBeenCalledWith(mockRequest, mockFile);
    });

    it('should log error and queue upload error cleanup on other request errors', () => {
      const mockRequest = new EventEmitter() as AuthRequest;
      const mockFile = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'test.jpg',
        stream: new PassThrough(),
      } as unknown as Express.Multer.File;

      const callback = vitest.fn();
      (sut as any).handleFile(mockRequest, mockFile, callback);

      const networkError = new Error('Socket network error');
      mockRequest.emit('error', networkError);

      expect(loggerMock.error).toHaveBeenCalledWith('Upload failed with: Error: Socket network error');
      expect(assetServiceMock.onUploadError).toHaveBeenCalledWith(mockRequest, mockFile);
    });
  });
});
