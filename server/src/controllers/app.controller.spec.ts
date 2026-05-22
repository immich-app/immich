import { AppController } from 'src/controllers/app.controller';
import { SystemConfigService } from 'src/services/system-config.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(AppController.name, () => {
  let ctx: ControllerContext;

  beforeAll(async () => {
    ctx = await controllerSetup(AppController, [
      { provide: SystemConfigService, useValue: mockBaseService(SystemConfigService) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('GET /.well-known/immich', () => {
    it('should not be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/.well-known/immich');
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });

    it('should return a 200 status code', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/.well-known/immich');
      expect(status).toBe(200);
      expect(body).toEqual({
        api: {
          endpoint: '/api',
        },
      });
    });
  });

  describe('GET /custom.css', () => {
    it('should not be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/custom.css');
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });

    it('should reply with text/css', async () => {
      const { status, headers } = await request(ctx.getHttpServer()).get('/custom.css');
      expect(status).toBe(200);
      expect(headers['content-type']).toEqual('text/css; charset=utf-8');
    });
  });
});
