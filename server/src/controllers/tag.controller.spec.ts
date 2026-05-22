import { TagController } from 'src/controllers/tag.controller';
import { TagService } from 'src/services/tag.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(TagController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(TagService);

  beforeAll(async () => {
    ctx = await controllerSetup(TagController, [{ provide: TagService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /tags', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/tags');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /tags', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/tags');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should a null parentId', async () => {
      await request(ctx.getHttpServer()).post(`/tags`).send({ name: 'tag', parentId: null });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ parentId: null }));
    });
  });

  describe('PUT /tags', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put('/tags');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /tags/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/tags/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/tags/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('id must be a UUID')]));
    });
  });

  describe('PUT /tags/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/tags/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should allow setting a null color via an empty string', async () => {
      const id = factory.uuid();
      await request(ctx.getHttpServer()).put(`/tags/${id}`).send({ color: '' });
      expect(service.update).toHaveBeenCalledWith(undefined, id, expect.objectContaining({ color: null }));
    });
  });
});
