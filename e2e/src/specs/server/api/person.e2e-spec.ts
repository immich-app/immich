import { getPerson, LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/people', () => {
  let admin: LoginResponseDto;
  let visiblePerson: PersonResponseDto;
  let hiddenPerson: PersonResponseDto;
  let multipleAssetsPerson: PersonResponseDto;

  let nameAlicePerson: PersonResponseDto;
  let nameBobPerson: PersonResponseDto;
  let nameCharliePerson: PersonResponseDto;
  let nameNullPerson4Assets: PersonResponseDto;
  let nameNullPerson3Assets: PersonResponseDto;
  let nameNullPerson1Asset: PersonResponseDto;
  let nameBillPersonFavourite: PersonResponseDto;
  let nameFreddyPersonFavourite: PersonResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [
      visiblePerson,
      hiddenPerson,
      multipleAssetsPerson,
      nameCharliePerson,
      nameBobPerson,
      nameAlicePerson,
      nameNullPerson4Assets,
      nameNullPerson3Assets,
      nameNullPerson1Asset,
      nameBillPersonFavourite,
      nameFreddyPersonFavourite,
    ] = await Promise.all([
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
      // --- Setup for the specific sorting test ---
      utils.createPerson(admin.accessToken, {
        name: 'Charlie',
      }),
      utils.createPerson(admin.accessToken, {
        name: 'Bob',
      }),
      utils.createPerson(admin.accessToken, {
        name: 'Alice',
      }),
      utils.createPerson(admin.accessToken, {
        name: '',
      }),
      utils.createPerson(admin.accessToken, {
        name: '',
      }),
      utils.createPerson(admin.accessToken, {
        name: '',
      }),
      utils.createPerson(admin.accessToken, {
        name: 'Bill',
        isFavorite: true,
      }),
      utils.createPerson(admin.accessToken, {
        name: 'Freddy',
        isFavorite: true,
      }),
    ]);

    const asset1 = await utils.createAsset(admin.accessToken);
    const asset2 = await utils.createAsset(admin.accessToken);
    const asset3 = await utils.createAsset(admin.accessToken);
    const asset4 = await utils.createAsset(admin.accessToken);

    await Promise.all([
      utils.createFace({ assetId: asset1.id, faceClusterId: visiblePerson.faceClusterId }),
      utils.createFace({ assetId: asset1.id, faceClusterId: hiddenPerson.faceClusterId }),
      utils.createFace({ assetId: asset1.id, faceClusterId: multipleAssetsPerson.faceClusterId }),
      utils.createFace({ assetId: asset1.id, faceClusterId: multipleAssetsPerson.faceClusterId }),
      utils.createFace({ assetId: asset2.id, faceClusterId: multipleAssetsPerson.faceClusterId }),
      utils.createFace({ assetId: asset3.id, faceClusterId: multipleAssetsPerson.faceClusterId }), // 4 assets
      // Named persons
      utils.createFace({ assetId: asset1.id, faceClusterId: nameCharliePerson.faceClusterId }), // 1 asset
      utils.createFace({ assetId: asset1.id, faceClusterId: nameBobPerson.faceClusterId }),
      utils.createFace({ assetId: asset2.id, faceClusterId: nameBobPerson.faceClusterId }), // 2 assets
      utils.createFace({ assetId: asset1.id, faceClusterId: nameAlicePerson.faceClusterId }), // 1 asset
      // Null-named person 4 assets
      utils.createFace({ assetId: asset1.id, faceClusterId: nameNullPerson4Assets.faceClusterId }),
      utils.createFace({ assetId: asset2.id, faceClusterId: nameNullPerson4Assets.faceClusterId }),
      utils.createFace({ assetId: asset3.id, faceClusterId: nameNullPerson4Assets.faceClusterId }),
      utils.createFace({ assetId: asset4.id, faceClusterId: nameNullPerson4Assets.faceClusterId }), // 4 assets
      // Null-named person 3 assets
      utils.createFace({ assetId: asset1.id, faceClusterId: nameNullPerson3Assets.faceClusterId }),
      utils.createFace({ assetId: asset2.id, faceClusterId: nameNullPerson3Assets.faceClusterId }),
      utils.createFace({ assetId: asset3.id, faceClusterId: nameNullPerson3Assets.faceClusterId }), // 3 assets
      // Null-named person 1 asset
      utils.createFace({ assetId: asset3.id, faceClusterId: nameNullPerson1Asset.faceClusterId }),
      // Favourite People
      utils.createFace({ assetId: asset1.id, faceClusterId: nameFreddyPersonFavourite.faceClusterId }),
      utils.createFace({ assetId: asset2.id, faceClusterId: nameFreddyPersonFavourite.faceClusterId }),
      utils.createFace({ assetId: asset1.id, faceClusterId: nameBillPersonFavourite.faceClusterId }),
    ]);
  });

  describe('GET /people', () => {
    beforeEach(async () => {});
    it('should return all people (including hidden)', async () => {
      const { status, body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: false,
        total: 11,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'Freddy' }),
          expect.objectContaining({ name: 'Bill' }),
          expect.objectContaining({ name: 'multiple_assets_person' }),
          expect.objectContaining({ name: 'Bob' }),
          expect.objectContaining({ name: 'Alice' }),
          expect.objectContaining({ name: 'Charlie' }),
          expect.objectContaining({ name: 'visible_person' }),
          expect.objectContaining({ id: nameNullPerson4Assets.id, name: '' }),
          expect.objectContaining({ id: nameNullPerson3Assets.id, name: '' }),
          expect.objectContaining({ name: 'hidden_person' }), // Should really be before the null names
        ],
      });
    });

    it('should sort visible people by asset count (desc), then by name (asc, nulls last)', async () => {
      const { status, body } = await request(app).get('/people').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.hasNextPage).toBe(false);
      expect(body.total).toBe(11); // All persons
      expect(body.hidden).toBe(1); // 'hidden_person'

      const people = body.people as PersonResponseDto[];

      expect(people.map((p) => p.id)).toEqual([
        nameFreddyPersonFavourite.id, // name: 'Freddy', count: 2
        nameBillPersonFavourite.id, // name: 'Bill', count: 1
        multipleAssetsPerson.id, // name: 'multiple_assets_person', count: 3
        nameBobPerson.id, // name: 'Bob', count: 2
        nameAlicePerson.id, // name: 'Alice', count: 1
        nameCharliePerson.id, // name: 'Charlie', count: 1
        visiblePerson.id, // name: 'visible_person', count: 1
        nameNullPerson4Assets.id, // name: '', count: 4
        nameNullPerson3Assets.id, // name: '', count: 3
      ]);

      expect(people.some((p) => p.id === hiddenPerson.id)).toBe(false);
    });

    it('should return only visible people', async () => {
      const { status, body } = await request(app).get('/people').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: false,
        total: 11,
        hidden: 1,
        people: [
          expect.objectContaining({ name: 'Freddy' }),
          expect.objectContaining({ name: 'Bill' }),
          expect.objectContaining({ name: 'multiple_assets_person' }),
          expect.objectContaining({ name: 'Bob' }),
          expect.objectContaining({ name: 'Alice' }),
          expect.objectContaining({ name: 'Charlie' }),
          expect.objectContaining({ name: 'visible_person' }),
          expect.objectContaining({ id: nameNullPerson4Assets.id, name: '' }),
          expect.objectContaining({ id: nameNullPerson3Assets.id, name: '' }),
        ],
      });
    });

    it('should support pagination', async () => {
      const { status, body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true, page: 5, size: 1 });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: true,
        total: 11,
        hidden: 1,
        people: [expect.objectContaining({ name: 'Alice' })],
      });
    });
  });

  describe('GET /people/:id', () => {
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
      expect(body).toEqual(expect.objectContaining({ assets: 3 }));
    });
  });

  describe('POST /people', () => {
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
