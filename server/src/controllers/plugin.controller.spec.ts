import { PluginController } from 'src/controllers/plugin.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginService } from 'src/services/plugin.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(PluginController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(PluginService);

  beforeAll(async () => {
    ctx = await controllerSetup(PluginController, [
      { provide: PluginService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /plugins', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/plugins');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/plugins`)
        .query({ id: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('GET /plugins/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/plugins/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/plugins/invalid`)
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });
});
