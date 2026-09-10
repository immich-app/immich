import _ from 'lodash';
import { ConfigAdminController } from 'src/controllers/config-admin.controller';
import { ConfigPublicController } from 'src/controllers/config-public.controller';
import { ConfigUserController } from 'src/controllers/config-user.controller';
import { defaults, mapPublicConfig, mapUserConfig } from 'src/dtos/config.dto';
import { SystemConfigService } from 'src/services/system-config.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

/** Returns a full config that passes Zod validation (required URLs and min lengths). */
function validConfig() {
  const config = _.cloneDeep(defaults) as typeof defaults & {
    oauth: { mobileRedirectUri: string };
    notifications: { smtp: { from: string; transport: { host: string } } };
    server: { externalDomain: string };
  };
  config.oauth.mobileRedirectUri ||= 'https://example.com';
  config.server.externalDomain ||= 'https://example.com';
  config.notifications.smtp.from ||= 'noreply@example.com';
  config.notifications.smtp.transport.host ||= 'localhost';
  return config;
}

describe('config controllers', () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SystemConfigService);

  beforeAll(async () => {
    ctx = await controllerSetup(
      [ConfigAdminController, ConfigUserController, ConfigPublicController],
      [{ provide: SystemConfigService, useValue: service }],
    );
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /admin/config', () => {
    it('should return the full config', async () => {
      service.getAdminConfig.mockResolvedValue(validConfig());

      const { status, body } = await request(ctx.getHttpServer()).get('/admin/config');

      expect(status).toBe(200);
      expect(body.oauth.clientSecret).toBeDefined();
      expect(body.job.thumbnailGeneration).toBeDefined();
    });
  });

  describe('PUT /admin/config', () => {
    it('should accept a valid config', async () => {
      service.updateAdminConfig.mockImplementation((dto) => Promise.resolve(dto));

      const { status } = await request(ctx.getHttpServer()).put('/admin/config').send(validConfig());

      expect(status).toBe(200);
    });

    it('should reject an invalid config', async () => {
      const config = validConfig();
      config.nightlyTasks.startTime = 'invalid';

      const { status, body } = await request(ctx.getHttpServer()).put('/admin/config').send(config);

      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          {
            path: ['nightlyTasks', 'startTime'],
            message: 'Invalid input: expected string in HH:MM format, received string',
          },
        ]),
      );
      expect(service.updateAdminConfig).not.toHaveBeenCalled();
    });
  });

  describe('GET /config', () => {
    it('should return the properties visible to logged in users', async () => {
      service.getUserConfig.mockResolvedValue(mapUserConfig(validConfig()));

      const { status, body } = await request(ctx.getHttpServer()).get('/config');

      expect(status).toBe(200);
      expect(body.image).toEqual({
        thumbnail: { size: defaults.image.thumbnail.size },
        preview: { size: defaults.image.preview.size },
        fullsize: { enabled: defaults.image.fullsize.enabled },
      });
      expect(body.oauth.clientSecret).toBeUndefined();
      expect(body.job).toBeUndefined();
    });
  });

  describe('GET /public/config', () => {
    it('should return the properties visible to everyone', async () => {
      service.getPublicConfig.mockResolvedValue(mapPublicConfig(validConfig()));

      const { status, body } = await request(ctx.getHttpServer()).get('/public/config');

      expect(status).toBe(200);
      expect(body.server).toEqual({ loginPageMessage: defaults.server.loginPageMessage });
      expect(body.oauth).toEqual({
        autoLaunch: defaults.oauth.autoLaunch,
        buttonText: defaults.oauth.buttonText,
        enabled: defaults.oauth.enabled,
      });
      expect(body.image).toBeUndefined();
      expect(body.trash).toBeUndefined();
    });
  });
});
