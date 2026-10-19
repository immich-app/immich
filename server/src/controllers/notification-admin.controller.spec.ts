import request from 'supertest';
import { NotificationAdminController } from 'src/controllers/notification-admin.controller.js';
import { Permission } from 'src/enum.js';
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

    it('should require notification create permission', async () => {
      await request(ctx.getHttpServer())
        .post(`/admin/notifications`)
        .send({ title: 'Test', userId: factory.uuid() });

      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.NotificationCreate, adminRoute: true }),
        }),
      );
    });
  });

  describe('POST /admin/notifications/test-email', () => {
    it('should require notification create permission', async () => {
      await request(ctx.getHttpServer()).post(`/admin/notifications/test-email`).send({});

      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.NotificationCreate, adminRoute: true }),
        }),
      );
    });
  });

  describe('POST /admin/notifications/templates/:name', () => {
    it('should require notification create permission', async () => {
      await request(ctx.getHttpServer()).post(`/admin/notifications/templates/welcome`).send({ template: '' });

      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.NotificationCreate, adminRoute: true }),
        }),
      );
    });
  });
});
