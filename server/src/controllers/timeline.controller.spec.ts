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
