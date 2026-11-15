import request from 'supertest';
import { QueueController } from 'src/controllers/queue.controller.js';
import { QueueService } from 'src/services/queue.service.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(QueueController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(QueueService);

  beforeAll(async () => {
    ctx = await controllerSetup(QueueController, [{ provide: QueueService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /queues/:name/jobs', () => {
    it.each([
      { query: 'status=failed', expected: ['failed'] },
      { query: 'status=failed&status=completed', expected: ['failed', 'completed'] },
      { query: 'status=failed,completed', expected: ['failed', 'completed'] },
    ])('should accept $query', async ({ query, expected }) => {
      service.searchJobs.mockResolvedValue([]);

      const { status } = await request(ctx.getHttpServer()).get(`/queues/thumbnailGeneration/jobs?${query}`);

      expect(status).toBe(200);
      expect(service.searchJobs).toHaveBeenCalledWith(undefined, 'thumbnailGeneration', { status: expected });
    });

    it('should reject an invalid status', async () => {
      const { status } = await request(ctx.getHttpServer()).get(
        '/queues/thumbnailGeneration/jobs?status=failed,invalid',
      );

      expect(status).toBe(400);
      expect(service.searchJobs).not.toHaveBeenCalled();
    });
  });
});
