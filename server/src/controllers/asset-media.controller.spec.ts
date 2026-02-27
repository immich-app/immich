import { AssetMediaController } from 'src/controllers/asset-media.controller';
import { AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AssetMetadataKey } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetMediaService } from 'src/services/asset-media.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

const makeUploadDto = (options?: { omit: string }): Record<string, any> => {
  const dto: Record<string, any> = {
    deviceAssetId: 'example-image',
    deviceId: 'TEST',
    fileCreatedAt: new Date().toISOString(),
    fileModifiedAt: new Date().toISOString(),
    isFavorite: 'false',
    duration: '0:00:00.000000',
  };

  const omit = options?.omit;
  if (omit) {
    delete dto[omit];
  }

  return dto;
};

describe(AssetMediaController.name, () => {
  let ctx: ControllerContext;
  const assetData = Buffer.from('123');
  const filename = 'example.png';
  const service = mockBaseService(AssetMediaService);

  beforeAll(async () => {
    ctx = await controllerSetup(AssetMediaController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: AssetMediaService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    service.uploadAsset.mockResolvedValue({ status: AssetMediaStatus.DUPLICATE, id: factory.uuid() });

    ctx.reset();
  });

  describe('POST /assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post(`/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should accept metadata', async () => {
      const mobileMetadata = { key: AssetMetadataKey.MobileApp, value: { iCloudId: '123' } };
      const { status } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({
          ...makeUploadDto(),
          metadata: JSON.stringify([mobileMetadata]),
        });

      expect(service.uploadAsset).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ metadata: [mobileMetadata] }),
        expect.objectContaining({ originalName: 'example.png' }),
        undefined,
      );

      expect(status).toBe(200);
    });

    it('should handle invalid metadata json', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({
          ...makeUploadDto(),
          metadata: 'not-a-string-string',
        });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['[metadata] Invalid input: expected JSON string, received string']),
      );
    });

    it('should require `deviceAssetId`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'deviceAssetId' }) });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['[deviceAssetId] Invalid input: expected string, received undefined']),
      );
    });

    it('should require `deviceId`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'deviceId' }) });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['[deviceId] Invalid input: expected string, received undefined']),
      );
    });

    it('should require `fileCreatedAt`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'fileCreatedAt' }) });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest([
          '[fileCreatedAt] Invalid input: expected ISO 8601 datetime string, received undefined',
        ]),
      );
    });

    it('should require `fileModifiedAt`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field(makeUploadDto({ omit: 'fileModifiedAt' }));
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest([
          '[fileModifiedAt] Invalid input: expected ISO 8601 datetime string, received undefined',
        ]),
      );
    });

    it('should throw if `isFavorite` is not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto(), isFavorite: 'not-a-boolean' });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['[isFavorite] Invalid option: expected one of "true"|"false"']),
      );
    });

    it('should throw if `visibility` is not an enum', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto(), visibility: 'not-an-option' });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest([expect.stringContaining('[visibility] Invalid option: expected one of')]),
      );
    });

    // TODO figure out how to deal with `sendFile`
    describe.skip('GET /assets/:id/original', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}/original`);
        expect(ctx.authenticate).toHaveBeenCalled();
      });
    });

    // TODO figure out how to deal with `sendFile`
    describe.skip('GET /assets/:id/thumbnail', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}/thumbnail`);
        expect(ctx.authenticate).toHaveBeenCalled();
      });
    });
  });
});
