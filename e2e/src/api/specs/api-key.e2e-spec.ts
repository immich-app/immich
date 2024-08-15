import { LoginResponseDto, createApiKey } from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const create = (accessToken: string) =>
  createApiKey({ apiKeyCreateDto: { name: 'api key' } }, { headers: asBearerAuth(accessToken) });

describe('/api-keys', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  beforeEach(async () => {
    await utils.resetDatabase(['api_keys']);
  });

  describe('POST /api-keys', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/api-keys').send({ name: 'API Key' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should create an api key', async () => {
      const { status, body } = await request(app)
        .post('/api-keys')
        .send({ name: 'API Key' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual({
        apiKey: {
          id: expect.any(String),
          name: 'API Key',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        secret: expect.any(String),
      });
      expect(status).toEqual(201);
    });
  });

  describe('GET /api-keys', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/api-keys');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should start off empty', async () => {
      const { status, body } = await request(app).get('/api-keys').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should return a list of api keys', async () => {
      const [{ apiKey: apiKey1 }, { apiKey: apiKey2 }, { apiKey: apiKey3 }] = await Promise.all([
        create(admin.accessToken),
        create(admin.accessToken),
        create(admin.accessToken),
      ]);
      const { status, body } = await request(app).get('/api-keys').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toHaveLength(3);
      expect(body).toEqual(expect.arrayContaining([apiKey1, apiKey2, apiKey3]));
      expect(status).toEqual(200);
    });
  });

  describe('GET /api-keys/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/api-keys/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status, body } = await request(app)
        .get(`/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('API Key not found'));
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .get(`/api-keys/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should get api key details', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status, body } = await request(app)
        .get(`/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.any(String),
        name: 'api key',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('PUT /api-keys/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/api-keys/${uuidDto.notFound}`).send({ name: 'new name' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status, body } = await request(app)
        .put(`/api-keys/${apiKey.id}`)
        .send({ name: 'new name' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('API Key not found'));
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .put(`/api-keys/${uuidDto.invalid}`)
        .send({ name: 'new name' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should update api key details', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status, body } = await request(app)
        .put(`/api-keys/${apiKey.id}`)
        .send({ name: 'new name' })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.any(String),
        name: 'new name',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /api-keys/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/api-keys/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status, body } = await request(app)
        .delete(`/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('API Key not found'));
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .delete(`/api-keys/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should delete an api key', async () => {
      const { apiKey } = await create(user.accessToken);
      const { status } = await request(app)
        .delete(`/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
    });
  });

  describe('authentication', () => {
    it('should work as a header', async () => {
      const { secret } = await create(admin.accessToken);
      const { status, body } = await request(app).get('/api-keys').set('x-api-key', secret);
      expect(body).toHaveLength(1);
      expect(status).toBe(200);
    });

    it('should work as a query param', async () => {
      const { secret } = await create(admin.accessToken);
      const { status, body } = await request(app).get(`/api-keys?apiKey=${secret}`);
      expect(body).toHaveLength(1);
      expect(status).toBe(200);
    });
  });
});
