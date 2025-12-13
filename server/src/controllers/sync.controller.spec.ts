import { SyncController } from 'src/controllers/sync.controller';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { SyncService } from 'src/services/sync.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SyncController.name, () => {
  let ctx: ControllerContext;
  const syncService = mockBaseService(SyncService);
  const errorService = { handleError: vi.fn() };

  beforeAll(async () => {
    ctx = await controllerSetup(SyncController, [
      { provide: SyncService, useValue: syncService },
      { provide: GlobalExceptionFilter, useValue: errorService },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    syncService.resetAllMocks();
    errorService.handleError.mockReset();
    ctx.reset();
  });

  describe('POST /sync/stream', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/sync/stream');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require sync request type enums', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/sync/stream')
        .send({ types: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([expect.stringContaining('each value in types must be one of the following values')]),
      );
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /sync/ack', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/sync/ack');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /sync/ack', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/sync/ack');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should not allow more than 1,000 entries', async () => {
      const acks = Array.from({ length: 1001 }, (_, i) => `ack-${i}`);
      const { status, body } = await request(ctx.getHttpServer()).post('/sync/ack').send({ acks });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['acks must contain no more than 1000 elements']));
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /sync/ack', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete('/sync/ack');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require sync response type enums', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete('/sync/ack')
        .send({ types: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([expect.stringContaining('each value in types must be one of the following values')]),
      );
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
