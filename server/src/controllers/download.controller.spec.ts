import { Readable } from 'node:stream';
import { DownloadController } from 'src/controllers/download.controller';
import { DownloadService } from 'src/services/download.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

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

  describe('POST /download/archive', () => {
    it('should accept comma-separated assetIds string', async () => {
      const downloadArchiveSpy = vi.spyOn(service, 'downloadArchive');
      service.downloadArchive.mockResolvedValue({ stream: Readable.from('') });

      const ids = [factory.uuid(), factory.uuid()];
      const { status } = await request(ctx.getHttpServer())
        .post(`/download/archive`)
        .type('form')
        .send({ assetIds: ids.join(',') });
      expect(status).toBe(200);
      expect(downloadArchiveSpy).toHaveBeenCalledWith(undefined, { assetIds: ids });
    });

    it('should accept assetIds array', async () => {
      const downloadArchiveSpy = vi.spyOn(service, 'downloadArchive');
      service.downloadArchive.mockResolvedValue({ stream: Readable.from('') });

      const ids = [factory.uuid(), factory.uuid()];
      const { status } = await request(ctx.getHttpServer()).post(`/download/archive`).send({
        assetIds: ids,
      });
      expect(status).toBe(200);
      expect(downloadArchiveSpy).toHaveBeenCalledWith(undefined, { assetIds: ids });
    });
  });
});
