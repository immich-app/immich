import { LoginResponseDto, getServerConfig } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/server-info', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  describe('POST /system-metadata/admin-onboarding', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/system-metadata/admin-onboarding').send({ isOnboarded: true });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .post('/system-metadata/admin-onboarding')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send({ isOnboarded: true });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should set admin onboarding', async () => {
      const config = await getServerConfig({});
      expect(config.isOnboarded).toBe(false);

      const { status } = await request(app)
        .post('/system-metadata/admin-onboarding')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isOnboarded: true });
      expect(status).toBe(204);

      const newConfig = await getServerConfig({});
      expect(newConfig.isOnboarded).toBe(true);
    });
  });

  describe('GET /system-metadata/reverse-geocoding-state', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/system-metadata/reverse-geocoding-state');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .get('/system-metadata/reverse-geocoding-state')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should get the reverse geocoding state', async () => {
      const { status, body } = await request(app)
        .get('/system-metadata/reverse-geocoding-state')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        lastUpdate: expect.any(String),
        lastImportFileName: 'cities500.txt',
      });
    });
  });
});
