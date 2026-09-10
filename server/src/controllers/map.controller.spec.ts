import { MapController } from 'src/controllers/map.controller';
import { MapService } from 'src/services/map.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(MapController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(MapService);

  beforeAll(async () => {
    ctx = await controllerSetup(MapController, [{ provide: MapService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /map/reverse-geocode', () => {
    it('should require a lat', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/map/reverse-geocode').query({ lon: 123 });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([{ path: ['lat'], message: 'Invalid input: expected number, received NaN' }]),
      );
      expect(service.reverseGeocode).not.toHaveBeenCalled();
    });

    it('should require a lat that is a number', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get('/map/reverse-geocode')
        .query({ lat: 'abc', lon: 123.456 });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([{ path: ['lat'], message: 'Invalid input: expected number, received NaN' }]),
      );
      expect(service.reverseGeocode).not.toHaveBeenCalled();
    });

    it('should require a lat that is in range', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get('/map/reverse-geocode')
        .query({ lat: 91, lon: 123.456 });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([{ path: ['lat'], message: 'Too big: expected number to be <=90' }]),
      );
      expect(service.reverseGeocode).not.toHaveBeenCalled();
    });

    it('should require a lon', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/map/reverse-geocode').query({ lat: 75 });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([{ path: ['lon'], message: 'Invalid input: expected number, received NaN' }]),
      );
      expect(service.reverseGeocode).not.toHaveBeenCalled();
    });
  });
});
