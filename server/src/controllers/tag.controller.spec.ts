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

  describe('PUT /tags/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put('/tags/assets');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /tags/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete('/tags/assets');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /tags/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/tags/assets');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /tags/getAllTagsForAssets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/tags/getAllTagsForAssets?assetIds=${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/tags/getAllTagsForAssets?assetIds=123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['assetIds', 0], message: 'Invalid UUID' }]));
    });

    it('should allow passing an array of assetIds or a single assetId as a string', async () => {
      const uuid1 = factory.uuid();
      const uuid2 = factory.uuid();
      await request(ctx.getHttpServer()).get(`/tags/getAllTagsForAssets?assetIds=${uuid1}`);
      expect(service.getAllForAssets).toHaveBeenCalledWith(undefined, [uuid1]);

      service.resetAllMocks();
      await request(ctx.getHttpServer()).get(`/tags/getAllTagsForAssets?assetIds=${uuid1}&assetIds=${uuid2}`);
      expect(service.getAllForAssets).toHaveBeenCalledWith(undefined, [uuid1, uuid2]);
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
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('PUT /tags/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/tags/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
