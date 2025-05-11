import { AssetMediaController } from 'src/controllers/asset-media.controller';
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
    isFavorite: 'testing',
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

  beforeAll(async () => {
    ctx = await controllerSetup(AssetMediaController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: AssetMediaService, useValue: mockBaseService(AssetMediaService) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('POST /assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post(`/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require `deviceAssetId`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'deviceAssetId' }) });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should require `deviceId`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'deviceId' }) });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should require `fileCreatedAt`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'fileCreatedAt' }) });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should require `fileModifiedAt`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'fileModifiedAt' }) });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should require `duration`', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto({ omit: 'duration' }) });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should throw if `isFavorite` is not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto(), isFavorite: 'not-a-boolean' });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
    });

    it('should throw if `visibility` is not an enum', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/assets')
        .attach('assetData', assetData, filename)
        .field({ ...makeUploadDto(), visibility: 'not-a-boolean' });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest());
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
