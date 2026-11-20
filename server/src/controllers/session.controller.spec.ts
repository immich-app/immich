import request from 'supertest';
import { SessionController } from 'src/controllers/session.controller.js';
import { SessionService } from 'src/services/session.service.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(SessionController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SessionService);

  beforeAll(async () => {
    ctx = await controllerSetup(SessionController, [{ provide: SessionService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /sessions', () => {
    it('should convert an empty device type and os to null', async () => {
      await request(ctx.getHttpServer()).post('/sessions').send({ deviceType: '', deviceOS: '' });
      expect(service.create).toHaveBeenCalledWith(undefined, { deviceType: null, deviceOS: null });
    });

    it('should accept null device details', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/sessions')
        .send({ deviceType: null, deviceOS: null });
      expect(status).not.toBe(400);
      expect(service.create).toHaveBeenCalledWith(undefined, { deviceType: null, deviceOS: null });
    });
  });
});
