import { LoginResponseDto } from '@immich/sdk';
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

  describe('GET /server-info/about', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server-info/about');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return about information', async () => {
      const { status, body } = await request(app)
        .get('/server-info/about')
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

  describe('GET /server-info/storage', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server-info/storage');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return the disk information', async () => {
      const { status, body } = await request(app)
        .get('/server-info/storage')
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

  describe('GET /server-info/ping', () => {
    it('should respond with pong', async () => {
      const { status, body } = await request(app).get('/server-info/ping');
      expect(status).toBe(200);
      expect(body).toEqual({ res: 'pong' });
    });
  });

  describe('GET /server-info/version', () => {
    it('should respond with the server version', async () => {
      const { status, body } = await request(app).get('/server-info/version');
      expect(status).toBe(200);
      expect(body).toEqual({
        major: expect.any(Number),
        minor: expect.any(Number),
        patch: expect.any(Number),
      });
    });
  });

  describe('GET /server-info/features', () => {
    it('should respond with the server features', async () => {
      const { status, body } = await request(app).get('/server-info/features');
      expect(status).toBe(200);
      expect(body).toEqual({
        smartSearch: false,
        configFile: false,
        duplicateDetection: false,
        facialRecognition: false,
        map: true,
        reverseGeocoding: true,
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

  describe('GET /server-info/config', () => {
    it('should respond with the server configuration', async () => {
      const { status, body } = await request(app).get('/server-info/config');
      expect(status).toBe(200);
      expect(body).toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        trashDays: 30,
        userDeleteDelay: 7,
        isInitialized: true,
        externalDomain: '',
        isOnboarded: false,
      });
    });
  });

  describe('GET /server-info/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/server-info/statistics');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .get('/server-info/statistics')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should return the server stats', async () => {
      const { status, body } = await request(app)
        .get('/server-info/statistics')
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

  describe('GET /server-info/media-types', () => {
    it('should return accepted media types', async () => {
      const { status, body } = await request(app).get('/server-info/media-types');
      expect(status).toBe(200);
      expect(body).toEqual({
        sidecar: ['.xmp'],
        image: expect.any(Array),
        video: expect.any(Array),
      });
    });
  });

  describe('GET /server-info/theme', () => {
    it('should respond with the server theme', async () => {
      const { status, body } = await request(app).get('/server-info/theme');
      expect(status).toBe(200);
      expect(body).toEqual({
        customCss: '',
      });
    });
  });
});
