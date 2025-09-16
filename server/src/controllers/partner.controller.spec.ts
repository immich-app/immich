import { PartnerController } from 'src/controllers/partner.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerService } from 'src/services/partner.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(PartnerController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(PartnerService);

  beforeAll(async () => {
    ctx = await controllerSetup(PartnerController, [
      { provide: PartnerService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /partners', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/partners');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require a direction`, async () => {
      const { status, body } = await request(ctx.getHttpServer()).get(`/partners`).set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          'direction should not be empty',
          expect.stringContaining('direction must be one of the following values:'),
        ]),
      );
    });

    it(`should require direction to be an enum`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/partners`)
        .query({ direction: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([expect.stringContaining('direction must be one of the following values:')]),
      );
    });
  });

  describe('POST /partners', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/partners');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require sharedWithId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post(`/partners`)
        .send({ sharedWithId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('must be a UUID')]));
    });
  });

  describe('PUT /partners/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/partners/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/partners/invalid`)
        .send({ inTimeline: true })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('must be a UUID')]));
    });
  });

  describe('DELETE /partners/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/partners/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require id to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete(`/partners/invalid`)
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('must be a UUID')]));
    });
  });
});
