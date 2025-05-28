import { ActivityController } from 'src/controllers/activity.controller';
import { ActivityService } from 'src/services/activity.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(ActivityController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(ActivityService);

  beforeAll(async () => {
    ctx = await controllerSetup(ActivityController, [{ provide: ActivityService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /activities', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/activities');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require an albumId', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/activities');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid albumId', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/activities').query({ albumId: '123' });
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid assetId', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get('/activities')
        .query({ albumId: factory.uuid(), assetId: '123' });
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['assetId must be a UUID'])));
    });
  });

  describe('POST /activities', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/activities');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require an albumId', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/activities').send({ albumId: '123' });
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should require a comment when type is comment', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/activities')
        .send({ albumId: factory.uuid(), type: 'comment', comment: null });
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(['comment must be a string', 'comment should not be empty']));
    });
  });

  describe('DELETE /activities/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/activities/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/activities/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });
});
