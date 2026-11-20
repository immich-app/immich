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
    it.each([null, ''])('should store %j as an empty device type and OS', async (value) => {
      const { status } = await request(ctx.getHttpServer())
        .post('/sessions')
        .send({ deviceType: value, deviceOS: value });
      expect(status).toEqual(201);
      expect(service.create).toHaveBeenCalledWith(undefined, { deviceType: '', deviceOS: '' });
    });
  });
});
