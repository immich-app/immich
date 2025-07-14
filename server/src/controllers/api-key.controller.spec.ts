import { APIKeyController } from 'src/controllers/api-key.controller';
import { Permission } from 'src/enum';
import { ApiKeyService } from 'src/services/api-key.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(APIKeyController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(ApiKeyService);

  beforeAll(async () => {
    ctx = await controllerSetup(APIKeyController, [{ provide: ApiKeyService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /api-keys', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/api-keys').send({ name: 'API Key' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /api-keys', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/api-keys');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /api-keys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/api-keys/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/api-keys/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });

  describe('PUT /api-keys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/api-keys/${factory.uuid()}`).send({ name: 'new name' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/api-keys/123`)
        .send({ name: 'new name', permissions: [Permission.ALL] });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });

  describe('DELETE /api-keys/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/api-keys/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/api-keys/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });
});
