import { NotificationAdminController } from 'src/controllers/notification-admin.controller';
import { NotificationAdminService } from 'src/services/notification-admin.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(NotificationAdminController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(NotificationAdminService);

  beforeAll(async () => {
    ctx = await controllerSetup(NotificationAdminController, [
      { provide: NotificationAdminService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /admin/notifications', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/admin/notifications');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should accept a null readAt', async () => {
      await request(ctx.getHttpServer())
        .post(`/admin/notifications`)
        .send({ title: 'Test', userId: factory.uuid(), readAt: null });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ readAt: null }));
    });
  });
});
