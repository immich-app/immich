import { SystemMetadataController } from 'src/controllers/system-metadata.controller';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SystemMetadataController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SystemMetadataService);

  beforeAll(async () => {
    ctx = await controllerSetup(SystemMetadataController, [{ provide: SystemMetadataService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /system-metadata/admin-onboarding', () => {
    it('should require isOnboarded', async () => {
      const { status } = await request(ctx.getHttpServer()).post('/system-metadata/admin-onboarding').send({});

      expect(status).toBe(400);
      expect(service.updateAdminOnboarding).not.toHaveBeenCalled();
    });
  });
});
