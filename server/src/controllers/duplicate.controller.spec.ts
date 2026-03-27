import { DuplicateController } from 'src/controllers/duplicate.controller';
import { DuplicateService } from 'src/services/duplicate.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(DuplicateController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(DuplicateService);

  beforeAll(async () => {
    ctx = await controllerSetup(DuplicateController, [{ provide: DuplicateService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /duplicates', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/duplicates');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /duplicates', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete('/duplicates');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /duplicates/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/duplicates/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/duplicates/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });
});
