import { AppController } from 'src/controllers/app.controller.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import request from 'supertest';
import { mockEnvData, newConfigRepositoryMock } from 'test/repositories/config.repository.mock.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(AppController.name, () => {
  let ctx: ControllerContext;
  const configRepository = newConfigRepositoryMock();

  beforeAll(async () => {
    ctx = await controllerSetup(AppController, [
      { provide: SystemConfigService, useValue: mockBaseService(SystemConfigService) },
      { provide: ConfigRepository, useValue: configRepository },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
    configRepository.getEnv.mockReturnValue(mockEnvData({}));
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

    it('should include the configured base path', async () => {
      configRepository.getEnv.mockReturnValue(mockEnvData({ basePath: '/immich' }));

      const { body } = await request(ctx.getHttpServer()).get('/.well-known/immich');

      expect(body.api.endpoint).toBe('/immich/api');
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
