import { WorkflowTrigger } from '@immich/plugin-sdk';
import { WorkflowController } from 'src/controllers/workflow.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { WorkflowService } from 'src/services/workflow.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(WorkflowController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(WorkflowService);

  beforeAll(async () => {
    ctx = await controllerSetup(WorkflowController, [
      { provide: WorkflowService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /workflows', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/workflows').send({});
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require a valid trigger`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post(`/workflows`)
        .send({ trigger: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['trigger'], message: expect.stringContaining('Invalid option: expected one of') },
        ]),
      );
    });

    it(`should require a valid enabled value`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post(`/workflows`)
        .send({ enabled: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['enabled'], message: 'Invalid input: expected boolean, received string' }]),
      );
    });

    it(`should not require a name`, async () => {
      const { status } = await request(ctx.getHttpServer())
        .post(`/workflows`)
        .send({ trigger: WorkflowTrigger.AssetCreate })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(201);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('GET /workflows', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/workflows');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/workflows`)
        .query({ id: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('GET /workflows/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/workflows/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/workflows/invalid`)
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });

  describe('PATCH /workflows/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).patch(`/workflows/${factory.uuid()}`).send({});
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .patch(`/workflows/invalid`)
        .set('Authorization', `Bearer token`)
        .send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: ['id'], message: 'Invalid UUID' }]));
    });
  });
});
