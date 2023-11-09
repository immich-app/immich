import { LoginResponseDto } from '@app/domain';
import { ServerInfoController } from '@app/immich';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

describe(`${ServerInfoController.name} (e2e)`, () => {
  let server: any;
  let accessToken: string;
  let loginResponse: LoginResponseDto;

  beforeAll(async () => {
    [server] = await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    loginResponse = await api.authApi.adminLogin(server);
    accessToken = loginResponse.accessToken;
  });

  describe('GET /server-info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/server-info');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return the disk information', async () => {
      const { status, body } = await request(server).get('/server-info').set('Authorization', `Bearer ${accessToken}`);
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
        clipEncode: false,
        configFile: false,
        facialRecognition: false,
        map: true,
        reverseGeocoding: true,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: false,
        sidecar: true,
        tagImage: false,
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
      const loginDto = { email: 'test@immich.app', password: 'Immich123' };
      await api.userApi.create(server, accessToken, { ...loginDto, firstName: 'test', lastName: 'test' });
      const { accessToken: userAccessToken } = await api.authApi.login(server, loginDto);
      const { status, body } = await request(server)
        .get('/server-info/statistics')
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorStub.forbidden);
    });

    it('should return the server stats', async () => {
      const { status, body } = await request(server)
        .get('/server-info/statistics')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        photos: 0,
        usage: 0,
        usageByUser: [
          {
            photos: 0,
            usage: 0,
            userFirstName: 'Immich',
            userId: loginResponse.userId,
            userLastName: 'Admin',
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
});
