import { SharedLinkController } from 'src/controllers/shared-link.controller';
import { SharedLinkType } from 'src/enum';
import { SharedLinkService } from 'src/services/shared-link.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SharedLinkController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SharedLinkService);

  beforeAll(async () => {
    ctx = await controllerSetup(SharedLinkController, [{ provide: SharedLinkService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /shared-links', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/shared-links');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should allow an null expiresAt', async () => {
      await request(ctx.getHttpServer())
        .post('/shared-links')
        .send({ expiresAt: null, type: SharedLinkType.Individual });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ expiresAt: null }));
    });
  });
});
