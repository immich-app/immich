import request from 'supertest';
import { NotificationAdminController } from 'src/controllers/notification-admin.controller.js';
import { defaults } from 'src/dtos/config.dto.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

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
    it('should accept a null readAt', async () => {
      await request(ctx.getHttpServer())
        .post(`/admin/notifications`)
        .send({ title: 'Test', userId: factory.uuid(), readAt: null });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ readAt: null }));
    });
  });

  describe('POST /admin/notifications/test-apprise', () => {
    const apprise = { ...defaults.notifications.apprise, enabled: true, host: 'apprise', configId: 'immich' };

    it('sends a test notification', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/admin/notifications/test-apprise')
        .send({ ...apprise, tags: 'family, alice' });
      expect(status).toBe(204);
      expect(service.sendTestApprise).toHaveBeenCalledWith(expect.objectContaining({ tags: 'family, alice' }));
    });

    it('rejects tags with unsupported characters', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/admin/notifications/test-apprise')
        .send({ ...apprise, tags: 'family; rm' });
      expect(status).toBe(400);
      expect(service.sendTestApprise).not.toHaveBeenCalled();
    });
  });
});
