import { LoginResponseDto } from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/classification/categories', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  describe('GET /classification/categories', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/classification/categories');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return empty array for new user', async () => {
      const { status, body } = await request(app)
        .get('/classification/categories')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('POST /classification/categories/scan', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/classification/categories/scan');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return 204', async () => {
      const { status } = await request(app)
        .post('/classification/categories/scan')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
    });
  });

  describe('POST /classification/categories', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post('/classification/categories')
        .send({ name: 'Test', prompts: ['test prompt'] });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require name', async () => {
      const { status, body } = await request(app)
        .post('/classification/categories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ prompts: ['test prompt'] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.any(Array)));
    });

    it('should require prompts', async () => {
      const { status, body } = await request(app)
        .post('/classification/categories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Test' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.any(Array)));
    });

    // NOTE: Creating a category requires ML service for encodeText.
    // This test may fail if ML is not available in the E2E environment.
    // If ML is running, it should create the category and return 201.
  });

  describe('PUT /classification/categories/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .put(`/classification/categories/${uuidDto.notFound}`)
        .send({ name: 'Updated' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return 404 for non-existent category', async () => {
      const { status } = await request(app)
        .put(`/classification/categories/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Updated' });
      expect(status).toBe(404);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .put(`/classification/categories/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Updated' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });
  });

  describe('DELETE /classification/categories/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/classification/categories/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return 404 for non-existent category', async () => {
      const { status } = await request(app)
        .delete(`/classification/categories/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(404);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .delete(`/classification/categories/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send();
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });
  });
});
