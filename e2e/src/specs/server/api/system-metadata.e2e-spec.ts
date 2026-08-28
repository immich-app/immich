import { LoginResponseDto, getServerConfig } from '@immich/sdk';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/server-info', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
  });

  describe('POST /system-metadata/admin-onboarding', () => {
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
