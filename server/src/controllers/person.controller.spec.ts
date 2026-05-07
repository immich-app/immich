import { PersonController } from 'src/controllers/person.controller';
import { PersonStatisticsResponseDto } from 'src/dtos/person.dto';
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
      expect(body).toEqual(errorDto.badRequest(['[closestPersonId] Invalid UUID']));
    });

    it(`should require closestAssetId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .get(`/people`)
        .query({ closestAssetId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[closestAssetId] Invalid UUID']));
    });

    it('should parse withSharedSpaces and serialize scoped profile fields without raw identity ids', async () => {
      service.getAll.mockResolvedValue({
        total: 1,
        hidden: 0,
        hasNextPage: false,
        people: [
          {
            id: 'space-person-1',
            name: 'Alice',
            birthDate: null,
            thumbnailPath: '',
            isHidden: false,
            type: 'person',
            species: null,
            primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
            filterId: 'space-person:space-person-1',
            numberOfAssets: 4,
          } as any,
        ],
      });

      const { status, body } = await request(ctx.getHttpServer())
        .get('/people')
        .query({ withSharedSpaces: true })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getAll).toHaveBeenCalledWith(undefined, expect.objectContaining({ withSharedSpaces: true }));
      expect(body.people[0].primaryProfile).toEqual({
        type: 'space-person',
        id: 'space-person-1',
        spaceId: 'space-1',
      });
      expect(body.people[0].filterId).toBe('space-person:space-person-1');
      expect(body.people[0].numberOfAssets).toBe(4);
      expect(JSON.stringify(body)).not.toContain(['identity', 'Id'].join(''));
      expect(JSON.stringify(body)).not.toContain(['face', 'identity'].join('_'));
    });
  });

  describe('GET /people/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/people/statistics');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should return people overview statistics', async () => {
      service.getPeopleStatistics.mockResolvedValue({
        total: 7,
        hidden: 2,
        detectedFaceCount: 23,
      });

      const { status, body } = await request(ctx.getHttpServer())
        .get('/people/statistics')
        .query({ withSharedSpaces: true })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getPeopleStatistics).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ withSharedSpaces: true }),
      );
      expect(body).toEqual({
        total: 7,
        hidden: 2,
        detectedFaceCount: 23,
      });
    });
  });

  describe('GET /people/face-statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/people/face-statistics');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should return lazy people face statistics', async () => {
      service.getPeopleFaceStatistics.mockResolvedValue({
        detectedFaceCount: 23,
        assignedVisibleFaceCount: 18,
        namedVisiblePersonCount: 9,
        assignedHiddenFaceCount: 3,
        unassignedFaceCount: 2,
      });

      const { status, body } = await request(ctx.getHttpServer())
        .get('/people/face-statistics')
        .query({ withSharedSpaces: true })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getPeopleFaceStatistics).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ withSharedSpaces: true }),
      );
      expect(body).toEqual({
        detectedFaceCount: 23,
        assignedVisibleFaceCount: 18,
        namedVisiblePersonCount: 9,
        assignedHiddenFaceCount: 3,
        unassignedFaceCount: 2,
      });
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

    it('should map an empty color to null', async () => {
      await request(ctx.getHttpServer()).post('/people').send({ color: '' });
      expect(service.create).toHaveBeenCalledWith(undefined, { color: null });
    });
  });

  describe('POST /people/same-person', () => {
    it('should merge scoped personal and space people', async () => {
      const targetId = factory.uuid();
      const sourceId = factory.uuid();
      const spaceId = factory.uuid();

      const { status } = await request(ctx.getHttpServer())
        .post('/people/same-person')
        .send({
          target: { type: 'person', id: targetId },
          sources: [{ type: 'space-person', id: sourceId, spaceId }],
        })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(204);
      expect(service.mergeScopedPeople).toHaveBeenCalledWith(undefined, {
        target: { type: 'person', id: targetId },
        sources: [{ type: 'space-person', id: sourceId, spaceId }],
      });
    });

    it('should reject raw identity refs', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/people/same-person')
        .send({
          target: { type: 'face-identity', id: factory.uuid() },
          sources: [],
        })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          '[target.type] Invalid option: expected one of "person"|"space-person"',
          '[sources] Too small: expected array to have >=1 items',
        ]),
      );
    });

    it('should require spaceId for space-person refs', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/people/same-person')
        .send({
          target: { type: 'person', id: factory.uuid() },
          sources: [{ type: 'space-person', id: factory.uuid() }],
        })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[sources.0.spaceId] spaceId is required for space-person refs']));
    });
  });

  describe('POST /people/detach-profile', () => {
    it('should detach a scoped profile', async () => {
      const profile = { type: 'person' as const, id: factory.uuid() };

      const { status } = await request(ctx.getHttpServer())
        .post('/people/detach-profile')
        .send({ profile })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(204);
      expect(service.detachScopedPerson).toHaveBeenCalledWith(undefined, { profile });
    });
  });

  describe('DELETE /people', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete('/people');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require uuids in the body', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .delete('/people')
        .send({ ids: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[ids.0] Invalid UUID']));
    });

    it('should respond with 204', async () => {
      const { status } = await request(ctx.getHttpServer())
        .delete(`/people`)
        .send({ ids: [factory.uuid()] });
      expect(status).toBe(204);
      expect(service.deleteAll).toHaveBeenCalled();
    });
  });

  describe('representative face routes', () => {
    it('should require representative assetFaceId to be a uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put('/people/00000000-0000-4000-8000-000000000001/representative-face')
        .send({ assetFaceId: 'invalid' })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[assetFaceId] Invalid UUID']));
    });

    it('should parse person face page query values', async () => {
      service.getFacesForPicker.mockResolvedValue({ faces: [], hasNextPage: false });

      const { status } = await request(ctx.getHttpServer())
        .get('/people/00000000-0000-4000-8000-000000000001/faces?page=1&size=25')
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getFacesForPicker).toHaveBeenCalledWith(undefined, '00000000-0000-4000-8000-000000000001', {
        page: 1,
        size: 25,
      });
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
      expect(body).toEqual(errorDto.badRequest(['Invalid input: expected object, received undefined']));
    });

    it(`should not allow a null name`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post(`/people`)
        .send({ name: null })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[name] Invalid input: expected string, received null']));
    });

    it(`should require featureFaceAssetId to be a uuid`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ featureFaceAssetId: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[featureFaceAssetId] Invalid UUID']));
    });

    it(`should require isFavorite to be a boolean`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ isFavorite: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isFavorite] Invalid input: expected boolean, received string']));
    });

    it(`should require isHidden to be a boolean`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ isHidden: 'invalid' })
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isHidden] Invalid input: expected boolean, received string']));
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
      expect(body).toEqual(errorDto.badRequest(['[birthDate] Invalid input: expected string, received boolean']));
    });

    it('should not accept an invalid birth date (number)', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ birthDate: 123_456 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[birthDate] Invalid input: expected string, received number']));
    });

    it('should not accept a birth date in the future)', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/people/${factory.uuid()}`)
        .send({ birthDate: '9999-01-01' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[birthDate] Birth date cannot be in the future']));
    });
  });

  describe('DELETE /people/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete(`/people/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer()).delete(`/people/invalid`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[id] Invalid UUID']));
    });

    it('should respond with 204', async () => {
      const { status } = await request(ctx.getHttpServer()).delete(`/people/${factory.uuid()}`);
      expect(status).toBe(204);
      expect(service.delete).toHaveBeenCalled();
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

    it('should return person asset and face statistics', async () => {
      const personId = factory.uuid();
      service.getStatistics.mockResolvedValue({ assets: 7, faces: 10 });

      const { status, body } = await request(ctx.getHttpServer())
        .get(`/people/${personId}/statistics`)
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getStatistics).toHaveBeenCalledWith(undefined, personId);
      expect(body).toEqual({ assets: 7, faces: 10 });
    });

    it('should include faces in the documented person statistics response contract', () => {
      const result = PersonStatisticsResponseDto.schema.safeParse({ assets: 7, faces: 10 });

      expect(result.success).toBe(true);
      if (!result.success) {
        throw new Error('Person statistics response schema should accept faces');
      }
      expect(result.data).toEqual({ assets: 7, faces: 10 });
    });
  });
});
