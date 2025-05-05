import { AlbumController } from 'src/controllers/album.controller';
import { AlbumService } from 'src/services/album.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(AlbumController.name, () => {
  let ctx: ControllerContext;

  beforeAll(async () => {
    ctx = await controllerSetup(AlbumController, [{ provide: AlbumService, useValue: mockBaseService(AlbumService) }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('GET /albums', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/albums');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should reject an invalid shared param', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/albums?shared=invalid');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(['shared must be a boolean value']));
    });

    it('should reject an invalid assetId param', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/albums?assetId=invalid');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.badRequest(['assetId must be a UUID']));
    });
  });

  describe('GET /albums/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/albums/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /albums/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/albums/statistics');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /albums', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/albums').send({ albumName: 'New album' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /albums/:id/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/albums/${factory.uuid()}/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PATCH /albums/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).patch(`/albums/${factory.uuid()}`).send({ albumName: 'New album name' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /albums/:id/assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/albums/${factory.uuid()}/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT :id/users', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/albums/${factory.uuid()}/users`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
