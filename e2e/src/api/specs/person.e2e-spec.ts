import { LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/activity', () => {
  let admin: LoginResponseDto;
  let visiblePerson: PersonResponseDto;
  let hiddenPerson: PersonResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup();
  });

  beforeEach(async () => {
    await dbUtils.reset(['person']);

    [visiblePerson, hiddenPerson] = await Promise.all([
      apiUtils.createPerson(admin.accessToken, {
        name: 'visible_person',
      }),
      apiUtils.createPerson(admin.accessToken, {
        name: 'hidden_person',
        isHidden: true,
      }),
    ]);

    const asset = await apiUtils.createAsset(admin.accessToken);

    await Promise.all([
      dbUtils.createFace({ assetId: asset.id, personId: visiblePerson.id }),
      dbUtils.createFace({ assetId: asset.id, personId: hiddenPerson.id }),
    ]);
  });

  describe('GET /person', () => {
    beforeEach(async () => {});

    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/person');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return all people (including hidden)', async () => {
      const { status, body } = await request(app)
        .get('/person')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true });

      expect(status).toBe(200);
      expect(body).toEqual({
        total: 2,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'visible_person' }),
          expect.objectContaining({ name: 'hidden_person' }),
        ],
      });
    });

    it('should return only visible people', async () => {
      const { status, body } = await request(app).get('/person').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        total: 2,
        hidden: 1,
        people: [expect.objectContaining({ name: 'visible_person' })],
      });
    });
  });

  describe('GET /person/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/person/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should throw error if person with id does not exist', async () => {
      const { status, body } = await request(app)
        .get(`/person/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should return person information', async () => {
      const { status, body } = await request(app)
        .get(`/person/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: visiblePerson.id }));
    });
  });

  describe('PUT /person/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/person/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const { key, type } of [
      { key: 'name', type: 'string' },
      { key: 'featureFaceAssetId', type: 'string' },
      { key: 'isHidden', type: 'boolean value' },
    ]) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .put(`/person/${visiblePerson.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest([`${key} must be a ${type}`]));
      });
    }

    it('should not accept invalid birth dates', async () => {
      for (const { birthDate, response } of [
        { birthDate: false, response: 'Not found or no person.write access' },
        { birthDate: 'false', response: ['birthDate must be a Date instance'] },
        {
          birthDate: '123567',
          response: 'Not found or no person.write access',
        },
        { birthDate: 123_567, response: 'Not found or no person.write access' },
      ]) {
        const { status, body } = await request(app)
          .put(`/person/${uuidDto.notFound}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ birthDate });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(response));
      }
    });

    it('should update a date of birth', async () => {
      const { status, body } = await request(app)
        .put(`/person/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ birthDate: '1990-01-01T05:00:00.000Z' });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: '1990-01-01' });
    });

    it('should clear a date of birth', async () => {
      // TODO ironically this uses the update endpoint to create the person
      const person = await apiUtils.createPerson(admin.accessToken, {
        birthDate: new Date('1990-01-01').toISOString(),
      });

      expect(person.birthDate).toBeDefined();

      const { status, body } = await request(app)
        .put(`/person/${person.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ birthDate: null });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: null });
    });
  });
});
