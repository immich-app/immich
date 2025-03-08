import { getPerson, LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const invalidBirthday = [
  {
    birthDate: 'false',
    response: ['birthDate must be a string in the format yyyy-MM-dd', 'Birth date cannot be in the future'],
  },
  {
    birthDate: '123567',
    response: ['birthDate must be a string in the format yyyy-MM-dd', 'Birth date cannot be in the future'],
  },
  {
    birthDate: 123_567,
    response: ['birthDate must be a string in the format yyyy-MM-dd', 'Birth date cannot be in the future'],
  },
  { birthDate: '9999-01-01', response: ['Birth date cannot be in the future'] },
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
        hasNextPage: false,
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
        hasNextPage: false,
        total: 3,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'multiple_assets_person' }),
          expect.objectContaining({ name: 'visible_person' }),
        ],
      });
    });

    it('should support pagination', async () => {
      const { status, body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true, page: 2, size: 1 });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: true,
        total: 3,
        hidden: 1,
        people: [expect.objectContaining({ name: 'visible_person' })],
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
          birthDate: '1990-01-01',
          color: '#333',
        });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        name: 'New Person',
        birthDate: '1990-01-01',
      });
    });

    it('should create a favorite person', async () => {
      const { status, body } = await request(app)
        .post(`/people`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'New Favorite Person',
          isFavorite: true,
        });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        name: 'New Favorite Person',
        isFavorite: true,
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
      { key: 'isFavorite', type: 'boolean value' },
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
        .send({ birthDate: '1990-01-01' });
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

    it('should set a color', async () => {
      const { status, body } = await request(app)
        .put(`/people/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ color: '#555' });
      expect(status).toBe(200);
      expect(body).toMatchObject({ color: '#555' });
    });

    it('should clear a color', async () => {
      const { status, body } = await request(app)
        .put(`/people/${visiblePerson.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ color: null });
      expect(status).toBe(200);
      expect(body.color).toBeUndefined();
    });

    it('should mark a person as favorite', async () => {
      const person = await utils.createPerson(admin.accessToken, {
        name: 'visible_person',
      });

      expect(person.isFavorite).toBe(false);

      const { status, body } = await request(app)
        .put(`/people/${person.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isFavorite: true });
      expect(status).toBe(200);
      expect(body).toMatchObject({ isFavorite: true });

      const person2 = await getPerson({ id: person.id }, { headers: asBearerAuth(admin.accessToken) });
      expect(person2).toMatchObject({ id: person.id, isFavorite: true });
    });
  });

  describe('POST /people/:id/merge', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/people/${uuidDto.notFound}/merge`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not supporting merging a person into themselves', async () => {
      const { status, body } = await request(app)
        .post(`/people/${visiblePerson.id}/merge`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [visiblePerson.id] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Cannot merge a person into themselves'));
    });
  });
});
