import { AssetFileUploadResponseDto, LoginResponseDto, SharedLinkType, getConfig } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const getSystemConfig = (accessToken: string) => getConfig({ headers: asBearerAuth(accessToken) });

describe('/system-config', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;
  let asset: AssetFileUploadResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);

    asset = await utils.createAsset(admin.accessToken);
  });

  describe('GET /system-config/map/style.json', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/system-config/map/style.json');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should allow shared link access', async () => {
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
      });
      const { status, body } = await request(app)
        .get(`/system-config/map/style.json?key=${sharedLink.key}`)
        .query({ theme: 'dark' });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
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

  describe('PUT /system-config', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/system-config');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should always return the new config', async () => {
      const config = await getSystemConfig(admin.accessToken);

      const response1 = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ...config, newVersionCheck: { enabled: false } });

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ...config, newVersionCheck: { enabled: false } });

      const response2 = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ...config, newVersionCheck: { enabled: true } });

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual({ ...config, newVersionCheck: { enabled: true } });
    });

    it('should reject an invalid config entry', async () => {
      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          ...(await getSystemConfig(admin.accessToken)),
          storageTemplate: { enabled: true, hashVerificationEnabled: true, template: '{{foo}}' },
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.stringContaining('Invalid storage template')));
    });
  });
});
