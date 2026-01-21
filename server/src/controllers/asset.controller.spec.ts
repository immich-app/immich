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

  describe('PUT /assets/copy', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/assets/copy`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require target and source id', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put('/assets/copy').send({});
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(expect.arrayContaining(['sourceId must be a UUID', 'targetId must be a UUID'])),
      );
    });

    it('should work', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put('/assets/copy')
        .send({ sourceId: factory.uuid(), targetId: factory.uuid() });
      expect(status).toBe(204);
    });
  });

  describe('PUT /assets/metadata', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/assets/metadata`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid assetId', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put('/assets/metadata')
        .send({ items: [{ assetId: '123', key: 'test', value: {} }] });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['items.0.assetId must be a UUID'])));
    });

    it('should require a key', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put('/assets/metadata')
        .send({ items: [{ assetId: factory.uuid(), value: {} }] });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(
          expect.arrayContaining(['items.0.key must be a string', 'items.0.key should not be empty']),
        ),
      );
    });

    it('should work', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put('/assets/metadata')
        .send({ items: [{ assetId: factory.uuid(), key: AssetMetadataKey.MobileApp, value: { iCloudId: '123' } }] });
      expect(status).toBe(200);
    });
  });

  describe('DELETE /assets/metadata', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/assets/metadata`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid assetId', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete('/assets/metadata')
        .send({ items: [{ assetId: '123', key: 'test' }] });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['items.0.assetId must be a UUID'])));
    });

    it('should require a key', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete('/assets/metadata')
        .send({ items: [{ assetId: factory.uuid() }] });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(
          expect.arrayContaining(['items.0.key must be a string', 'items.0.key should not be empty']),
        ),
      );
    });

    it('should work', async () => {
      const { status } = await request(ctx.getHttpServer())
        .delete('/assets/metadata')
        .send({ items: [{ assetId: factory.uuid(), key: AssetMetadataKey.MobileApp }] });
      expect(status).toBe(204);
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
        .send({ items: [{ value: { some: 'value' } }] });
      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.badRequest(['items.0.key must be a string', 'items.0.key should not be empty']),
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
  });

  describe('PUT /assets/:id/edits', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/assets/${factory.uuid()}/edits`).send({ edits: [] });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should accept valid edits and pass to service correctly', async () => {
      const edits = [
        {
          action: 'crop',
          parameters: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        },
      ];

      const assetId = factory.uuid();
      const { status } = await request(ctx.getHttpServer()).put(`/assets/${assetId}/edits`).send({
        edits,
      });

      expect(service.editAsset).toHaveBeenCalledWith(undefined, assetId, { edits });
      expect(status).toBe(200);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/assets/123/edits`)
        .send({
          edits: [
            {
              action: 'crop',
              parameters: {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
              },
            },
          ],
        });

      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(expect.arrayContaining(['id must be a UUID'])));
    });

    it('should require at least one edit', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/assets/${factory.uuid()}/edits`)
        .send({ edits: [] });
      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.badRequest(['edits must contain at least 1 elements']));
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
  });
});
