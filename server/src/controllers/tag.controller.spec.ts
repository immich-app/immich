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

  describe('POST /tags', () => {
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
    it('should require valid asset uuids', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/tags/assets')
        .send({
          tagIdsToAdd: [factory.uuid()],
          tagIdsToRemove: [factory.uuid()],
          assetIds: ['badid1', 'badid2'],
        });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['assetIds', 1], message: 'Invalid UUID' }]));
    });
    it('should require valid tag to add uuids', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/tags/assets')
        .send({
          tagIdsToAdd: ['badid1', 'badid2'],
          tagIdsToRemove: [factory.uuid()],
          assetIds: [factory.uuid()],
        });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['tagIdsToAdd', 1], message: 'Invalid UUID' }]));
    });
    it('should require valid tag to remove uuids', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/tags/assets')
        .send({
          tagIdsToRemove: ['badid1', 'badid2'],
          tagIdsToAdd: [factory.uuid()],
          assetIds: [factory.uuid()],
        });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['tagIdsToRemove', 1], message: 'Invalid UUID' }]));
    });
    it('should require at least one asset uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/tags/assets').send({ assetIds: [] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['assetIds'], message: 'Too small: expected array to have >=1 items' }]),
      );
    });
  });

  describe('POST /tags/assets/queryTags', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer())
        .post('/tags/assets/queryTags')
        .send({ assetIds: [factory.uuid()] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
    it('should require valid asset uuids', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/tags/assets/queryTags')
        .send({ assetIds: ['badid1', 'badid2'] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['assetIds', 1], message: 'Invalid UUID' }]));
    });
    it('should require at least one asset uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/tags/assets/queryTags').send({ assetIds: [] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['assetIds'], message: 'Too small: expected array to have >=1 items' }]),
      );
    });
  });

  describe('GET /tags/:id', () => {
    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/tags/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('PUT /tags/:id', () => {
    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/tags/123`)
        .send({ name: 'tag', color: '#000000' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
    it('should require a valid color', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/tags/${factory.uuid()}`)
        .send({ name: 'tag', color: 'invalid-color' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          {
            path: ['color'],
            message:
              'Invalid string: must match pattern /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/',
          },
        ]),
      );
    });
    it('should throw an error if a slash is in tag name', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/tags/${factory.uuid()}`)
        .send({ name: 'tagA/tagB', color: '#000000' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['name'], message: 'Tag name cannot contain slash characters ("/")' }]),
      );
    });
    it('should accept a null color', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put(`/tags/${factory.uuid()}`)
        .send({ name: 'tagA', color: null });
      expect(status).toBe(200);
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
