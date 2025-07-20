import _ from 'lodash';
import { defaults } from 'src/config';
import { SystemConfigController } from 'src/controllers/system-config.controller';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { SystemConfigService } from 'src/services/system-config.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SystemConfigController.name, () => {
  let ctx: ControllerContext;
  const systemConfigService = mockBaseService(SystemConfigService);
  const templateService = mockBaseService(StorageTemplateService);

  beforeAll(async () => {
    ctx = await controllerSetup(SystemConfigController, [
      { provide: SystemConfigService, useValue: systemConfigService },
      { provide: StorageTemplateService, useValue: templateService },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    systemConfigService.resetAllMocks();
    templateService.resetAllMocks();
    ctx.reset();
  });

  describe('GET /system-config', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/system-config');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /system-config/defaults', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/system-config/defaults');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /system-config', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put('/system-config');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    describe('nightlyTasks', () => {
      it('should validate nightly jobs start time', async () => {
        const config = _.cloneDeep(defaults);
        config.nightlyTasks.startTime = 'invalid';
        const { status, body } = await request(ctx.getHttpServer()).put('/system-config').send(config);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['nightlyTasks.startTime must be in HH:mm format']));
      });

      it('should accept a valid time', async () => {
        const config = _.cloneDeep(defaults);
        config.nightlyTasks.startTime = '05:05';
        const { status } = await request(ctx.getHttpServer()).put('/system-config').send(config);
        expect(status).toBe(200);
      });

      it('should validate a boolean field', async () => {
        const config = _.cloneDeep(defaults);
        (config.nightlyTasks.databaseCleanup as any) = 'invalid';
        const { status, body } = await request(ctx.getHttpServer()).put('/system-config').send(config);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['nightlyTasks.databaseCleanup must be a boolean value']));
      });
    });
  });
});
