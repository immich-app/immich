import { TagController } from 'src/controllers/tag.controller';
import { TagService } from 'src/services/tag.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
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

  describe('POST /tags', () => {
    it('should a null parentId', async () => {
      await request(ctx.getHttpServer()).post(`/tags`).send({ name: 'tag', parentId: null });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ parentId: null }));
    });
  });

  describe('GET /tags/:id', () => {
    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/tags/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('DELETE /tags/:id', () => {
    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/tags/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });
});
