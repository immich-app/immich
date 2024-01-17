import { LoginResponseDto } from '@app/domain';
import { ServerInfoController } from '@app/immich';
import { errorStub, userDto } from '@test/fixtures';
import request from 'supertest';
import { api } from '../client';
import { testApp } from '../utils';

describe(`${ServerInfoController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    server = (await testApp.create()).getHttpServer();

    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    await api.userApi.create(server, admin.accessToken, userDto.user1);
    nonAdmin = await api.authApi.login(server, userDto.user1);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  describe('GET /server-info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/server-info');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return the disk information', async () => {
      const { status, body } = await request(server)
        .get('/server-info')
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
      const { status, body } = await request(server).get('/server-info/ping');
      expect(status).toBe(200);
      expect(body).toEqual({ res: 'pong' });
    });
  });

  describe('GET /server-info/version', () => {
    it('should respond with the server version', async () => {
      const { status, body } = await request(server).get('/server-info/version');
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
      const { status, body } = await request(server).get('/server-info/features');
      expect(status).toBe(200);
      expect(body).toEqual({
        clipEncode: true,
        configFile: false,
        facialRecognition: true,
        map: true,
        reverseGeocoding: true,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: true,
        sidecar: true,
        trash: true,
      });
    });
  });

  describe('GET /server-info/config', () => {
    it('should respond with the server configuration', async () => {
      const { status, body } = await request(server).get('/server-info/config');
      expect(status).toBe(200);
      expect(body).toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        trashDays: 30,
        isInitialized: true,
        externalDomain: '',
        isOnboarded: false,
      });
    });
  });

  describe('GET /server-info/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/server-info/statistics');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(server)
        .get('/server-info/statistics')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorStub.forbidden);
    });

    it('should return the server stats', async () => {
      const { status, body } = await request(server)
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
      const { status, body } = await request(server).get('/server-info/media-types');
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
      const { status, body } = await request(server).get('/server-info/theme');
      expect(status).toBe(200);
      expect(body).toEqual({
        customCss: '',
      });
    });
  });

  describe('POST /server-info/admin-onboarding', () => {
    it('should set admin onboarding', async () => {
      const config = await api.serverInfoApi.getConfig(server);
      expect(config.isOnboarded).toBe(false);

      const { status } = await request(server)
        .post('/server-info/admin-onboarding')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const newConfig = await api.serverInfoApi.getConfig(server);
      expect(newConfig.isOnboarded).toBe(true);
    });
  });
});
