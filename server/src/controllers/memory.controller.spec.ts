import { MemoryController } from 'src/controllers/memory.controller';
import { MemoryService } from 'src/services/memory.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(MemoryController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(MemoryService);

  beforeAll(async () => {
    ctx = await controllerSetup(MemoryController, [{ provide: MemoryService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /memories', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/memories');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /memories', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/memories');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should validate data when type is on this day', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/memories')
        .send({
          type: 'on_this_day',
          data: {},
          memoryAt: new Date(2021).toISOString(),
        });

      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest(['data.year must be a positive number', 'data.year must be an integer number']),
      );
    });
  });

  describe('GET /memories/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/memories/statistics');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /memories/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/memories/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/memories/invalid`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });
  });

  describe('PUT /memories/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/memories/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/memories/invalid`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });
  });

  describe('DELETE /memories/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/memories/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /memories/:id/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/memories/${factory.uuid()}/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/memories/invalid/assets`).send({ ids: [] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/memories/${factory.uuid()}/assets`)
        .send({ ids: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });
  });

  describe('DELETE /memories/:id/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/memories/${factory.uuid()}/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/memories/invalid/assets`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete(`/memories/${factory.uuid()}/assets`)
        .send({ ids: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });
  });
});
