import { TimelineController } from 'src/controllers/timeline.controller';
import { TimelineService } from 'src/services/timeline.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(TimelineController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(TimelineService);

  beforeAll(async () => {
    ctx = await controllerSetup(TimelineController, [{ provide: TimelineService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /timeline/buckets', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/timeline/buckets');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should parse bbox query string into an object', async () => {
      const { status } = await request(ctx.getHttpServer())
        .get('/timeline/buckets')
        .query({ bbox: '11.075683,49.416711,11.117589,49.454875' });

      expect(status).toBe(200);
      expect(service.getTimeBuckets).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          bbox: { west: 11.075_683, south: 49.416_711, east: 11.117_589, north: 49.454_875 },
        }),
      );
    });

    it('should reject incomplete bbox query string', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/timeline/buckets').query({ bbox: '1,2,3' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest(['[bbox] bbox must have 4 comma-separated numbers: west,south,east,north'] as any),
      );
    });

    it('should reject invalid bbox query string', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get('/timeline/buckets')
        .query({ bbox: '1,2,3,invalid' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[bbox] bbox parts must be valid numbers'] as any));
    });
  });

  describe('GET /timeline/bucket', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/timeline/bucket?timeBucket=1900-01-01');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    // TODO enable date string validation while still accepting 5 digit years
    it.fails('should fail if time bucket is invalid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/timeline/bucket').query({ timeBucket: 'foo' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Invalid time bucket format'));
    });
  });
});
