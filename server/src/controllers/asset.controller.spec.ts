import { AssetController } from 'src/controllers/asset.controller';
import { AssetMetadataKey } from 'src/enum';
import { AssetService } from 'src/services/asset.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(AssetController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(AssetService);

  beforeAll(async () => {
    ctx = await controllerSetup(AssetController, [{ provide: AssetService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
    service.resetAllMocks();
  });

  describe('PUT /assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/assets`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /assets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer())
        .delete(`/assets`)
        .send({ ids: [factory.uuid()] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete(`/assets`)
        .send({ ids: ['123'] });

      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['each value in ids must be a UUID']));
    });
  });

  describe('GET /assets/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/assets/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });
  });

  describe('PUT /assets/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/123`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/assets/123`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });

    it('should reject invalid gps coordinates', async () => {
      for (const test of [
        { latitude: 12 },
        { longitude: 12 },
        { latitude: 12, longitude: 'abc' },
        { latitude: 'abc', longitude: 12 },
        { latitude: null, longitude: 12 },
        { latitude: 12, longitude: null },
        { latitude: 91, longitude: 12 },
        { latitude: -91, longitude: 12 },
        { latitude: 12, longitude: -181 },
        { latitude: 12, longitude: 181 },
      ]) {
        const { status, body } = await request(ctx.getHttpServer()).put(`/assets/${factory.uuid()}`).send(test);
        expect(status).toBe(400);
        expect(body).toEqual(factory.responses.badRequest());
      }
    });

    it('should reject invalid rating', async () => {
      for (const test of [{ rating: 7 }, { rating: 3.5 }, { rating: null }]) {
        const { status, body } = await request(ctx.getHttpServer()).put(`/assets/${factory.uuid()}`).send(test);
        expect(status).toBe(400);
        expect(body).toEqual(factory.responses.badRequest());
      }
    });
  });

  describe('GET /assets/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/statistics`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /assets/random', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/random`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should not allow count to be a string', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/assets/random?count=ABC');
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['count must be a positive number', 'count must be an integer number']),
      );
    });
  });

  describe('GET /assets/:id/metadata', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}/metadata`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /assets/:id/metadata', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/assets/${factory.uuid()}/metadata`).send({ items: [] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/assets/123/metadata`).send({ items: [] });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['id must be a UUID'])));
    });

    it('should require items to be an array', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/assets/${factory.uuid()}/metadata`).send({});
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['items must be an array']));
    });

    it('should require each item to have a valid key', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/assets/${factory.uuid()}/metadata`)
        .send({ items: [{ key: 'someKey' }] });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(
          expect.arrayContaining([expect.stringContaining('items.0.key must be one of the following values')]),
        ),
      );
    });

    it('should require each item to have a value', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/assets/${factory.uuid()}/metadata`)
        .send({ items: [{ key: 'mobile-app', value: null }] });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(expect.arrayContaining([expect.stringContaining('value must be an object')])),
      );
    });

    describe(AssetMetadataKey.MobileApp, () => {
      it('should accept valid data and pass to service correctly', async () => {
        const assetId = factory.uuid();
        const { status } = await request(ctx.getHttpServer())
          .put(`/assets/${assetId}/metadata`)
          .send({ items: [{ key: 'mobile-app', value: { iCloudId: '123' } }] });
        expect(service.upsertMetadata).toHaveBeenCalledWith(undefined, assetId, {
          items: [{ key: 'mobile-app', value: { iCloudId: '123' } }],
        });
        expect(status).toBe(200);
      });

      it('should work without iCloudId', async () => {
        const assetId = factory.uuid();
        const { status } = await request(ctx.getHttpServer())
          .put(`/assets/${assetId}/metadata`)
          .send({ items: [{ key: 'mobile-app', value: {} }] });
        expect(service.upsertMetadata).toHaveBeenCalledWith(undefined, assetId, {
          items: [{ key: 'mobile-app', value: {} }],
        });
        expect(status).toBe(200);
      });
    });
  });

  describe('GET /assets/:id/metadata/:key', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}/metadata/mobile-app`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/assets/123/metadata/mobile-app`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['id must be a UUID'])));
    });

    it('should require a valid key', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/assets/${factory.uuid()}/metadata/invalid`);
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(
          expect.arrayContaining([expect.stringContaining('key must be one of the following value')]),
        ),
      );
    });
  });

  describe('DELETE /assets/:id/metadata/:key', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/assets/${factory.uuid()}/metadata/mobile-app`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/assets/123/metadata/mobile-app`);
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['id must be a UUID']));
    });

    it('should require a valid key', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/assets/${factory.uuid()}/metadata/invalid`);
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest([expect.stringContaining('key must be one of the following values')]),
      );
    });
  });
});
