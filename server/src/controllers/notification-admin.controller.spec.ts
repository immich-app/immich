import request from 'supertest';
import { NotificationAdminController } from 'src/controllers/notification-admin.controller.js';
import { Permission } from 'src/enum.js';
import { EmailTemplate } from 'src/repositories/email.repository.js';
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
      await request(ctx.getHttpServer()).post(`/admin/notifications`).send({ title: 'Test', userId: factory.uuid() });

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

  describe('POST /admin/notifications/templates/:name/preview', () => {
    it('should require notification create permission', async () => {
      service.getTemplate.mockResolvedValue({ name: EmailTemplate.WELCOME, html: '' });

      await request(ctx.getHttpServer()).post(`/admin/notifications/templates/welcome/preview`).send({ template: '' });

      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.NotificationCreate, adminRoute: true }),
        }),
      );
    });

    it('should return the html of a form encoded template with its own content security policy', async () => {
      service.getTemplate.mockResolvedValue({ name: EmailTemplate.WELCOME, html: '<p>preview</p>' });

      const { status, headers, text } = await request(ctx.getHttpServer())
        .post(`/admin/notifications/templates/welcome/preview`)
        .type('form')
        .send({ template: '<b>{username}</b>' });

      expect(status).toBe(200);
      expect(headers['content-type']).toBe('text/html; charset=utf-8');
      expect(headers['content-security-policy']).toBe(
        "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'self';sandbox;style-src 'unsafe-inline';img-src https: data:;font-src https:",
      );
      expect(text).toBe('<p>preview</p>');
      expect(service.getTemplate).toHaveBeenCalledWith('welcome', '<b>{username}</b>');
    });

    it('should reject an unknown template name', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post(`/admin/notifications/templates/unknown/preview`)
        .send({ template: '' });

      expect(status).toBe(400);
      expect(service.getTemplate).not.toHaveBeenCalled();
    });
  });
});
