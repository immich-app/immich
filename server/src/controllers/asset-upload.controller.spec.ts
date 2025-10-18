import { createHash, randomUUID } from 'node:crypto';
import { AssetUploadController } from 'src/controllers/asset-upload.controller';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { serializeDictionary } from 'structured-headers';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

const makeAssetData = (overrides?: Partial<any>): string => {
  return serializeDictionary({
    filename: 'test-image.jpg',
    'device-asset-id': 'test-asset-id',
    'device-id': 'test-device',
    'file-created-at': new Date('2025-01-02T00:00:00Z').toISOString(),
    'file-modified-at': new Date('2025-01-01T00:00:00Z').toISOString(),
    'is-favorite': false,
    ...overrides,
  });
};

describe(AssetUploadController.name, () => {
  let ctx: ControllerContext;
  let buffer: Buffer;
  let checksum: string;
  const service = mockBaseService(AssetUploadService);

  beforeAll(async () => {
    ctx = await controllerSetup(AssetUploadController, [{ provide: AssetUploadService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    service.startUpload.mockImplementation((_, __, res, ___) => {
      res.send();
      return Promise.resolve();
    });
    service.resumeUpload.mockImplementation((_, __, res, ___, ____) => {
      res.send();
      return Promise.resolve();
    });
    service.cancelUpload.mockImplementation((_, __, res) => {
      res.send();
      return Promise.resolve();
    });
    service.getUploadStatus.mockImplementation((_, res, __, ___) => {
      res.send();
      return Promise.resolve();
    });
    ctx.reset();

    buffer = Buffer.from(randomUUID());
    checksum = `sha=:${createHash('sha1').update(buffer).digest('base64')}:`;
  });

  describe('POST /upload', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/upload');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require at least version 3 of Upload-Draft-Interop-Version header if provided', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Upload-Draft-Interop-Version', '2')
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining(['version must not be less than 3']),
        }),
      );
    });

    it('should require X-Immich-Asset-Data header', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'x-immich-asset-data header is required' }));
    });

    it('should require Repr-Digest header', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Missing repr-digest header' }));
    });

    it('should allow conventional upload without Upload-Complete header', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(201);
    });

    it('should require Upload-Length header for incomplete upload', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?0')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Missing upload-length header' }));
    });

    it('should infer upload length from content length if complete upload', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .send(buffer);

      expect(status).toBe(201);
    });

    it('should reject invalid Repr-Digest format', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', checksum)
        .set('Repr-Digest', 'invalid-format')
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid repr-digest header' }));
    });

    it('should validate device-asset-id is required in asset data', async () => {
      const assetData = serializeDictionary({
        filename: 'test.jpg',
        'device-id': 'test-device',
        'file-created-at': new Date().toISOString(),
        'file-modified-at': new Date().toISOString(),
      });

      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining([expect.stringContaining('deviceAssetId')]),
        }),
      );
    });

    it('should validate device-id is required in asset data', async () => {
      const assetData = serializeDictionary({
        filename: 'test.jpg',
        'device-asset-id': 'test-asset',
        'file-created-at': new Date().toISOString(),
        'file-modified-at': new Date().toISOString(),
      });

      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining([expect.stringContaining('deviceId')]),
        }),
      );
    });

    it('should validate filename is required in asset data', async () => {
      const assetData = serializeDictionary({
        'device-asset-id': 'test-asset',
        'device-id': 'test-device',
        'file-created-at': new Date().toISOString(),
        'file-modified-at': new Date().toISOString(),
      });

      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining([expect.stringContaining('filename')]),
        }),
      );
    });

    it('should accept Upload-Incomplete header for version 3', async () => {
      const { body, status } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '3')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Incomplete', '?0')
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(body).toEqual({});
      expect(status).not.toBe(400);
    });

    it('should validate Upload-Complete is a boolean structured field', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', 'true')
        .set('Upload-Length', '1024')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'upload-complete must be a structured boolean value' }));
    });

    it('should validate Upload-Length is a positive integer', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', makeAssetData())
        .set('Repr-Digest', checksum)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '-100')
        .send(buffer);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining(['uploadLength must not be less than 1']),
        }),
      );
    });
  });

  describe('PATCH /upload/:id', () => {
    const uploadId = factory.uuid();

    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).patch(`/upload/${uploadId}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require Upload-Draft-Interop-Version header', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Offset', '0')
        .set('Upload-Complete', '?1')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining(['version must be an integer number', 'version must not be less than 3']),
        }),
      );
    });

    it('should require Upload-Offset header', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Complete', '?1')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining([
            'uploadOffset must be an integer number',
            'uploadOffset must not be less than 0',
          ]),
        }),
      );
    });

    it('should require Upload-Complete header', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '0')
        .set('Content-Type', 'application/partial-upload')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: ['uploadComplete must be a boolean value'] }));
    });

    it('should validate UUID parameter', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch('/upload/invalid-uuid')
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '0')
        .set('Upload-Complete', '?0')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: ['id must be a UUID'] }));
    });

    it('should validate Upload-Offset is a non-negative integer', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '-50')
        .set('Upload-Complete', '?0')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: expect.arrayContaining(['uploadOffset must not be less than 0']),
        }),
      );
    });

    it('should require Content-Type: application/partial-upload for version >= 6', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '6')
        .set('Upload-Offset', '0')
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/octet-stream')
        .send(Buffer.from('test'));

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({
          message: ['contentType must be equal to application/partial-upload'],
        }),
      );
    });

    it('should allow other Content-Type for version < 6', async () => {
      const { body } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '3')
        .set('Upload-Offset', '0')
        .set('Upload-Incomplete', '?1')
        .set('Content-Type', 'application/octet-stream')
        .send();

      // Will fail for other reasons, but not content-type validation
      expect(body).not.toEqual(
        expect.objectContaining({
          message: expect.arrayContaining([expect.stringContaining('contentType')]),
        }),
      );
    });

    it('should accept Upload-Incomplete header for version 3', async () => {
      const { status } = await request(ctx.getHttpServer())
        .patch(`/upload/${uploadId}`)
        .set('Upload-Draft-Interop-Version', '3')
        .set('Upload-Offset', '0')
        .set('Upload-Incomplete', '?1')
        .send();

      // Should not fail validation
      expect(status).not.toBe(400);
    });
  });

  describe('DELETE /upload/:id', () => {
    const uploadId = factory.uuid();

    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/upload/${uploadId}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should validate UUID parameter', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete('/upload/invalid-uuid');

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: ['id must be a UUID'] }));
    });
  });

  describe('HEAD /upload/:id', () => {
    const uploadId = factory.uuid();

    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).head(`/upload/${uploadId}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require Upload-Draft-Interop-Version header', async () => {
      const { status } = await request(ctx.getHttpServer()).head(`/upload/${uploadId}`);

      expect(status).toBe(400);
    });

    it('should validate UUID parameter', async () => {
      const { status } = await request(ctx.getHttpServer())
        .head('/upload/invalid-uuid')
        .set('Upload-Draft-Interop-Version', '8');

      expect(status).toBe(400);
    });
  });
});
