import { NotificationController } from 'src/controllers/notification.controller';
import { NotificationService } from 'src/services/notification.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(NotificationController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(NotificationService);

  beforeAll(async () => {
    ctx = await controllerSetup(NotificationController, [{ provide: NotificationService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
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
      await request(ctx.getHttpServer()).put('/notifications');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    describe('ids', () => {
      it('should require a list', async () => {
        const { status, body } = await request(ctx.getHttpServer()).put(`/notifications`).send({ ids: true });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(expect.arrayContaining(['ids must be an array'])));
      });

      it('should require uuids', async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .put(`/notifications`)
          .send({ ids: [true] });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
      });

      it('should accept valid uuids', async () => {
        const id = factory.uuid();
        await request(ctx.getHttpServer())
          .put(`/notifications`)
          .send({ ids: [id] });
        expect(service.updateAll).toHaveBeenCalledWith(undefined, expect.objectContaining({ ids: [id] }));
      });
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

    it('should accept a null readAt', async () => {
      const id = factory.uuid();
      await request(ctx.getHttpServer()).put(`/notifications/${id}`).send({ readAt: null });
      expect(service.update).toHaveBeenCalledWith(undefined, id, expect.objectContaining({ readAt: null }));
    });
  });
});
