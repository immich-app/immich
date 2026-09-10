import { JobController } from 'src/controllers/job.controller';
import { JobService } from 'src/services/job.service';
import { QueueService } from 'src/services/queue.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(JobController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(JobService);
  const queueService = mockBaseService(QueueService);

  beforeAll(async () => {
    ctx = await controllerSetup(JobController, [
      { provide: JobService, useValue: service },
      { provide: QueueService, useValue: queueService },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    queueService.resetAllMocks();
    ctx.reset();
  });

  describe('PUT /jobs/:name', () => {
    it('should require a valid queue name', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put('/jobs/invalid')
        .send({ command: 'start', force: false });

      expect(status).toBe(400);
      expect(queueService.runCommandLegacy).not.toHaveBeenCalled();
    });

    it('should require a valid command', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put('/jobs/metadataExtraction')
        .send({ command: 'invalid', force: false });

      expect(status).toBe(400);
      expect(queueService.runCommandLegacy).not.toHaveBeenCalled();
    });
  });
});
