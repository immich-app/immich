import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const serverLicense = {
  licenseKey: 'IMSV-6ECZ-91TE-WZRM-Q7AQ-MBN4-UW48-2CPT-71X9',
  activationKey:
    '4kJUNUWMq13J14zqPFm1NodRcI6MV6DeOGvQNIgrM8Sc9nv669wyEVvFw1Nz4Kb1W7zLWblOtXEQzpRRqC4r4fKjewJxfbpeo9sEsqAVIfl4Ero-Vp1Dg21-sVdDGZEAy2oeTCXAyCT5d1JqrqR6N1qTAm4xOx9ujXQRFYhjRG8uwudw7_Q49pF18Tj5OEv9qCqElxztoNck4i6O_azsmsoOQrLIENIWPh3EynBN3ESpYERdCgXO8MlWeuG14_V1HbNjnJPZDuvYg__YfMzoOEtfm1sCqEaJ2Ww-BaX7yGfuCL4XsuZlCQQNHjfscy_WywVfIZPKCiW8QR74i0cSzQ',
};

describe('/server', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  describe('GET /server/about', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server/about');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return about information', async () => {
      const { status, body } = await request(app)
        .get('/server/about')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        version: expect.any(String),
        versionUrl: expect.any(String),
        repository: 'immich-app/immich',
        repositoryUrl: 'https://github.com/immich-app/immich',
        build: '1234567890',
        buildUrl: 'https://github.com/immich-app/immich/actions/runs/1234567890',
        buildImage: 'e2e',
        buildImageUrl: 'https://github.com/immich-app/immich/pkgs/container/immich-server',
        sourceRef: 'e2e',
        sourceCommit: 'e2eeeeeeeeeeeeeeeeee',
        sourceUrl: 'https://github.com/immich-app/immich/commit/e2eeeeeeeeeeeeeeeeee',
        nodejs: expect.any(String),
        ffmpeg: expect.any(String),
        imagemagick: expect.any(String),
        libvips: expect.any(String),
        exiftool: expect.any(String),
        licensed: false,
      });
    });
  });

  describe('GET /server/storage', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server/storage');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return the disk information', async () => {
      const { status, body } = await request(app)
        .get('/server/storage')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        diskAvailable: expect.any(String),
        diskAvailableRaw: expect.any(Number),
        diskSize: expect.any(String),
        diskSizeRaw: expect.any(Number),
        diskUsagePercentage: expect.any(Number),
        diskUse: expect.any(String),
        diskUseRaw: expect.any(Number),
      });
    });
  });

  describe('GET /server/ping', () => {
    it('should respond with pong', async () => {
      const { status, body } = await request(app).get('/server/ping');
      expect(status).toBe(200);
      expect(body).toEqual({ res: 'pong' });
    });
  });

  describe('GET /server/version', () => {
    it('should respond with the server version', async () => {
      const { status, body } = await request(app).get('/server/version');
      expect(status).toBe(200);
      expect(body).toEqual({
        major: expect.any(Number),
        minor: expect.any(Number),
        patch: expect.any(Number),
      });
    });
  });

  describe('GET /server/features', () => {
    it('should respond with the server features', async () => {
      const { status, body } = await request(app).get('/server/features');
      expect(status).toBe(200);
      expect(body).toEqual({
        smartSearch: false,
        configFile: false,
        duplicateDetection: false,
        facialRecognition: false,
        map: true,
        reverseGeocoding: true,
        importFaces: false,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: true,
        sidecar: true,
        trash: true,
        email: false,
      });
    });
  });

  describe('GET /server/config', () => {
    it('should respond with the server configuration', async () => {
      const { status, body } = await request(app).get('/server/config');
      expect(status).toBe(200);
      expect(body).toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        trashDays: 30,
        userDeleteDelay: 7,
        isInitialized: true,
        externalDomain: '',
        isOnboarded: false,
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
      });
    });
  });

  describe('GET /server/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server/statistics');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .get('/server/statistics')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should return the server stats', async () => {
      const { status, body } = await request(app)
        .get('/server/statistics')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        photos: 0,
        usage: 0,
        usageByUser: [
          {
            quotaSizeInBytes: null,
            photos: 0,
            usage: 0,
            userName: 'Immich Admin',
            userId: admin.userId,
            videos: 0,
          },
          {
            quotaSizeInBytes: null,
            photos: 0,
            usage: 0,
            userName: 'User 1',
            userId: nonAdmin.userId,
            videos: 0,
          },
        ],
        videos: 0,
      });
    });
  });

  describe('GET /server/media-types', () => {
    it('should return accepted media types', async () => {
      const { status, body } = await request(app).get('/server/media-types');
      expect(status).toBe(200);
      expect(body).toEqual({
        sidecar: ['.xmp'],
        image: expect.any(Array),
        video: expect.any(Array),
      });
    });
  });

  describe('GET /server/theme', () => {
    it('should respond with the server theme', async () => {
      const { status, body } = await request(app).get('/server/theme');
      expect(status).toBe(200);
      expect(body).toEqual({
        customCss: '',
      });
    });
  });

  describe('GET /server/license', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server/license');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .get('/server/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should return the server license', async () => {
      await request(app).put('/server/license').set('Authorization', `Bearer ${admin.accessToken}`).send(serverLicense);
      const { status, body } = await request(app)
        .get('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        ...serverLicense,
        activatedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /server/license', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete('/server/license');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .delete('/server/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should delete the server license', async () => {
      await request(app)
        .delete('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(serverLicense);
      const { status } = await request(app).get('/server/license').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(404);
    });
  });

  describe('PUT /server/license', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/server/license');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .put('/server/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should set the server license', async () => {
      const { status, body } = await request(app)
        .put('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(serverLicense);
      expect(status).toBe(200);
      expect(body).toEqual({ ...serverLicense, activatedAt: expect.any(String) });
      const { body: licenseBody } = await request(app)
        .get('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(licenseBody).toEqual({ ...serverLicense, activatedAt: expect.any(String) });
    });

    it('should reject license not starting with IMSV-', async () => {
      const { status, body } = await request(app)
        .put('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ licenseKey: 'IMCL-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD', activationKey: 'activationKey' });
      expect(status).toBe(400);
      expect(body.message).toBe('Invalid license key');
    });

    it('should reject license with invalid activation key', async () => {
      const { status, body } = await request(app)
        .put('/server/license')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ licenseKey: serverLicense.licenseKey, activationKey: `invalid${serverLicense.activationKey}` });
      expect(status).toBe(400);
      expect(body.message).toBe('Invalid license key');
    });
  });
});
