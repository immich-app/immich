import { NotificationController } from 'src/controllers/notification.controller';
import { NotificationService } from 'src/services/notification.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(NotificationController.name, () => {
  let ctx: ControllerContext;

  beforeAll(async () => {
    ctx = await controllerSetup(NotificationController, [
      { provide: NotificationService, useValue: mockBaseService(NotificationService) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('GET /notifications', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/notifications');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should reject an invalid notification level`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/notifications`)
        .query({ level: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('level must be one of the following values')]));
    });
  });

  describe('PUT /notifications', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/notifications');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /notifications/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/notifications/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/notifications/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('id must be a UUID')]));
    });
  });

  describe('PUT /notifications/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/notifications/${factory.uuid()}`).send({ readAt: factory.date() });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
