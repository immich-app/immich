import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/system-config', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup();
    nonAdmin = await apiUtils.userSetup(admin.accessToken, createUserDto.user1);
  });

  describe('GET /system-config/map/style.json', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/system-config/map/style.json');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should throw an error if a theme is not light or dark', async () => {
      for (const theme of ['dark1', true, 123, '', null, undefined]) {
        const { status, body } = await request(app)
          .get('/system-config/map/style.json')
          .query({ theme })
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['theme must be one of the following values: light, dark']));
      }
    });

    it('should return the light style.json', async () => {
      const { status, body } = await request(app)
        .get('/system-config/map/style.json')
        .query({ theme: 'light' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-light' }));
    });

    it('should return the dark style.json', async () => {
      const { status, body } = await request(app)
        .get('/system-config/map/style.json')
        .query({ theme: 'dark' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
    });

    it('should not require admin authentication', async () => {
      const { status, body } = await request(app)
        .get('/system-config/map/style.json')
        .query({ theme: 'dark' })
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
    });
  });
});
