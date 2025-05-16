import { PersonController } from 'src/controllers/person.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonService } from 'src/services/person.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(PersonController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(PersonService);

  beforeAll(async () => {
    ctx = await controllerSetup(PersonController, [
      { provide: PersonService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /people', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/people');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should require closestPersonId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/people`)
        .query({ closestPersonId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('must be a UUID')]));
    });

    it(`should require closestAssetId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/people`)
        .query({ closestAssetId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('must be a UUID')]));
    });
  });

  describe('POST /people', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/people');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should map an empty birthDate to null', async () => {
      await request(ctx.getHttpServer()).post('/people').send({ birthDate: '' });
      expect(service.create).toHaveBeenCalledWith(undefined, { birthDate: null });
    });
  });

  describe('GET /people/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/people/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /people/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/people/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).put(`/people/123`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest([expect.stringContaining('id must be a UUID')]));
    });

    it(`should not allow a null name`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post(`/people`)
        .send({ name: null })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['name must be a string']));
    });

    it(`should require featureFaceAssetId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ featureFaceAssetId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['featureFaceAssetId must be a UUID']));
    });

    it(`should require isFavorite to be a boolean`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ isFavorite: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isFavorite must be a boolean value']));
    });

    it(`should require isHidden to be a boolean`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ isHidden: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isHidden must be a boolean value']));
    });

    it('should map an empty birthDate to null', async () => {
      const id = factory.uuid();
      await request(ctx.getHttpServer()).put(`/people/${id}`).send({ birthDate: '' });
      expect(service.update).toHaveBeenCalledWith(undefined, id, { birthDate: null });
    });

    it('should not accept an invalid birth date (false)', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ birthDate: false });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          'birthDate must be a string in the format yyyy-MM-dd',
          'Birth date cannot be in the future',
        ]),
      );
    });

    it('should not accept an invalid birth date (number)', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ birthDate: 123_456 });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          'birthDate must be a string in the format yyyy-MM-dd',
          'Birth date cannot be in the future',
        ]),
      );
    });

    it('should not accept a birth date in the future)', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ birthDate: '9999-01-01' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['Birth date cannot be in the future']));
    });
  });

  describe('POST /people/:id/merge', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post(`/people/${factory.uuid()}/merge`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /people/:id/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/people/${factory.uuid()}/statistics`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
