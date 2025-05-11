import { DownloadController } from 'src/controllers/download.controller';
import { DownloadService } from 'src/services/download.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';
import { Readable } from 'typeorm/platform/PlatformTools.js';

describe(DownloadController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(DownloadService);

  beforeAll(async () => {
    ctx = await controllerSetup(DownloadController, [{ provide: DownloadService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /download/info', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer())
        .post('/download/info')
        .send({ assetIds: [factory.uuid()] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /download/archive', () => {
    it('should be an authenticated route', async () => {
      const stream = new Readable({
        read() {
          this.push('test');
          this.push(null);
        },
      });
      service.downloadArchive.mockResolvedValue({ stream });
      await request(ctx.getHttpServer())
        .post('/download/archive')
        .send({ assetIds: [factory.uuid()] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
