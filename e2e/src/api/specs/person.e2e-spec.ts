import { LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const invalidBirthday = [
  { birthDate: 'false', response: 'birthDate must be a date string' },
  { birthDate: '123567', response: 'birthDate must be a date string' },
  { birthDate: 123_567, response: 'birthDate must be a date string' },
  { birthDate: new Date(9999, 0, 0).toISOString(), response: ['Birth date cannot be in the future'] },
];

describe('/people', () => {
  let admin: LoginResponseDto;
  let visiblePerson: PersonResponseDto;
  let hiddenPerson: PersonResponseDto;
  let multipleAssetsPerson: PersonResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [visiblePerson, hiddenPerson, multipleAssetsPerson] = await Promise.all([
      utils.createPerson(admin.accessToken, {
        name: 'visible_person',
      }),
      utils.createPerson(admin.accessToken, {
        name: 'hidden_person',
        isHidden: true,
      }),
      utils.createPerson(admin.accessToken, {
        name: 'multiple_assets_person',
      }),
    ]);

    const asset1 = await utils.createAsset(admin.accessToken);
    const asset2 = await utils.createAsset(admin.accessToken);

    await Promise.all([
      utils.createFace({ assetId: asset1.id, personId: visiblePerson.id }),
      utils.createFace({ assetId: asset1.id, personId: hiddenPerson.id }),
      utils.createFace({ assetId: asset1.id, personId: multipleAssetsPerson.id }),
      utils.createFace({ assetId: asset1.id, personId: multipleAssetsPerson.id }),
      utils.createFace({ assetId: asset2.id, personId: multipleAssetsPerson.id }),
    ]);
  });

  describe('GET /people', () => {
    beforeEach(async () => {});

    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/people');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return all people (including hidden)', async () => {
      const { status, body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true });

      expect(status).toBe(200);
      expect(body).toEqual({
        total: 3,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'multiple_assets_person' }),
          expect.objectContaining({ name: 'visible_person' }),
          expect.objectContaining({ name: 'hidden_person' }),
        ],
      });
    });

    it('should return only visible people', async () => {
      const { status, body } = await request(app).get('/people').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        total: 3,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'multiple_assets_person' }),
          expect.objectContaining({ name: 'visible_person' }),
        ],
      });
    });
  });

  describe('GET /people/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/people/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should throw error if person with id does not exist', async () => {
      const { status, body } = await request(app)
        .get(`/people/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should return person information', async () => {
      const { status, body } = await request(app)
        .get(`/people/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: visiblePerson.id }));
    });
  });

  describe('GET /people/:id/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/people/${multipleAssetsPerson.id}/statistics`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should throw error if person with id does not exist', async () => {
      const { status, body } = await request(app)
        .get(`/people/${uuidDto.notFound}/statistics`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should return the correct number of assets', async () => {
      const { status, body } = await request(app)
        .get(`/people/${multipleAssetsPerson.id}/statistics`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ assets: 2 }));
    });
  });

  describe('POST /people', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/people`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const { birthDate, response } of invalidBirthday) {
      it(`should not accept an invalid birth date [${birthDate}]`, async () => {
        const { status, body } = await request(app)
          .post(`/people`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ birthDate });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(response));
      });
    }

    it('should create a person', async () => {
      const { status, body } = await request(app)
        .post(`/people`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'New Person',
          birthDate: '1990-01-01T05:00:00.000Z',
        });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        name: 'New Person',
        birthDate: '1990-01-01T05:00:00.000Z',
      });
    });
  });

  describe('PUT /people/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/people/${uuidDto.notFound}`);
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
          .put(`/people/${visiblePerson.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest([`${key} must be a ${type}`]));
      });
    }

    for (const { birthDate, response } of invalidBirthday) {
      it(`should not accept an invalid birth date [${birthDate}]`, async () => {
        const { status, body } = await request(app)
          .put(`/people/${visiblePerson.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ birthDate });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(response));
      });
    }

    it('should update a date of birth', async () => {
      const { status, body } = await request(app)
        .put(`/people/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ birthDate: '1990-01-01T05:00:00.000Z' });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: '1990-01-01' });
    });

    it('should clear a date of birth', async () => {
      const { status, body } = await request(app)
        .put(`/people/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ birthDate: null });
      expect(status).toBe(200);
      expect(body).toMatchObject({ birthDate: null });
    });
  });
});
